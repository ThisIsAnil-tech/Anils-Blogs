import logging
from typing import List, Dict, Union, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
from ..config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._load_model()

    def _load_model(self):
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name, device=self.device)
            logger.info(f"Model loaded on {self.device}")
            logger.info(f"Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise

    async def generate_embedding(self, text: str) -> List[float]:
        if not self.model:
            self._load_model()
        
        try:
            embedding = self.model.encode(
                text,
                convert_to_tensor=True,
                show_progress_bar=False
            )
            
            embedding_np = embedding.cpu().numpy()
            embedding_normalized = embedding_np / np.linalg.norm(embedding_np)
            
            return embedding_normalized.tolist()
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        
        if not self.model:
            self._load_model()
        
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_tensor=True,
                show_progress_bar=False,
                batch_size=32
            )
            
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
        try:
            texts = [chunk['text'] for chunk in chunks]
            embeddings = await self.generate_embeddings_batch(texts)
            
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
        try:
            chunk_data = []
            for idx, chunk_text in enumerate(chunks):
                chunk_data.append({
                    'text': chunk_text,
                    'index': idx,
                    'file_id': file_id,
                    'file_name': file_name
                })
            
            result = await self.generate_chunk_embeddings(chunk_data)
            return result
            
        except Exception as e:
            logger.error(f"Error generating file embeddings: {str(e)}")
            raise

    def get_embedding_dimension(self) -> int:
        if self.model:
            return self.model.get_sentence_embedding_dimension()
        return 384

    def is_available(self) -> bool:
        return self.model is not None
