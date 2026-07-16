"""
AIML RAG Service - FastAPI application with RAG system
"""

__version__ = "1.0.0"
__author__ = "AIML Team"

from .config import settings
from .main import app

__all__ = ["app", "settings"]