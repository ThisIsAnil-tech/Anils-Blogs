import re
import hashlib
from typing import Tuple, List
from datetime import datetime, timedelta
from collections import defaultdict
import threading

class ContentModerator:
    def __init__(self):
        self.toxic_patterns = [
            (r'\bhate\b.*\bspeech\b', 'hate_speech'),
            (r'\bnigger\b', 'racial_slur'),
            (r'\bfaggot\b', 'homophobic_slur'),
            (r'\bretard\b', 'ableist_slur'),
            (r'\bkick\b.*\bass\b', 'violent'),
            (r'\bkill\b.*\byourself\b', 'self_harm'),
            (r'\bterrorist\b', 'terrorism'),
            (r'\bdiscrimination\b', 'discrimination'),
            (r'\bracist\b', 'racism'),
            (r'\bsexist\b', 'sexism'),
            (r'\bporn\b', 'nsfw'),
            (r'\bpedophile\b', 'nsfw'),
        ]
        
        self.profanity_list = [
            'fuck', 'shit', 'damn', 'bitch', 'bastard',
            'asshole', 'motherfucker', 'cunt', 'pussy',
            'dick', 'cock', 'prick', 'crap', 'stupid'
        ]

    def moderate_text(self, text: str) -> Tuple[bool, List[str]]:
        """Returns (is_safe, list_of_violations)"""
        violations = []
        text_lower = text.lower()
        
        # Check toxic patterns
        for pattern, category in self.toxic_patterns:
            if re.search(pattern, text_lower):
                violations.append(f"toxic_content_{category}")
        
        # Check profanity
        for word in self.profanity_list:
            if word in text_lower:
                violations.append(f"profanity_{word}")
        
        # Check for threats
        threat_patterns = [
            r'\bthreaten\b',
            r'\bharm\b.*\byou\b',
            r'\bdestroy\b',
            r'\battack\b',
        ]
        for pattern in threat_patterns:
            if re.search(pattern, text_lower):
                violations.append('threat')
        
        return len(violations) == 0, violations

    def filter_sql_injection(self, text: str) -> str:
        sql_keywords = ['DROP', 'DELETE', 'ALTER', 'INSERT', 'UPDATE', 'SELECT', 'UNION', 'WHERE', 'FROM']
        for keyword in sql_keywords:
            text = re.sub(rf'\b{keyword}\b', '', text, flags=re.IGNORECASE)
        return text

    def filter_xss(self, text: str) -> str:
        xss_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'onclick=',
            r'onerror=',
            r'onload=',
            r'<iframe',
        ]
        for pattern in xss_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        return text

class RateLimiter:
    def __init__(self, max_per_minute: int = 10, max_per_hour: int = 100):
        self.max_per_minute = max_per_minute
        self.max_per_hour = max_per_hour
        self.minute_requests = defaultdict(list)
        self.hour_requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, ip: str) -> Tuple[bool, int]:
        """Returns (is_allowed, retry_after_seconds)"""
        with self.lock:
            now = datetime.utcnow()
            
            # Clean old minute requests
            minute_ago = now - timedelta(minutes=1)
            self.minute_requests[ip] = [t for t in self.minute_requests[ip] if t > minute_ago]
            
            # Clean old hour requests
            hour_ago = now - timedelta(hours=1)
            self.hour_requests[ip] = [t for t in self.hour_requests[ip] if t > hour_ago]
            
            # Check hour limit
            if len(self.hour_requests[ip]) >= self.max_per_hour:
                oldest = min(self.hour_requests[ip])
                retry_after = int((oldest + timedelta(hours=1) - now).total_seconds())
                return False, retry_after
            
            # Check minute limit
            if len(self.minute_requests[ip]) >= self.max_per_minute:
                oldest = min(self.minute_requests[ip])
                retry_after = int((oldest + timedelta(minutes=1) - now).total_seconds())
                return False, retry_after
            
            # Allow request
            self.minute_requests[ip].append(now)
            self.hour_requests[ip].append(now)
            return True, 0

class SecurityUtils:
    @staticmethod
    def hash_text(text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        # Remove any path traversal attempts
        filename = filename.replace('..', '')
        filename = re.sub(r'[^\w\-\.]', '_', filename)
        return filename
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: List[str] = ['.txt']) -> bool:
        return any(filename.lower().endswith(ext) for ext in allowed_extensions)