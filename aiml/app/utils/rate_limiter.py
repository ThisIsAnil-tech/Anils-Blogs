from typing import Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import time

class TokenBucketRateLimiter:
    """
    Token bucket algorithm for rate limiting
    """
    def __init__(self, rate_per_second: float = 1.0, capacity: int = 10):
        self.rate_per_second = rate_per_second
        self.capacity = capacity
        self.tokens: Dict[str, float] = defaultdict(float)
        self.last_refill: Dict[str, datetime] = defaultdict(datetime.utcnow)
        self.lock = threading.Lock()
    
    def is_allowed(self, key: str) -> Tuple[bool, float]:
        """
        Check if request is allowed
        Returns: (allowed, wait_time_seconds)
        """
        with self.lock:
            now = datetime.utcnow()
            
            # Refill tokens
            time_diff = (now - self.last_refill[key]).total_seconds()
            self.tokens[key] = min(
                self.capacity,
                self.tokens[key] + time_diff * self.rate_per_second
            )
            self.last_refill[key] = now
            
            # Check if tokens available
            if self.tokens[key] >= 1.0:
                self.tokens[key] -= 1.0
                return True, 0.0
            else:
                # Calculate wait time
                wait_time = (1.0 - self.tokens[key]) / self.rate_per_second
                return False, wait_time
    
    def get_remaining_tokens(self, key: str) -> float:
        """Get remaining tokens for a key"""
        with self.lock:
            now = datetime.utcnow()
            time_diff = (now - self.last_refill[key]).total_seconds()
            return min(
                self.capacity,
                self.tokens[key] + time_diff * self.rate_per_second
            )

class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter
    """
    def __init__(self, window_size: int = 60, max_requests: int = 10):
        self.window_size = window_size  # seconds
        self.max_requests = max_requests
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, key: str) -> Tuple[bool, int]:
        """
        Check if request is allowed
        Returns: (allowed, retry_after_seconds)
        """
        with self.lock:
            now = time.time()
            window_start = now - self.window_size
            
            # Clean old requests
            self.requests[key] = [
                req_time for req_time in self.requests[key]
                if req_time > window_start
            ]
            
            # Check if allowed
            if len(self.requests[key]) < self.max_requests:
                self.requests[key].append(now)
                return True, 0
            else:
                # Calculate retry time
                oldest = min(self.requests[key])
                retry_after = int(oldest + self.window_size - now)
                return False, max(1, retry_after)
    
    def get_request_count(self, key: str) -> int:
        """Get current request count for a key"""
        with self.lock:
            now = time.time()
            window_start = now - self.window_size
            return len([t for t in self.requests[key] if t > window_start])

class RateLimiterManager:
    """
    Manages multiple rate limiters with different strategies
    """
    def __init__(self):
        self.limiters: Dict[str, Dict] = {
            'token_bucket': TokenBucketRateLimiter(rate_per_second=1.0/6.0, capacity=10),  # 10 per minute
            'sliding_window': SlidingWindowRateLimiter(window_size=3600, max_requests=100),  # 100 per hour
            'concurrent': SlidingWindowRateLimiter(window_size=1, max_requests=5),  # 5 per second
        }
        self.lock = threading.Lock()
    
    def check_rate_limit(self, key: str, strategy: str = 'sliding_window') -> Tuple[bool, Dict]:
        """
        Check rate limit across all strategies
        Returns: (allowed, rate_limit_info)
        """
        allowed = True
        info = {
            'allowed': True,
            'retry_after': 0,
            'remaining': 0,
            'limit_type': strategy
        }
        
        if strategy in self.limiters:
            limiter = self.limiters[strategy]
            is_allowed, wait_time = limiter.is_allowed(key)
            
            if not is_allowed:
                allowed = False
                info['allowed'] = False
                info['retry_after'] = wait_time
                
            # Get remaining quota if available
            if hasattr(limiter, 'get_request_count'):
                info['remaining'] = limiter.max_requests - limiter.get_request_count(key)
            elif hasattr(limiter, 'get_remaining_tokens'):
                info['remaining'] = limiter.get_remaining_tokens(key)
        
        return allowed, info

# Global instance
rate_limiter_manager = RateLimiterManager()

# FastAPI dependency
from fastapi import Request, HTTPException

async def rate_limit_dependency(request: Request, strategy: str = 'sliding_window'):
    """FastAPI dependency for rate limiting"""
    client_ip = request.client.host if request.client else "unknown"
    is_allowed, info = rate_limiter_manager.check_rate_limit(client_ip, strategy)
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry after {info['retry_after']} seconds."
        )
    
    return True