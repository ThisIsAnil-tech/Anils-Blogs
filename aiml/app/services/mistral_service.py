import logging
import time
from typing import Optional, Dict, Any, List
import httpx
import json
from ..config import settings
from ..utils.circuit_breaker import circuit_breaker_manager
from ..utils.security import ContentModerator

logger = logging.getLogger(__name__)

class MistralService:
    def __init__(self):
        self.api_key = settings.MISTRAL_API_KEY
        self.model = settings.MISTRAL_MODEL
        self.base_url = "https://api.mistral.ai/v1"
        self.timeout = 60.0
        self.content_moderator = ContentModerator()
        self._validate_api_key()

    def _validate_api_key(self):
        """Validate that API key is set"""
        if not self.api_key:
            logger.error("Mistral API key not set in environment variables")
            raise ValueError("Mistral API key is required")

    def _get_circuit_breaker(self):
        """Get or create circuit breaker for Mistral API"""
        return circuit_breaker_manager.get_or_create(
            name="mistral_api",
            failure_threshold=3,
            recovery_timeout=60,
            half_open_timeout=30
        )

    async def generate_response(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7,
        top_p: float = 0.95,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a response using Mistral AI
        """
        # Moderate the query
        is_safe, violations = self.content_moderator.moderate_text(prompt)
        if not is_safe:
            return {
                'response': "I cannot respond to this query as it violates our ethical guidelines.",
                'usage': {},
                'model': self.model,
                'violations': violations,
                'blocked': True
            }

        # Build the prompt
        if context:
            full_prompt = f"""Context: {context}

Question: {prompt}

Answer based on the context provided. If you cannot answer based on the context, say so clearly.
Answer:"""
        else:
            full_prompt = f"""Question: {prompt}

Provide a clear and helpful answer to the question above.
Answer:"""

        def _call_api():
            """Internal function to call Mistral API"""
            try:
                start_time = time.time()
                
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": full_prompt
                        }
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "top_p": top_p
                }
                
                # Make API request
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Mistral API error: {response.status_code} - {response.text}")
                        raise Exception(f"API error: {response.status_code}")
                    
                    result = response.json()
                    
                    # Extract response
                    answer = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                    
                    # Moderate the response
                    is_safe_response, response_violations = self.content_moderator.moderate_text(answer)
                    if not is_safe_response:
                        answer = "I'm unable to provide a response as it may contain inappropriate content."
                    
                    processing_time = time.time() - start_time
                    
                    return {
                        'response': answer,
                        'usage': result.get('usage', {}),
                        'model': self.model,
                        'processing_time': processing_time,
                        'blocked': False
                    }
                    
            except httpx.TimeoutException:
                logger.error("Mistral API request timed out")
                raise Exception("Request timed out")
            except Exception as e:
                logger.error(f"Mistral API request failed: {str(e)}")
                raise

        try:
            # Execute with circuit breaker
            circuit_breaker = self._get_circuit_breaker()
            result = circuit_breaker.call(_call_api)
            return result
            
        except Exception as e:
            logger.error(f"Circuit breaker tripped for Mistral API: {str(e)}")
            return {
                'response': "I'm currently unable to generate a response. Please try again later.",
                'usage': {},
                'model': self.model,
                'error': str(e),
                'blocked': False
            }

    async def generate_with_rag(
        self,
        question: str,
        context: str,
        sources: List[Dict]
    ) -> Dict[str, Any]:
        """
        Generate response using RAG context
        """
        # Build context with sources
        context_text = f"Based on the following documents:\n\n{context}"
        
        # Add source information
        if sources:
            source_text = "\n\nSources:\n"
            for i, source in enumerate(sources[:3], 1):
                source_text += f"{i}. {source.get('file_name', 'Unknown')} (confidence: {source.get('similarity', 0):.2f})\n"
            context_text += source_text
        
        response = await self.generate_response(
            prompt=question,
            context=context_text,
            max_tokens=500,
            temperature=0.3  # Lower temperature for factual answers
        )
        
        return response

    async def generate_fallback_response(self, question: str) -> Dict[str, Any]:
        """
        Generate a fallback response when RAG fails
        """
        response = await self.generate_response(
            prompt=question,
            context=None,
            max_tokens=300,
            temperature=0.7
        )
        
        return response

    async def moderate_query(self, query: str) -> Dict[str, Any]:
        """
        Moderate a query for ethical content
        """
        is_safe, violations = self.content_moderator.moderate_text(query)
        
        return {
            'is_safe': is_safe,
            'violations': violations,
            'query': query
        }

    def get_available_models(self) -> List[str]:
        """Get available Mistral models"""
        return [
            "mistral-tiny",
            "mistral-small",
            "mistral-medium",
            "mistral-large",
            "codestral-latest"
        ]

    def is_available(self) -> bool:
        """Check if service is available"""
        return bool(self.api_key)