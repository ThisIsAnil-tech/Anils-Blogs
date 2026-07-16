"""
Core modules for the application
"""

from .constants import *
from .exceptions import *

__all__ = [
    # Constants
    "SUPPORTED_FILE_TYPES",
    "MAX_FILE_SIZE",
    "DEFAULT_CHUNK_SIZE",
    "DEFAULT_CHUNK_OVERLAP",
    "EMBEDDING_MODEL",
    "EMBEDDING_DIMENSION",
    "PINECONE_METRIC",
    "DEFAULT_TOP_K",
    "SIMILARITY_THRESHOLD",
    "DEFAULT_RATE_LIMIT_MINUTE",
    "DEFAULT_RATE_LIMIT_HOUR",
    "HTTP_200_OK",
    "HTTP_400_BAD_REQUEST",
    "HTTP_404_NOT_FOUND",
    "HTTP_429_TOO_MANY_REQUESTS",
    "HTTP_500_INTERNAL_SERVER_ERROR",
    # Exceptions
    "AppException",
    "ConfigurationError",
    "ServiceUnavailableError",
    "PineconeError",
    "MegaError",
    "MistralError",
    "EmbeddingError",
    "QueryValidationError",
    "ContentModerationError",
    "RateLimitError",
    "SyncError",
    "IndexingError",
    "CircuitBreakerOpenError",
    "FileNotFoundError",
    "UnsupportedFileTypeError",
    "ChunkingError"
]