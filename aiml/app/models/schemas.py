from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
import re

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    blog_name: Optional[str] = None
    user_id: Optional[str] = None

    @validator('query')
    def sanitize_query(cls, v):
        # Remove SQL injection patterns
        sql_patterns = ['DROP', 'DELETE', 'ALTER', 'INSERT', 'UPDATE', 'SELECT', 'UNION']
        for pattern in sql_patterns:
            if re.search(rf'\b{pattern}\b', v, re.IGNORECASE):
                raise ValueError(f"Query contains forbidden SQL keyword: {pattern}")
        
        # Remove XSS patterns
        xss_patterns = ['<script', 'javascript:', 'onclick', 'onerror']
        for pattern in xss_patterns:
            if pattern in v.lower():
                raise ValueError(f"Query contains forbidden XSS pattern: {pattern}")
        
        # Remove system commands
        cmd_patterns = ['rm -rf', 'sudo', 'chmod', 'wget', 'curl']
        for pattern in cmd_patterns:
            if pattern in v.lower():
                raise ValueError(f"Query contains forbidden command: {pattern}")
        
        return v.strip()

    @validator('query')
    def validate_ethical_content(cls, v):
        # Check for hate speech, profanity, toxic content
        toxic_patterns = [
            r'\bhate\b.*\bspeech\b',
            r'\bnigger\b',
            r'\bfaggot\b',
            r'\bretard\b',
            r'\bkill\b.*\byourself\b',
            r'\bterrorist\b',
            r'\bdiscrimination\b',
        ]
        
        for pattern in toxic_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Query contains unethical or toxic content")
        
        return v

class SourceDocument(BaseModel):
    file_name: str
    similarity: float
    chunk_text: str
    chunk_index: int

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[SourceDocument]
    rag_used: bool
    model_used: str
    tokens_used: Optional[int] = None
    processing_time_ms: float
    fallback_used: bool
    query: str
    endpoint: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class FileMetadata(BaseModel):
    id: str
    name: str
    path: str
    hash: str
    size: int
    last_modified: datetime
    processed_at: datetime
    chunk_count: int

class SyncStatus(BaseModel):
    is_syncing: bool
    last_sync: Optional[datetime]
    total_files: int
    processed_files: int
    failed_files: int
    files: List[Dict[str, Any]]

class HealthCheck(BaseModel):
    status: str
    version: str
    services: Dict[str, bool]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None