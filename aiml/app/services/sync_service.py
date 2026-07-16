import logging
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from ..config import settings
from .mega_service import MegaService
from .rag_service import RAGService
from ..core.exceptions import SyncError

logger = logging.getLogger(__name__)

class SyncService:
    def __init__(self):
        self.mega_service = MegaService()
        self.rag_service = None  # Will be initialized later
        self.is_running = False
        self.sync_interval = settings.SYNC_INTERVAL_MINUTES
        self.last_sync_time: Optional[datetime] = None
        self.sync_status: Dict[str, Any] = {
            "status": "idle",
            "last_sync": None,
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "errors": []
        }
        self._sync_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()
        
    async def start(self):
        if self.is_running:
            logger.warning("Sync service is already running")
            return
        
        # Initialize RAG service
        self.rag_service = RAGService()
        
        logger.info(f"Starting sync service (interval: {self.sync_interval} minutes)")
        self.is_running = True
        self._stop_event.clear()
        
        # Run initial sync
        await self.run_sync()
        
        # Start periodic sync
        self._sync_task = asyncio.create_task(self._sync_loop())
        
    async def stop(self):
        if not self.is_running:
            logger.warning("Sync service is not running")
            return
        
        logger.info("Stopping sync service...")
        self.is_running = False
        self._stop_event.set()
        
        if self._sync_task:
            self._sync_task.cancel()
            try:
                await self._sync_task
            except asyncio.CancelledError:
                pass
            
        logger.info("Sync service stopped")
        
    async def _sync_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(self.sync_interval * 60)
                
                if not self.is_running:
                    break
                
                await self.run_sync()
                
            except asyncio.CancelledError:
                logger.info("Sync loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in sync loop: {str(e)}")
                self.sync_status["errors"].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e)
                })
                continue
                
    async def run_sync(self, force: bool = False) -> Dict[str, Any]:
        logger.info(f"Starting sync (force={force})")
        
        try:
            self.sync_status["status"] = "running"
            
            if not self.rag_service:
                self.rag_service = RAGService()
            
            result = await self.rag_service.sync_all_files()
            
            self.last_sync_time = datetime.utcnow()
            self.sync_status["last_sync"] = self.last_sync_time.isoformat()
            self.sync_status["status"] = "completed" if result.get("status") == "success" else "failed"
            self.sync_status["total_files"] = result.get("total_processed", 0)
            self.sync_status["processed_files"] = result.get("successful", 0)
            self.sync_status["failed_files"] = result.get("failed", 0)
            
            logger.info(f"Sync completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Sync failed: {str(e)}")
            self.sync_status["status"] = "failed"
            self.sync_status["errors"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            })
            raise SyncError(f"Sync failed: {str(e)}")
            
    async def get_status(self) -> Dict[str, Any]:
        files = await self.mega_service.get_all_processed_files()
        
        return {
            "is_running": self.is_running,
            "sync_interval_minutes": self.sync_interval,
            "last_sync": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "total_files": len(files),
            "processed_files": len([f for f in files if hasattr(f, 'chunk_count') and f.chunk_count > 0]),
            "status": self.sync_status["status"],
            "errors": self.sync_status["errors"][-10:],
            "next_sync": (datetime.utcnow() + timedelta(minutes=self.sync_interval)).isoformat()
        }
        
    async def trigger_sync(self, force: bool = False) -> Dict[str, Any]:
        if self.sync_status["status"] == "running":
            return {
                "status": "in_progress",
                "message": "Sync already in progress"
            }
        
        asyncio.create_task(self.run_sync(force))
        
        return {
            "status": "started",
            "message": "Sync started",
            "force": force
        }
        
    async def reset(self):
        logger.info("Resetting sync service...")
        
        self.sync_status = {
            "status": "idle",
            "last_sync": None,
            "total_files": 0,
            "processed_files": 0,
            "failed_files": 0,
            "errors": []
        }
        
        logger.info("Sync service reset completed")
        
    def is_sync_running(self) -> bool:
        return self.sync_status["status"] == "running"


# Global sync service instance
_sync_service: Optional[SyncService] = None


def get_sync_service() -> SyncService:
    global _sync_service
    if _sync_service is None:
        _sync_service = SyncService()
    return _sync_service


# Startup and shutdown functions
async def start_sync_service():
    service = get_sync_service()
    await service.start()
    logger.info("Sync service started")


async def stop_sync_service():
    service = get_sync_service()
    await service.stop()
    logger.info("Sync service stopped")
