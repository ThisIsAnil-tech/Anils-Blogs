import os
import hashlib
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import asyncio
import aiofiles
from mega import Mega
from mega.errors import RequestError
import httpx
from ..config import settings
from ..models.schemas import FileMetadata
from ..utils.circuit_breaker import circuit_breaker_manager
from ..utils.security import SecurityUtils

logger = logging.getLogger(__name__)

class MegaService:
    def __init__(self):
        self.mega = None
        self.connected = False
        self.base_path = settings.MEGA_FOLDER_PATH
        self.processed_files: Dict[str, FileMetadata] = {}
        self._initialize_connection()
        
    def _initialize_connection(self):
        """Initialize Mega.nz connection"""
        try:
            self.mega = Mega()
            self.mega.login(settings.MEGA_EMAIL, settings.MEGA_PASSWORD)
            self.connected = True
            logger.info("Successfully connected to Mega.nz")
        except Exception as e:
            logger.error(f"Failed to connect to Mega.nz: {str(e)}")
            self.connected = False
            raise

    def _get_circuit_breaker(self):
        """Get or create circuit breaker for Mega.nz"""
        return circuit_breaker_manager.get_or_create(
            name="mega_nz",
            failure_threshold=3,
            recovery_timeout=60,
            half_open_timeout=30
        )

    async def list_files_in_folder(self, folder_path: Optional[str] = None) -> List[Dict]:
        """
        List all .txt files in the specified folder
        """
        if not self.connected:
            self._initialize_connection()
        
        def _list_files():
            try:
                # Get all files from Mega
                files = self.mega.get_files()
                txt_files = []
                
                # Navigate to specific folder if path provided
                target_path = folder_path or self.base_path
                
                # Find folder node
                folder_node = None
                for file_id, file_info in files.items():
                    if file_info.get('type') == 1:  # Folder type
                        if file_info.get('name') == target_path.strip('/'):
                            folder_node = file_id
                            break
                
                if not folder_node:
                    # If folder not found, use root
                    folder_node = None
                    logger.warning(f"Folder '{target_path}' not found, using root")
                
                # Get files in folder
                for file_id, file_info in files.items():
                    if file_info.get('type') == 0:  # File type
                        if folder_node and file_info.get('parent') != folder_node:
                            continue
                        
                        if file_info.get('name', '').lower().endswith('.txt'):
                            txt_files.append({
                                'id': file_id,
                                'name': file_info.get('name'),
                                'size': file_info.get('size', 0),
                                'hash': file_info.get('hash', ''),
                                'last_modified': datetime.fromtimestamp(
                                    file_info.get('ts', 0)
                                ) if file_info.get('ts') else datetime.utcnow(),
                                'path': file_info.get('path', '')
                            })
                
                logger.info(f"Found {len(txt_files)} .txt files in Mega.nz")
                return txt_files
                
            except Exception as e:
                logger.error(f"Error listing files from Mega.nz: {str(e)}")
                raise

        # Execute with circuit breaker
        try:
            circuit_breaker = self._get_circuit_breaker()
            result = circuit_breaker.call(_list_files)
            return result
        except Exception as e:
            logger.error(f"Circuit breaker tripped for Mega.nz: {str(e)}")
            raise

    async def download_file(self, file_id: str, file_name: str) -> Tuple[bytes, str]:
        """
        Download a file from Mega.nz
        Returns: (file_content, file_hash)
        """
        if not self.connected:
            self._initialize_connection()
        
        def _download_file():
            try:
                # Get file
                file_info = self.mega.get_files().get(file_id)
                if not file_info:
                    raise Exception(f"File {file_id} not found")
                
                # Download
                file_data = self.mega.download(file_info)
                
                # Calculate hash
                file_hash = hashlib.sha256(file_data).hexdigest()
                
                logger.info(f"Downloaded file: {file_name} ({len(file_data)} bytes)")
                return file_data, file_hash
                
            except Exception as e:
                logger.error(f"Error downloading file {file_name}: {str(e)}")
                raise

        # Execute with circuit breaker
        try:
            circuit_breaker = self._get_circuit_breaker()
            result = circuit_breaker.call(_download_file)
            return result
        except Exception as e:
            logger.error(f"Failed to download file: {str(e)}")
            raise

    async def get_file_content(self, file_id: str) -> str:
        """
        Get file content as text
        """
        try:
            # Download file
            file_data, file_hash = await self.download_file(file_id, "temp.txt")
            
            # Decode content
            try:
                content = file_data.decode('utf-8')
                return content
            except UnicodeDecodeError:
                # Try other encodings
                try:
                    content = file_data.decode('latin-1')
                    return content
                except:
                    logger.warning(f"Could not decode file {file_id}")
                    return ""
                    
        except Exception as e:
            logger.error(f"Error getting file content: {str(e)}")
            return ""

    async def check_for_changes(self, current_files: List[Dict]) -> Dict:
        """
        Check for changes in files compared to processed files
        Returns: {
            'new': [...],
            'updated': [...],
            'deleted': [...],
            'unchanged': [...]
        }
        """
        result = {
            'new': [],
            'updated': [],
            'deleted': [],
            'unchanged': []
        }
        
        # Get current processed files
        processed_file_ids = set(self.processed_files.keys())
        current_file_ids = {f['id'] for f in current_files}
        
        # Check for deleted files
        for file_id in processed_file_ids - current_file_ids:
            result['deleted'].append(file_id)
            logger.info(f"File deleted: {self.processed_files[file_id].name}")
        
        # Check for new or updated files
        for file_info in current_files:
            file_id = file_info['id']
            
            if file_id not in processed_file_ids:
                # New file
                result['new'].append(file_info)
                logger.info(f"New file detected: {file_info['name']}")
            else:
                # Check if updated
                stored_file = self.processed_files[file_id]
                if file_info.get('hash') != stored_file.hash:
                    result['updated'].append(file_info)
                    logger.info(f"File updated: {file_info['name']}")
                else:
                    result['unchanged'].append(file_info)
        
        return result

    async def sync_folder(self, force: bool = False) -> Dict:
        """
        Sync folder with Mega.nz
        """
        try:
            # List current files
            current_files = await self.list_files_in_folder()
            
            if not current_files and not force:
                logger.info("No files found in Mega.nz folder")
                return {'status': 'no_files', 'processed': 0}
            
            # Check for changes
            changes = await self.check_for_changes(current_files)
            
            logger.info(f"Sync changes: New={len(changes['new'])}, "
                       f"Updated={len(changes['updated'])}, "
                       f"Deleted={len(changes['deleted'])}")
            
            # Process changes
            processed = {
                'new': [],
                'updated': [],
                'deleted': changes['deleted'],
                'total': 0
            }
            
            # Process new files
            for file_info in changes['new']:
                try:
                    content = await self.get_file_content(file_info['id'])
                    if content:
                        metadata = FileMetadata(
                            id=file_info['id'],
                            name=file_info['name'],
                            path=file_info.get('path', ''),
                            hash=file_info.get('hash', ''),
                            size=file_info['size'],
                            last_modified=file_info['last_modified'],
                            processed_at=datetime.utcnow(),
                            chunk_count=0
                        )
                        self.processed_files[file_info['id']] = metadata
                        processed['new'].append(file_info)
                        processed['total'] += 1
                except Exception as e:
                    logger.error(f"Error processing new file {file_info['name']}: {str(e)}")
            
            # Process updated files
            for file_info in changes['updated']:
                try:
                    content = await self.get_file_content(file_info['id'])
                    if content:
                        metadata = FileMetadata(
                            id=file_info['id'],
                            name=file_info['name'],
                            path=file_info.get('path', ''),
                            hash=file_info.get('hash', ''),
                            size=file_info['size'],
                            last_modified=file_info['last_modified'],
                            processed_at=datetime.utcnow(),
                            chunk_count=0
                        )
                        self.processed_files[file_info['id']] = metadata
                        processed['updated'].append(file_info)
                        processed['total'] += 1
                except Exception as e:
                    logger.error(f"Error processing updated file {file_info['name']}: {str(e)}")
            
            # Handle deleted files
            for file_id in changes['deleted']:
                if file_id in self.processed_files:
                    del self.processed_files[file_id]
            
            return {
                'status': 'success',
                'processed': processed,
                'total_files': len(self.processed_files),
                'changes': changes
            }
            
        except Exception as e:
            logger.error(f"Error syncing folder: {str(e)}")
            raise

    async def get_file_metadata(self, file_id: str) -> Optional[FileMetadata]:
        """Get metadata for a specific file"""
        return self.processed_files.get(file_id)

    async def get_all_processed_files(self) -> List[FileMetadata]:
        """Get all processed files"""
        return list(self.processed_files.values())

    def get_connection_status(self) -> bool:
        """Check if connected to Mega.nz"""
        return self.connected

    def reset_connection(self):
        """Reset connection"""
        self.connected = False
        self.mega = None
        self._initialize_connection()