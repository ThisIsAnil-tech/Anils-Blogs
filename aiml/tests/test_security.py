"""
Security tests
"""

import pytest
from app.utils.security import ContentModerator, SecurityUtils, RateLimiter


def test_content_moderator():
    """Test content moderation"""
    moderator = ContentModerator()
    
    # Test safe content
    is_safe, violations = moderator.moderate_text("What is the weather today?")
    assert is_safe is True
    assert len(violations) == 0
    
    # Test hate speech
    is_safe, violations = moderator.moderate_text("I hate all people")
    assert is_safe is False
    assert len(violations) > 0
    
    # Test profanity
    is_safe, violations = moderator.moderate_text("This is fucking awesome")
    assert is_safe is False
    assert "profanity" in violations[0]
    
    # Test threats
    is_safe, violations = moderator.moderate_text("I will harm you")
    assert is_safe is False
    assert "threat" in violations


def test_security_utils():
    """Test security utilities"""
    # Test hash
    text = "test text"
    hash1 = SecurityUtils.hash_text(text)
    hash2 = SecurityUtils.hash_text(text)
    assert hash1 == hash2
    assert len(hash1) == 64
    
    # Test sanitize filename
    filename = "../../etc/passwd"
    sanitized = SecurityUtils.sanitize_filename(filename)
    assert ".." not in sanitized
    assert "/" not in sanitized
    
    # Test validate file extension
    assert SecurityUtils.validate_file_extension("file.txt") is True
    assert SecurityUtils.validate_file_extension("file.pdf") is False


def test_rate_limiter():
    """Test rate limiter"""
    limiter = RateLimiter(max_per_minute=5, max_per_hour=10)
    ip = "127.0.0.1"
    
    # Test within limit
    for i in range(5):
        allowed, _ = limiter.is_allowed(ip)
        assert allowed is True
    
    # Test exceeded
    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is False
    assert retry_after > 0


def test_sql_injection_filter():
    """Test SQL injection filtering"""
    moderator = ContentModerator()
    
    # Test SQL injection patterns
    sql_query = "SELECT * FROM users WHERE id = 1; DROP TABLE users"
    is_safe, violations = moderator.moderate_text(sql_query)
    # Should be caught by SQL injection check in validator
    assert is_safe is False


def test_xss_filter():
    """Test XSS filtering"""
    moderator = ContentModerator()
    
    # Test XSS patterns
    xss_query = "<script>alert('xss')</script>"
    is_safe, violations = moderator.moderate_text(xss_query)
    assert is_safe is False


def test_toxic_patterns():
    """Test toxic pattern detection"""
    moderator = ContentModerator()
    
    toxic_phrases = [
        "You are a retard",
        "Kill yourself",
        "This is terrorism",
        "Discrimination against women"
    ]
    
    for phrase in toxic_phrases:
        is_safe, violations = moderator.moderate_text(phrase)
        assert is_safe is False
        assert len(violations) > 0