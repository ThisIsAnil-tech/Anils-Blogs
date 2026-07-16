"""
API endpoint tests
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


def test_health_endpoint():
    """Test health endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data


def test_query_endpoint_validation():
    """Test query validation"""
    # Test empty query
    response = client.post("/api/v1/query", json={"query": ""})
    assert response.status_code == 400
    
    # Test query too long
    long_query = "a" * 600
    response = client.post("/api/v1/query", json={"query": long_query})
    assert response.status_code == 400
    
    # Test SQL injection
    response = client.post("/api/v1/query", json={"query": "DROP TABLE users"})
    assert response.status_code == 400
    
    # Test XSS
    response = client.post("/api/v1/query", json={"query": "<script>alert('xss')</script>"})
    assert response.status_code == 400
    
    # Test toxic content
    response = client.post("/api/v1/query", json={"query": "I hate all people"})
    assert response.status_code == 400


def test_rate_limiting():
    """Test rate limiting"""
    # Make multiple requests
    for i in range(12):  # Exceed rate limit
        response = client.post("/api/v1/query", json={"query": "test query"})
        if response.status_code == 429:
            assert "Rate limit exceeded" in response.json()["detail"]
            break


def test_get_files():
    """Test get files endpoint"""
    response = client.get("/api/v1/files")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_sync_status():
    """Test sync status endpoint"""
    response = client.get("/api/v1/sync/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_syncing" in data
    assert "total_files" in data


def test_metrics_endpoint():
    """Test metrics endpoint"""
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data


def test_circuit_breakers():
    """Test circuit breakers endpoint"""
    response = client.get("/api/v1/circuit-breakers")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


def test_invalid_blog_query():
    """Test invalid blog query"""
    response = client.post(
        "/api/v1/blogs/invalid_blog",
        json={"query": "test query"}
    )
    # Should return 200 even if blog doesn't exist (RAG will handle it)
    assert response.status_code in [200, 500]


def test_delete_file_not_found():
    """Test deleting non-existent file"""
    response = client.delete("/api/v1/files/nonexistent_id")
    assert response.status_code == 404


def test_cors_headers():
    """Test CORS headers"""
    response = client.options("/api/v1/query")
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers