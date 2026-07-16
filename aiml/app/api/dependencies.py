"""
FastAPI dependencies
"""

from typing import Optional
from fastapi import Request, HTTPException, Depends
from ..services.rag_service import RAGService
from ..services.mega_service import MegaService
from ..services.pinecone_service import PineconeService
from ..services.sync_service import get_sync_service, SyncService
from ..utils.rate_limiter import rate_limiter_manager
from ..utils.circuit_breaker import circuit_breaker_manager
from ..config import settings

# Service instances (singletons)
_rag_service: Optional[RAGService] = None
_mega_service: Optional[MegaService] = None
_pinecone_service: Optional[PineconeService] = None


def get_rag_service() -> RAGService:
    """Get RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


def get_mega_service() -> MegaService:
    """Get Mega service instance"""
    global _mega_service
    if _mega_service is None:
        _mega_service = MegaService()
    return _mega_service


def get_pinecone_service() -> PineconeService:
    """Get Pinecone service instance"""
    global _pinecone_service
    if _pinecone_service is None:
        _pinecone_service = PineconeService()
    return _pinecone_service


def get_sync_service_dep() -> SyncService:
    """Get Sync service instance"""
    return get_sync_service()


async def rate_limit_check(request: Request):
    """
    Rate limit dependency
    """
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, info = rate_limiter_manager.check_rate_limit(
        client_ip, 
        strategy='sliding_window'
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {info['retry_after']} seconds."
        )
    
    return True


async def validate_query_length(query: str = None):
    """
    Validate query length
    """
    if query and len(query) > settings.MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Query length exceeds maximum of {settings.MAX_QUERY_LENGTH} characters"
        )
    return query


def get_circuit_status():
    """
    Get circuit breaker status
    """
    return circuit_breaker_manager.get_all_status()


async def require_mega_connection():
    """
    Require Mega.nz connection
    """
    mega_service = get_mega_service()
    if not mega_service.get_connection_status():
        raise HTTPException(
            status_code=503,
            detail="Mega.nz service is currently unavailable"
        )
    return True


async def require_pinecone_connection():
    """
    Require Pinecone connection
    """
    pinecone_service = get_pinecone_service()
    if not pinecone_service.is_initialized():
        raise HTTPException(
            status_code=503,
            detail="Pinecone service is currently unavailable"
        )
    return True


async def require_mistral_connection():
    """
    Require Mistral connection
    """
    rag_service = get_rag_service()
    if not rag_service.mistral_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Mistral AI service is currently unavailable"
        )
    return True