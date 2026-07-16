import time
import logging
from enum import Enum
from typing import Dict, Optional, Callable
from threading import Lock
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, no calls allowed
    HALF_OPEN = "half_open" # Testing if service recovered

class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_timeout: int = 30,
        min_calls_to_trip: int = 10
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout  # seconds
        self.half_open_timeout = half_open_timeout  # seconds
        self.min_calls_to_trip = min_calls_to_trip
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.total_requests = 0
        self.last_failure_time = None
        self.last_state_change = datetime.utcnow()
        self.lock = Lock()
        
        self.fallback_function: Optional[Callable] = None
        
    def call(self, func: Callable, *args, **kwargs):
        """Execute a function with circuit breaker protection"""
        with self.lock:
            if not self._can_execute():
                logger.warning(f"Circuit {self.name} is {self.state.value}, executing fallback")
                return self._execute_fallback(*args, **kwargs)
            
            # Record attempt
            self.total_requests += 1
            
        try:
            # Execute the function
            result = func(*args, **kwargs)
            
            # Record success
            with self.lock:
                self._record_success()
            
            return result
            
        except Exception as e:
            # Record failure
            with self.lock:
                self._record_failure()
            
            logger.error(f"Circuit {self.name} failed: {str(e)}")
            
            # If circuit is now open, execute fallback
            if self.state == CircuitState.OPEN:
                return self._execute_fallback(*args, **kwargs)
            
            # Re-raise if circuit is not open yet
            raise
    
    def _can_execute(self) -> bool:
        """Check if a request can be executed"""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if self.last_failure_time:
                time_since_failure = (datetime.utcnow() - self.last_failure_time).total_seconds()
                if time_since_failure >= self.recovery_timeout:
                    # Move to half-open
                    self._transition_to_half_open()
                    return True
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            # Check if half-open timeout has elapsed
            time_since_change = (datetime.utcnow() - self.last_state_change).total_seconds()
            if time_since_change >= self.half_open_timeout:
                # Only allow one request in half-open state
                return True
            return False
        
        return True
    
    def _record_success(self):
        """Record a successful request"""
        if self.state == CircuitState.HALF_OPEN:
            # If successful in half-open, close the circuit
            self._transition_to_closed()
            self.success_count = 0
            logger.info(f"Circuit {self.name} closed after successful half-open test")
        else:
            self.success_count += 1
            # Reset failure count if we're recovering
            if self.failure_count > 0 and self.success_count > self.min_calls_to_trip:
                self.failure_count = 0
                logger.info(f"Circuit {self.name} failure count reset after {self.success_count} successes")
    
    def _record_failure(self):
        """Record a failed request"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.state == CircuitState.CLOSED:
            if self.failure_count >= self.failure_threshold:
                self._transition_to_open()
                logger.error(f"Circuit {self.name} opened after {self.failure_count} failures")
        
        elif self.state == CircuitState.HALF_OPEN:
            # Failed in half-open, go back to open
            self._transition_to_open()
            logger.error(f"Circuit {self.name} reopened after half-open failure")
    
    def _transition_to_closed(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_state_change = datetime.utcnow()
    
    def _transition_to_open(self):
        self.state = CircuitState.OPEN
        self.last_state_change = datetime.utcnow()
    
    def _transition_to_half_open(self):
        self.state = CircuitState.HALF_OPEN
        self.last_state_change = datetime.utcnow()
        self.success_count = 0
        logger.info(f"Circuit {self.name} transitioned to half-open")
    
    def _execute_fallback(self, *args, **kwargs):
        """Execute fallback function if available"""
        if self.fallback_function:
            try:
                return self.fallback_function(*args, **kwargs)
            except Exception as e:
                logger.error(f"Fallback for {self.name} failed: {str(e)}")
                raise
        raise Exception(f"Circuit {self.name} is open and no fallback available")
    
    def set_fallback(self, func: Callable):
        """Set a fallback function"""
        self.fallback_function = func
    
    def get_status(self) -> Dict:
        """Get current status of the circuit"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "total_requests": self.total_requests,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "last_state_change": self.last_state_change.isoformat(),
            "threshold": self.failure_threshold
        }
    
    def reset(self):
        """Manually reset the circuit"""
        with self.lock:
            self._transition_to_closed()
            self.success_count = 0
            self.total_requests = 0
            self.last_failure_time = None
            logger.info(f"Circuit {self.name} manually reset")

class CircuitBreakerManager:
    """Manages multiple circuit breakers"""
    def __init__(self):
        self.circuits: Dict[str, CircuitBreaker] = {}
        self.lock = Lock()
    
    def get_or_create(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        half_open_timeout: int = 30,
        min_calls_to_trip: int = 10
    ) -> CircuitBreaker:
        with self.lock:
            if name not in self.circuits:
                self.circuits[name] = CircuitBreaker(
                    name=name,
                    failure_threshold=failure_threshold,
                    recovery_timeout=recovery_timeout,
                    half_open_timeout=half_open_timeout,
                    min_calls_to_trip=min_calls_to_trip
                )
            return self.circuits[name]
    
    def get_all_status(self) -> Dict:
        return {name: cb.get_status() for name, cb in self.circuits.items()}
    
    def reset_all(self):
        for cb in self.circuits.values():
            cb.reset()

# Global instance
circuit_breaker_manager = CircuitBreakerManager()