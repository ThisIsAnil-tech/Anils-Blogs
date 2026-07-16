import logging
from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
from ..config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"  # 384 dimension
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_model()

    def _load_model(self):
        """Load the embedding model"""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name, device=self.device)
            logger.info(f"Model loaded on {self.device}")
            logger.info(f"Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        """
        if not self.model:
            self._load_model()
        
        try:
            # Generate embedding
            embedding = self.model.encode(
                text,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            
            # Convert to list and normalize
            embedding_np = embedding.cpu().numpy()
            embedding_normalized = embedding_np / np.linalg.norm(embedding_np)
            
            return embedding_normalized.tolist()
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        """
        if not self.model:
            self._load_model()
        
        try:
            # Generate embeddings in batch
            embeddings = self.model.encode(
                texts,
                convert_to_tensor=True,
                show_progress_bar=False,
                batch_size=32
            )
            
            # Normalize embeddings
            embeddings_np = embeddings.cpu().numpy()
            normalized_embeddings = []
            
            for emb in embeddings_np:
                norm = emb / np.linalg.norm(emb)
                normalized_embeddings.append(norm.tolist())
            
            logger.info(f"Generated {len(texts)} embeddings")
            return normalized_embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise

    async def generate_chunk_embeddings(
        self,
        chunks: List[Dict[str, Union[str, int]]]
    ) -> List[Dict]:
        """
        Generate embeddings for chunks
        chunks: List of {'text': str, 'index': int, 'file_id': str, 'file_name': str}
        """
        try:
            # Extract texts
            texts = [chunk['text'] for chunk in chunks]
            
            # Generate embeddings
            embeddings = await self.generate_embeddings_batch(texts)
            
            # Combine with chunk metadata
            result = []
            for chunk, embedding in zip(chunks, embeddings):
                result.append({
                    **chunk,
                    'embedding': embedding
                })
            
            logger.info(f"Generated embeddings for {len(result)} chunks")
            return result
            
        except Exception as e:
            logger.error(f"Error generating chunk embeddings: {str(e)}")
            raise

    async def generate_file_embeddings(
        self,
        file_id: str,
        file_name: str,
        chunks: List[str]
    ) -> List[Dict]:
        """
        Generate embeddings for all chunks of a file
        """
        try:
            # Prepare chunk data
            chunk_data = []
            for idx, chunk_text in enumerate(chunks):
                chunk_data.append({
                    'text': chunk_text,
                    'index': idx,
                    'file_id': file_id,
                    'file_name': file_name
                })
            
            # Generate embeddings
            result = await self.generate_chunk_embeddings(chunk_data)
            return result
            
        except Exception as e:
            logger.error(f"Error generating file embeddings: {str(e)}")
            raise

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings"""
        if self.model:
            return self.model.get_sentence_embedding_dimension()
        return 384  # Default for all-MiniLM-L6-v2

    def is_available(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None