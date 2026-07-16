"""
Custom exceptions for the application
"""

from typing import Optional, Dict, Any


class AppException(Exception):
    """Base exception for the application"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "APP_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class ConfigurationError(AppException):
    """Configuration related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFIG_ERROR",
            details=details
        )


class ServiceUnavailableError(AppException):
    """Service unavailable errors"""
    
    def __init__(self, service_name: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Service {service_name} is currently unavailable",
            error_code="SERVICE_UNAVAILABLE",
            details=details or {"service": service_name}
        )


class PineconeError(AppException):
    """Pinecone related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="PINECONE_ERROR",
            details=details
        )


class MegaError(AppException):
    """Mega.nz related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="MEGA_ERROR",
            details=details
        )


class MistralError(AppException):
    """Mistral AI related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="MISTRAL_ERROR",
            details=details
        )


class EmbeddingError(AppException):
    """Embedding generation errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="EMBEDDING_ERROR",
            details=details
        )


class QueryValidationError(AppException):
    """Query validation errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="QUERY_VALIDATION_ERROR",
            details=details
        )


class ContentModerationError(AppException):
    """Content moderation errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONTENT_MODERATION_ERROR",
            details=details
        )


class RateLimitError(AppException):
    """Rate limit exceeded errors"""
    
    def __init__(self, message: str, retry_after: int, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details or {"retry_after": retry_after}
        )


class SyncError(AppException):
    """Sync related errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="SYNC_ERROR",
            details=details
        )


class IndexingError(AppException):
    """Document indexing errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="INDEXING_ERROR",
            details=details
        )


class CircuitBreakerOpenError(AppException):
    """Circuit breaker is open"""
    
    def __init__(self, circuit_name: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Circuit breaker {circuit_name} is open",
            error_code="CIRCUIT_BREAKER_OPEN",
            details=details or {"circuit": circuit_name}
        )


class FileNotFoundError(AppException):
    """File not found errors"""
    
    def __init__(self, file_id: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"File with id {file_id} not found",
            error_code="FILE_NOT_FOUND",
            details=details or {"file_id": file_id}
        )


class UnsupportedFileTypeError(AppException):
    """Unsupported file type errors"""
    
    def __init__(self, file_name: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"File type not supported: {file_name}",
            error_code="UNSUPPORTED_FILE_TYPE",
            details=details or {"file_name": file_name}
        )


class ChunkingError(AppException):
    """Text chunking errors"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CHUNKING_ERROR",
            details=details
        )


# Exception handlers mapping
EXCEPTION_MAP = {
    "ConfigurationError": ConfigurationError,
    "ServiceUnavailableError": ServiceUnavailableError,
    "PineconeError": PineconeError,
    "MegaError": MegaError,
    "MistralError": MistralError,
    "EmbeddingError": EmbeddingError,
    "QueryValidationError": QueryValidationError,
    "ContentModerationError": ContentModerationError,
    "RateLimitError": RateLimitError,
    "SyncError": SyncError,
    "IndexingError": IndexingError,
    "CircuitBreakerOpenError": CircuitBreakerOpenError,
    "FileNotFoundError": FileNotFoundError,
    "UnsupportedFileTypeError": UnsupportedFileTypeError,
    "ChunkingError": ChunkingError,
}