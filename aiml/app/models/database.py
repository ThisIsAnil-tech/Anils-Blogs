"""
Database models for SQLite/PostgreSQL
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, 
    Text, JSON, Boolean, BigInteger, Index, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.pool import StaticPool
import json
import os
import logging

from ..config import settings

logger = logging.getLogger(__name__)

# Create base class
Base = declarative_base()

# Database engine
engine = None
SessionLocal = None


def get_database_url():
    """
    Get database URL from settings or use SQLite default
    """
    # Check if PostgreSQL is configured
    db_host = os.getenv("DB_HOST", "")
    db_name = os.getenv("DB_NAME", "")
    db_user = os.getenv("DB_USER", "")
    db_password = os.getenv("DB_PASSWORD", "")
    
    if all([db_host, db_name, db_user]):
        # PostgreSQL
        return f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
    else:
        # SQLite (default)
        db_path = os.getenv("DB_PATH", "data/aiml_rag.db")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        return f"sqlite:///{db_path}"


def init_database():
    """
    Initialize database connection and create tables
    """
    global engine, SessionLocal
    
    try:
        database_url = get_database_url()
        logger.info(f"Initializing database: {database_url.split('@')[-1] if '@' in database_url else database_url}")
        
        # Create engine
        if database_url.startswith("sqlite"):
            engine = create_engine(
                database_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=settings.DEBUG
            )
        else:
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=settings.DEBUG
            )
        
        # Create session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("Database initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        return False


def get_db():
    """
    Get database session (for FastAPI dependency)
    """
    if SessionLocal is None:
        init_database()
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== Models ====================

class FileModel(Base):
    """
    File metadata model
    """
    __tablename__ = "files"
    
    id = Column(String(64), primary_key=True, index=True)  # Mega.nz file ID
    name = Column(String(255), nullable=False, index=True)
    path = Column(String(500), nullable=False)
    hash = Column(String(64), nullable=False)
    size = Column(BigInteger, nullable=False)
    last_modified = Column(DateTime, nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow)
    chunk_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    file_metadata = Column(JSON, default={})  # Additional metadata
    
    # Relationships
    chunks = relationship("ChunkModel", back_populates="file", cascade="all, delete-orphan")
    queries = relationship("QueryModel", back_populates="file", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("ix_files_name_hash", "name", "hash"),
        Index("ix_files_processed_at", "processed_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "path": self.path,
            "hash": self.hash,
            "size": self.size,
            "last_modified": self.last_modified.isoformat() if self.last_modified else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "chunk_count": self.chunk_count,
            "is_active": self.is_active
        }


class ChunkModel(Base):
    """
    Text chunk model
    """
    __tablename__ = "chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(64), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    embedding_id = Column(String(128), nullable=True)  # Pinecone vector ID
    length = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("FileModel", back_populates="chunks")
    
    # Indexes
    __table_args__ = (
        Index("ix_chunks_file_id_chunk_index", "file_id", "chunk_index"),
        Index("ix_chunks_embedding_id", "embedding_id"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "file_id": self.file_id,
            "chunk_index": self.chunk_index,
            "text": self.text[:200] + "..." if len(self.text) > 200 else self.text,
            "embedding_id": self.embedding_id,
            "length": self.length,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class QueryModel(Base):
    """
    Query history model
    """
    __tablename__ = "queries"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    file_id = Column(String(64), ForeignKey("files.id", ondelete="SET NULL"), nullable=True, index=True)
    endpoint = Column(String(50), nullable=False)
    rag_used = Column(Boolean, default=False)
    fallback_used = Column(Boolean, default=False)
    model_used = Column(String(50), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    file = relationship("FileModel", back_populates="queries")
    feedback = relationship("FeedbackModel", back_populates="query", cascade="all, delete-orphan")
    sources = relationship("QuerySourceModel", back_populates="query", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index("ix_queries_created_at", "created_at"),
        Index("ix_queries_ip_address_created_at", "ip_address", "created_at"),
        Index("ix_queries_endpoint_created_at", "endpoint", "created_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "query": self.query,
            "response": self.response[:200] + "..." if self.response and len(self.response) > 200 else self.response,
            "confidence": self.confidence,
            "file_id": self.file_id,
            "endpoint": self.endpoint,
            "rag_used": self.rag_used,
            "fallback_used": self.fallback_used,
            "model_used": self.model_used,
            "tokens_used": self.tokens_used,
            "processing_time_ms": self.processing_time_ms,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class QuerySourceModel(Base):
    """
    Sources used for a query response
    """
    __tablename__ = "query_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    similarity = Column(Float, nullable=False)
    chunk_text = Column(Text, nullable=True)
    chunk_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    query = relationship("QueryModel", back_populates="sources")
    
    def to_dict(self):
        return {
            "id": self.id,
            "query_id": self.query_id,
            "file_name": self.file_name,
            "similarity": self.similarity,
            "chunk_text": self.chunk_text[:200] + "..." if self.chunk_text and len(self.chunk_text) > 200 else self.chunk_text,
            "chunk_index": self.chunk_index
        }


class FeedbackModel(Base):
    """
    User feedback model
    """
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    sentiment = Column(String(20), nullable=True)  # positive, neutral, negative
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    query = relationship("QueryModel", back_populates="feedback")
    
    # Indexes
    __table_args__ = (
        Index("ix_feedback_rating", "rating"),
        Index("ix_feedback_created_at", "created_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "query_id": self.query_id,
            "rating": self.rating,
            "comment": self.comment,
            "sentiment": self.sentiment,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SyncLogModel(Base):
    """
    Sync operation logs
    """
    __tablename__ = "sync_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), nullable=False)  # success, failed, in_progress
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    failed_files = Column(Integer, default=0)
    new_files = Column(Integer, default=0)
    updated_files = Column(Integer, default=0)
    deleted_files = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index("ix_sync_logs_started_at", "started_at"),
        Index("ix_sync_logs_status_started_at", "status", "started_at"),
    )
    
    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "total_files": self.total_files,
            "processed_files": self.processed_files,
            "failed_files": self.failed_files,
            "new_files": self.new_files,
            "updated_files": self.updated_files,
            "deleted_files": self.deleted_files,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": self.duration_seconds
        }


class CacheModel(Base):
    """
    Cache model (optional, for Redis-like functionality in DB)
    """
    __tablename__ = "cache"
    
    key = Column(String(255), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index("ix_cache_expires_at", "expires_at"),
    )
    
    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value[:200] + "..." if len(self.value) > 200 else self.value,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ==================== Database Operations ====================

class DatabaseOperations:
    """
    Database operations helper
    """
    
    @staticmethod
    def save_file(db: Session, file_data: Dict[str, Any]) -> FileModel:
        """Save or update file metadata"""
        file_id = file_data.get('id')
        existing = db.query(FileModel).filter(FileModel.id == file_id).first()
        
        if existing:
            # Update existing
            for key, value in file_data.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new
            file_model = FileModel(**file_data)
            db.add(file_model)
            db.commit()
            db.refresh(file_model)
            return file_model
    
    @staticmethod
    def save_chunk(db: Session, chunk_data: Dict[str, Any]) -> ChunkModel:
        """Save a chunk"""
        chunk_model = ChunkModel(**chunk_data)
        db.add(chunk_model)
        db.commit()
        db.refresh(chunk_model)
        return chunk_model
    
    @staticmethod
    def save_chunks_batch(db: Session, chunks_data: List[Dict[str, Any]]) -> List[ChunkModel]:
        """Save multiple chunks in batch"""
        chunk_models = [ChunkModel(**data) for data in chunks_data]
        db.add_all(chunk_models)
        db.commit()
        for chunk in chunk_models:
            db.refresh(chunk)
        return chunk_models
    
    @staticmethod
    def save_query(db: Session, query_data: Dict[str, Any]) -> QueryModel:
        """Save a query record"""
        query_model = QueryModel(**query_data)
        db.add(query_model)
        db.commit()
        db.refresh(query_model)
        return query_model
    
    @staticmethod
    def save_query_source(db: Session, source_data: Dict[str, Any]) -> QuerySourceModel:
        """Save a query source"""
        source_model = QuerySourceModel(**source_data)
        db.add(source_model)
        db.commit()
        db.refresh(source_model)
        return source_model
    
    @staticmethod
    def save_feedback(db: Session, feedback_data: Dict[str, Any]) -> FeedbackModel:
        """Save feedback"""
        feedback_model = FeedbackModel(**feedback_data)
        db.add(feedback_model)
        db.commit()
        db.refresh(feedback_model)
        return feedback_model
    
    @staticmethod
    def save_sync_log(db: Session, log_data: Dict[str, Any]) -> SyncLogModel:
        """Save sync log"""
        log_model = SyncLogModel(**log_data)
        db.add(log_model)
        db.commit()
        db.refresh(log_model)
        return log_model
    
    @staticmethod
    def get_file_by_id(db: Session, file_id: str) -> Optional[FileModel]:
        """Get file by ID"""
        return db.query(FileModel).filter(FileModel.id == file_id).first()
    
    @staticmethod
    def get_files_by_name(db: Session, name: str) -> List[FileModel]:
        """Get files by name"""
        return db.query(FileModel).filter(FileModel.name == name).all()
    
    @staticmethod
    def get_all_files(db: Session, active_only: bool = True) -> List[FileModel]:
        """Get all files"""
        query = db.query(FileModel)
        if active_only:
            query = query.filter(FileModel.is_active == True)
        return query.all()
    
    @staticmethod
    def get_chunks_by_file(db: Session, file_id: str) -> List[ChunkModel]:
        """Get all chunks for a file"""
        return db.query(ChunkModel).filter(ChunkModel.file_id == file_id).order_by(ChunkModel.chunk_index).all()
    
    @staticmethod
    def delete_file(db: Session, file_id: str) -> bool:
        """Delete a file and its chunks"""
        file = db.query(FileModel).filter(FileModel.id == file_id).first()
        if file:
            db.delete(file)
            db.commit()
            return True
        return False
    
    @staticmethod
    def delete_chunks_by_file(db: Session, file_id: str) -> int:
        """Delete all chunks for a file"""
        deleted = db.query(ChunkModel).filter(ChunkModel.file_id == file_id).delete()
        db.commit()
        return deleted
    
    @staticmethod
    def get_query_history(db: Session, limit: int = 100, endpoint: Optional[str] = None) -> List[QueryModel]:
        """Get query history"""
        query = db.query(QueryModel).order_by(QueryModel.created_at.desc())
        if endpoint:
            query = query.filter(QueryModel.endpoint == endpoint)
        return query.limit(limit).all()
    
    @staticmethod
    def get_feedback_stats(db: Session) -> Dict[str, Any]:
        """Get feedback statistics"""
        total = db.query(FeedbackModel).count()
        avg_rating = db.query(db.func.avg(FeedbackModel.rating)).scalar()
        rating_counts = db.query(
            FeedbackModel.rating, 
            db.func.count(FeedbackModel.id)
        ).group_by(FeedbackModel.rating).all()
        
        return {
            "total": total,
            "avg_rating": float(avg_rating) if avg_rating else 0,
            "rating_distribution": {r: c for r, c in rating_counts}
        }
    
    @staticmethod
    def get_sync_stats(db: Session, limit: int = 10) -> List[SyncLogModel]:
        """Get recent sync stats"""
        return db.query(SyncLogModel).order_by(SyncLogModel.started_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_cache_value(db: Session, key: str) -> Optional[str]:
        """Get cached value"""
        cache = db.query(CacheModel).filter(CacheModel.key == key).first()
        if cache and (not cache.expires_at or cache.expires_at > datetime.utcnow()):
            return cache.value
        return None
    
    @staticmethod
    def set_cache_value(db: Session, key: str, value: str, ttl_seconds: Optional[int] = None):
        """Set cached value"""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds) if ttl_seconds else None
        
        existing = db.query(CacheModel).filter(CacheModel.key == key).first()
        if existing:
            existing.value = value
            existing.expires_at = expires_at
        else:
            cache = CacheModel(key=key, value=value, expires_at=expires_at)
            db.add(cache)
        db.commit()
    
    @staticmethod
    def clear_expired_cache(db: Session) -> int:
        """Clear expired cache entries"""
        deleted = db.query(CacheModel).filter(
            CacheModel.expires_at.isnot(None),
            CacheModel.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        return deleted