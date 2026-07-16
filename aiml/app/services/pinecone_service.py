import logging
import time
from typing import List, Dict, Any, Optional, Tuple
import pinecone
from pinecone import Pinecone, ServerlessSpec
from ..config import settings
from ..utils.circuit_breaker import circuit_breaker_manager

logger = logging.getLogger(__name__)

class PineconeService:
    def __init__(self):
        self.pc = None
        self.index = None
        self.index_name = settings.PINECONE_INDEX_NAME
        self.dimension = settings.PINECONE_DIMENSION
        self.initialized = False
        self._initialize_pinecone()

    def _initialize_pinecone(self):
        try:
            # Initialize Pinecone with new API
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            # Check if index exists
            existing_indexes = self.pc.list_indexes().names()
            
            if self.index_name not in existing_indexes:
                # Create index if it doesn't exist
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT
                    )
                )
                # Wait for index to be ready
                import time
                while not self.pc.describe_index(self.index_name).status.get('ready', False):
                    time.sleep(1)
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            self.initialized = True
            logger.info(f"Successfully connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
            self.initialized = False

    def _get_circuit_breaker(self):
        return circuit_breaker_manager.get_or_create(
            name="pinecone",
            failure_threshold=3,
            recovery_timeout=60,
            half_open_timeout=30
        )

    async def upsert_vectors(self, vectors: List[Tuple[str, List[float], Dict[str, Any]]], namespace: str = "") -> bool:
        if not self.initialized:
            self._initialize_pinecone()

        def _upsert():
            try:
                vector_list = [
                    {"id": vec_id, "values": embedding, "metadata": metadata}
                    for vec_id, embedding, metadata in vectors
                ]
                
                batch_size = 100
                for i in range(0, len(vector_list), batch_size):
                    batch = vector_list[i:i + batch_size]
                    self.index.upsert(vectors=batch, namespace=namespace)
                    logger.info(f"Upserted batch {i//batch_size + 1}")
                
                logger.info(f"Successfully upserted {len(vectors)} vectors")
                return True
            except Exception as e:
                logger.error(f"Error upserting vectors: {str(e)}")
                raise

        try:
            circuit_breaker = self._get_circuit_breaker()
            return circuit_breaker.call(_upsert)
        except Exception as e:
            logger.error(f"Circuit breaker tripped: {str(e)}")
            raise

    async def query_vectors(self, embedding: List[float], top_k: int = 5, filter: Optional[Dict] = None, namespace: str = "", include_metadata: bool = True) -> List[Dict[str, Any]]:
        if not self.initialized:
            self._initialize_pinecone()

        def _query():
            try:
                response = self.index.query(
                    vector=embedding,
                    top_k=top_k,
                    filter=filter,
                    namespace=namespace,
                    include_metadata=include_metadata
                )
                
                results = []
                for match in response.get('matches', []):
                    results.append({
                        'id': match.get('id'),
                        'score': match.get('score', 0.0),
                        'metadata': match.get('metadata', {})
                    })
                
                logger.info(f"Query returned {len(results)} results")
                return results
            except Exception as e:
                logger.error(f"Error querying Pinecone: {str(e)}")
                raise

        try:
            circuit_breaker = self._get_circuit_breaker()
            return circuit_breaker.call(_query)
        except Exception as e:
            logger.error(f"Circuit breaker tripped: {str(e)}")
            return []

    async def delete_vectors(self, ids: List[str], namespace: str = "") -> bool:
        if not self.initialized:
            self._initialize_pinecone()

        def _delete():
            try:
                self.index.delete(ids=ids, namespace=namespace)
                logger.info(f"Deleted {len(ids)} vectors")
                return True
            except Exception as e:
                logger.error(f"Error deleting vectors: {str(e)}")
                raise

        try:
            circuit_breaker = self._get_circuit_breaker()
            return circuit_breaker.call(_delete)
        except Exception as e:
            logger.error(f"Circuit breaker tripped: {str(e)}")
            return False

    async def delete_by_filter(self, filter: Dict[str, Any], namespace: str = "") -> bool:
        if not self.initialized:
            self._initialize_pinecone()

        def _delete_by_filter():
            try:
                self.index.delete(filter=filter, namespace=namespace)
                logger.info(f"Deleted vectors with filter: {filter}")
                return True
            except Exception as e:
                logger.error(f"Error deleting vectors by filter: {str(e)}")
                raise

        try:
            circuit_breaker = self._get_circuit_breaker()
            return circuit_breaker.call(_delete_by_filter)
        except Exception as e:
            logger.error(f"Circuit breaker tripped: {str(e)}")
            return False

    async def delete_all_vectors(self, namespace: str = "") -> bool:
        try:
            return await self.delete_by_filter({}, namespace)
        except Exception as e:
            logger.error(f"Error deleting all vectors: {str(e)}")
            return False

    async def get_index_stats(self) -> Dict[str, Any]:
        if not self.initialized:
            self._initialize_pinecone()

        def _get_stats():
            try:
                return self.index.describe_index_stats()
            except Exception as e:
                logger.error(f"Error getting index stats: {str(e)}")
                return {}

        try:
            circuit_breaker = self._get_circuit_breaker()
            return circuit_breaker.call(_get_stats)
        except Exception as e:
            logger.error(f"Circuit breaker tripped: {str(e)}")
            return {}

    async def reset_index(self):
        try:
            await self.delete_all_vectors()
            self.pc.delete_index(self.index_name)
            import time
            time.sleep(5)
            self._initialize_pinecone()
            logger.info(f"Successfully reset Pinecone index: {self.index_name}")
            return True
        except Exception as e:
            logger.error(f"Error resetting Pinecone index: {str(e)}")
            return False

    def is_initialized(self) -> bool:
        return self.initialized
