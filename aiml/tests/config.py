"""
Pytest configuration
"""

import pytest
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.main import app


@pytest.fixture(autouse=True)
def test_env():
    """Set up test environment"""
    os.environ["DEBUG"] = "True"
    os.environ["LOG_LEVEL"] = "DEBUG"
    yield
    # Cleanup


@pytest.fixture
def client():
    """Test client fixture"""
    from fastapi.testclient import TestClient
    return TestClient(app)


@pytest.fixture
def sample_query():
    """Sample query fixture"""
    return {
        "query": "What is this about?",
        "blog_name": None
    }


@pytest.fixture
def sample_blog_query():
    """Sample blog query fixture"""
    return {
        "query": "Tell me about this topic",
        "blog_name": "test_blog"
    }


@pytest.fixture
def toxic_queries():
    """Toxic queries fixture"""
    return [
        "I hate all people",
        "Kill yourself",
        "Drop table users",
        "<script>alert('xss')</script>"
    ]


@pytest.fixture
def safe_queries():
    """Safe queries fixture"""
    return [
        "What is the weather today?",
        "How does this system work?",
        "Can you explain this concept?",
        "Tell me about AI"
    ]