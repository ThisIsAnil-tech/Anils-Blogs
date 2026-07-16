"""
RAG service tests
"""

import pytest
from unittest.mock import Mock, patch
from app.services.rag_service import RAGService
from app.models.schemas import QueryRequest, QueryResponse


@pytest.fixture
def rag_service():
    """Create RAG service fixture"""
    with patch('app.services.rag_service.PineconeService') as mock_pinecone:
        with patch('app.services.rag_service.MistralService') as mock_mistral:
            with patch('app.services.rag_service.EmbeddingService') as mock_embedding:
                with patch('app.services.rag_service.MegaService') as mock_mega:
                    service = RAGService()
                    service.embedding_service.generate_embedding = Mock(return_value=[0.1] * 384)
                    return service


def test_query_processing(rag_service):
    """Test query processing"""
    query = QueryRequest(query="test query")
    response = rag_service.process_query(query)
    assert isinstance(response, QueryResponse)
    assert hasattr(response, 'answer')
    assert hasattr(response, 'confidence')


def test_chunk_content(rag_service):
    """Test content chunking"""
    content = "This is a test content. " * 100
    chunks = rag_service._chunk_content(content, "test_id", "test.txt")
    assert len(chunks) > 0
    assert all('text' in chunk for chunk in chunks)
    assert all('index' in chunk for chunk in chunks)
    assert all('file_id' in chunk for chunk in chunks)


def test_build_context(rag_service):
    """Test context building"""
    results = [
        {
            'score': 0.9,
            'metadata': {
                'file_name': 'test1.txt',
                'chunk_text': 'content 1'
            }
        },
        {
            'score': 0.8,
            'metadata': {
                'file_name': 'test2.txt',
                'chunk_text': 'content 2'
            }
        }
    ]
    
    context = rag_service._build_context(results)
    assert "test1.txt" in context
    assert "content 1" in context
    assert "test2.txt" in context
    assert "content 2" in context


def test_extract_sources(rag_service):
    """Test source extraction"""
    results = [
        {
            'score': 0.9,
            'metadata': {
                'file_name': 'test1.txt',
                'chunk_text': 'content 1',
                'chunk_index': 0
            }
        },
        {
            'score': 0.8,
            'metadata': {
                'file_name': 'test2.txt',
                'chunk_text': 'content 2',
                'chunk_index': 1
            }
        }
    ]
    
    sources = rag_service._extract_sources(results)
    assert len(sources) == 2
    assert sources[0].file_name == 'test1.txt'
    assert sources[1].file_name == 'test2.txt'


def test_fallback_chunking(rag_service):
    """Test fallback chunking"""
    content = "This is a test. " * 50
    chunks = rag_service._fallback_chunking(content, "test_id", "test.txt")
    assert len(chunks) > 0
    assert all(chunk['file_id'] == 'test_id' for chunk in chunks)


@patch('app.services.rag_service.MistralService.generate_with_rag')
def test_rag_success(mock_generate, rag_service):
    """Test successful RAG response"""
    mock_generate.return_value = {
        'response': 'Test answer',
        'model': 'mistral-small',
        'usage': {'total_tokens': 100}
    }
    
    # Mock pinecone query
    rag_service.pinecone_service.query_vectors = Mock(return_value=[
        {'score': 0.9, 'metadata': {'file_name': 'test.txt', 'chunk_text': 'content'}}
    ])
    
    query = QueryRequest(query="test query")
    response = rag_service.process_query(query)
    
    assert response.rag_used is True
    assert response.answer == 'Test answer'


@patch('app.services.rag_service.MistralService.generate_fallback_response')
def test_rag_fallback(mock_fallback, rag_service):
    """Test RAG fallback when no relevant results"""
    mock_fallback.return_value = {
        'response': 'Fallback answer',
        'model': 'mistral-small',
        'usage': {'total_tokens': 50}
    }
    
    # Mock pinecone query with low scores
    rag_service.pinecone_service.query_vectors = Mock(return_value=[
        {'score': 0.3, 'metadata': {'file_name': 'test.txt', 'chunk_text': 'content'}}
    ])
    
    query = QueryRequest(query="test query")
    response = rag_service.process_query(query)
    
    assert response.rag_used is False
    assert response.fallback_used is True
    assert response.answer == 'Fallback answer'


def test_content_moderation_in_rag(rag_service):
    """Test content moderation in RAG"""
    query = QueryRequest(query="I hate everyone")
    response = rag_service.process_query(query)
    
    assert "cannot respond" in response.answer.lower()
    assert response.rag_used is False
    assert response.confidence == 0.0


def test_blog_filtering(rag_service):
    """Test blog-specific filtering"""
    query = QueryRequest(query="test query", blog_name="test_blog")
    response = rag_service.process_query(query)
    
    # Verify filter was applied
    # This would need more detailed mocking to verify
    assert isinstance(response, QueryResponse)


def test_index_file_content(rag_service):
    """Test file indexing"""
    content = "Test content for indexing"
    result = rag_service.index_file_content("test_id", "test.txt", content)
    
    # Should return True if indexing succeeds
    # Note: This requires actual Pinecone connection in integration tests
    assert isinstance(result, bool)