import os
import hashlib
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from ..config import settings
from ..models.schemas import FileMetadata
from ..utils.circuit_breaker import circuit_breaker_manager

logger = logging.getLogger(__name__)

class MegaService:
    
    def __init__(self):
        self.email = settings.MEGA_EMAIL
        self.password = settings.MEGA_PASSWORD
        self.base_path = settings.MEGA_FOLDER_PATH
        self.connected = True
        self.processed_files: Dict[str, FileMetadata] = {}
        logger.info("Mega.nz mock service initialized")

    async def list_files_in_folder(self, folder_path: Optional[str] = None) -> List[Dict]:
        
        mock_files = [
            {
                'id': 'blog1',
                'name': 'blog1.txt',
                'size': 1024,
                'hash': 'mock_hash_1',
                'last_modified': datetime.utcnow(),
                'path': '/'
            },
            {
                'id': 'blog2',
                'name': 'blog2.txt',
                'size': 2048,
                'hash': 'mock_hash_2',
                'last_modified': datetime.utcnow(),
                'path': '/'
            },
            {
                'id': 'blog3',
                'name': 'blog3.txt',
                'size': 1536,
                'hash': 'mock_hash_3',
                'last_modified': datetime.utcnow(),
                'path': '/'
            }
        ]
        logger.info(f"Mock: Found {len(mock_files)} .txt files")
        return mock_files

    async def download_file(self, file_id: str, file_name: str) -> Tuple[bytes, str]:
        
        mock_content = f"This is mock content for file: {file_name}\n\nThis is a test blog post.\nIt contains multiple paragraphs about AI and machine learning.\n\nThis is the second paragraph with more content about RAG systems."
        file_hash = hashlib.sha256(mock_content.encode()).hexdigest()
        logger.info(f"Mock: Downloaded file: {file_name}")
        return mock_content.encode(), file_hash

    async def get_file_content(self, file_id: str) -> str:
       
        try:
            file_data, _ = await self.download_file(file_id, "temp.txt")
            return file_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Error getting file content: {str(e)}")
            return ""

    async def check_for_changes(self, current_files: List[Dict]) -> Dict:
        
        result = {'new': [], 'updated': [], 'deleted': [], 'unchanged': []}
        
        processed_ids = set(self.processed_files.keys())
        current_ids = {f['id'] for f in current_files}
        
        for file_id in processed_ids - current_ids:
            result['deleted'].append(file_id)
        
        for file_info in current_files:
            file_id = file_info['id']
            if file_id not in processed_ids:
                result['new'].append(file_info)
            else:
                stored_file = self.processed_files[file_id]
                if file_info.get('hash') != stored_file.hash:
                    result['updated'].append(file_info)
                else:
                    result['unchanged'].append(file_info)
        
        return result

    async def sync_folder(self, force: bool = False) -> Dict:
        
        try:
            current_files = await self.list_files_in_folder()
            
            if not current_files and not force:
                return {'status': 'no_files', 'processed': 0}
            
            changes = await self.check_for_changes(current_files)
            
            processed = {'new': [], 'updated': [], 'deleted': changes['deleted'], 'total': 0}
            
            for file_info in changes['new']:
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
            
            for file_info in changes['updated']:
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
        return self.processed_files.get(file_id)

    async def get_all_processed_files(self) -> List[FileMetadata]:
        return list(self.processed_files.values())

    def get_connection_status(self) -> bool:
        return self.connected

    def reset_connection(self):
        self.connected = True
