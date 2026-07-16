import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends
from datetime import datetime
import time

from ..models.schemas import (
    QueryRequest, QueryResponse, HealthCheck, SyncStatus,
    FileMetadata, ErrorResponse
)
from ..services.rag_service import RAGService
from ..services.mega_service import MegaService
from ..services.pinecone_service import PineconeService
from ..utils.rate_limiter import rate_limit_dependency
from ..utils.circuit_breaker import circuit_breaker_manager
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
rag_service = RAGService()
mega_service = MegaService()
pinecone_service = PineconeService()

# Background sync task
sync_in_progress = False
last_sync_time = None


@router.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        version=settings.APP_VERSION,
        services={
            "mega_nz": mega_service.get_connection_status(),
            "pinecone": pinecone_service.is_initialized(),
            "mistral": rag_service.mistral_service.is_available(),
            "embedding": rag_service.embedding_service.is_available()
        }
    )


@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Detailed health check"""
    return HealthCheck(
        status="healthy",
        version=settings.APP_VERSION,
        services={
            "mega_nz": mega_service.get_connection_status(),
            "pinecone": pinecone_service.is_initialized(),
            "mistral": rag_service.mistral_service.is_available(),
            "embedding": rag_service.embedding_service.is_available()
        }
    )


@router.post("/query", response_model=QueryResponse)
async def query(
    request: Request,
    query_request: QueryRequest,
    rate_limited: bool = Depends(rate_limit_dependency)
):
    """
    Query all documents
    """
    try:
        logger.info(f"Query received: {query_request.query[:50]}...")
        
        response = await rag_service.process_query(
            query_request=query_request,
            endpoint="/query"
        )
        
        logger.info(f"Query processed in {response.processing_time_ms:.2f}ms")
        return response
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@router.post("/blogs/{blog_name}", response_model=QueryResponse)
async def query_blog(
    request: Request,
    blog_name: str,
    query_request: QueryRequest,
    rate_limited: bool = Depends(rate_limit_dependency)
):
    """
    Query specific blog
    """
    try:
        # Validate blog name
        if not blog_name or not blog_name.strip():
            raise HTTPException(
                status_code=400,
                detail="Blog name is required"
            )
        
        # Set blog name in query request
        query_request.blog_name = blog_name.strip()
        
        logger.info(f"Blog query received: {blog_name} - {query_request.query[:50]}...")
        
        response = await rag_service.process_query(
            query_request=query_request,
            endpoint=f"/blogs/{blog_name}"
        )
        
        logger.info(f"Blog query processed in {response.processing_time_ms:.2f}ms")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing blog query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing blog query: {str(e)}"
        )


@router.get("/files", response_model=list)
async def get_files():
    """
    Get all processed files
    """
    try:
        files = await mega_service.get_all_processed_files()
        return [
            {
                "id": f.id,
                "name": f.name,
                "size": f.size,
                "last_modified": f.last_modified.isoformat(),
                "processed_at": f.processed_at.isoformat(),
                "chunk_count": f.chunk_count
            }
            for f in files
        ]
    except Exception as e:
        logger.error(f"Error getting files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting files: {str(e)}"
        )


@router.get("/files/{file_id}", response_model=dict)
async def get_file_metadata(file_id: str):
    """
    Get metadata for a specific file
    """
    try:
        file_metadata = await mega_service.get_file_metadata(file_id)
        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"File with id {file_id} not found"
            )
        
        return {
            "id": file_metadata.id,
            "name": file_metadata.name,
            "path": file_metadata.path,
            "hash": file_metadata.hash,
            "size": file_metadata.size,
            "last_modified": file_metadata.last_modified.isoformat(),
            "processed_at": file_metadata.processed_at.isoformat(),
            "chunk_count": file_metadata.chunk_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file metadata: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting file metadata: {str(e)}"
        )


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file from the system
    """
    try:
        # Check if file exists
        file_metadata = await mega_service.get_file_metadata(file_id)
        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"File with id {file_id} not found"
            )
        
        # Delete from Pinecone
        success = await rag_service.delete_file_index(file_id)
        
        if success:
            # Remove from processed files
            if file_id in mega_service.processed_files:
                del mega_service.processed_files[file_id]
            
            logger.info(f"File deleted: {file_metadata.name}")
            return {
                "success": True,
                "message": f"File {file_metadata.name} deleted successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete file from index"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting file: {str(e)}"
        )


@router.post("/sync", response_model=dict)
async def sync_files(background_tasks: BackgroundTasks, force: bool = False):
    """
    Trigger manual sync
    """
    global sync_in_progress, last_sync_time
    
    if sync_in_progress:
        return {
            "status": "in_progress",
            "message": "Sync already in progress"
        }
    
    background_tasks.add_task(run_sync, force)
    
    return {
        "status": "started",
        "message": "Sync started in background",
        "force": force
    }


@router.get("/sync/status", response_model=SyncStatus)
async def get_sync_status():
    """
    Get sync status
    """
    global sync_in_progress, last_sync_time
    
    files = await mega_service.get_all_processed_files()
    
    return SyncStatus(
        is_syncing=sync_in_progress,
        last_sync=last_sync_time,
        total_files=len(files),
        processed_files=len([f for f in files if f.chunk_count > 0]),
        failed_files=0,  # This would need to be tracked
        files=[{"id": f.id, "name": f.name} for f in files]
    )


@router.post("/sync/reset")
async def reset_index():
    """
    Reset Pinecone index
    """
    try:
        success = await pinecone_service.reset_index()
        if success:
            return {
                "success": True,
                "message": "Index reset successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to reset index"
            )
    except Exception as e:
        logger.error(f"Error resetting index: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error resetting index: {str(e)}"
        )


@router.get("/metrics")
async def get_metrics():
    """
    Get service metrics
    """
    try:
        # Get Pinecone stats
        pinecone_stats = await pinecone_service.get_index_stats()
        
        # Get circuit breaker status
        circuit_status = circuit_breaker_manager.get_all_status()
        
        # Get file count
        files = await mega_service.get_all_processed_files()
        
        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "timestamp": datetime.utcnow().isoformat(),
            "pinecone": {
                "initialized": pinecone_service.is_initialized(),
                "stats": pinecone_stats
            },
            "circuit_breakers": circuit_status,
            "files": {
                "total": len(files),
                "processed": len([f for f in files if f.chunk_count > 0])
            },
            "sync": {
                "in_progress": sync_in_progress,
                "last_sync": last_sync_time.isoformat() if last_sync_time else None
            }
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/circuit-breakers")
async def get_circuit_breakers():
    """
    Get circuit breaker status
    """
    return circuit_breaker_manager.get_all_status()


@router.post("/circuit-breakers/{name}/reset")
async def reset_circuit_breaker(name: str):
    """
    Reset a specific circuit breaker
    """
    try:
        circuit = circuit_breaker_manager.circuits.get(name)
        if not circuit:
            raise HTTPException(
                status_code=404,
                detail=f"Circuit breaker {name} not found"
            )
        
        circuit.reset()
        return {
            "success": True,
            "message": f"Circuit breaker {name} reset successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting circuit breaker: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error resetting circuit breaker: {str(e)}"
        )


# Background sync function
async def run_sync(force: bool = False):
    """
    Run sync in background
    """
    global sync_in_progress, last_sync_time
    
    try:
        sync_in_progress = True
        logger.info("Starting background sync...")
        
        # Run sync
        result = await rag_service.sync_all_files()
        
        last_sync_time = datetime.utcnow()
        logger.info(f"Background sync completed: {result}")
        
        return result
        
    except Exception as e:
        logger.error(f"Background sync failed: {str(e)}")
        return {
            "status": "failed",
            "message": str(e)
        }
    finally:
        sync_in_progress = False



