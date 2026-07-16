import logging
import time
from typing import List, Dict, Optional, Any
import asyncio
from ..config import settings
from ..models.schemas import QueryRequest, QueryResponse, SourceDocument
from .embedding_service import EmbeddingService
from .pinecone_service import PineconeService
from .mistral_service import MistralService
from .mega_service import MegaService
from ..utils.security import ContentModerator
from ..utils.circuit_breaker import circuit_breaker_manager

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.pinecone_service = PineconeService()
        self.mistral_service = MistralService()
        self.mega_service = MegaService()
        self.content_moderator = ContentModerator()
        
        # RAG Configuration
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
        self.top_k = settings.TOP_K_RESULTS
        self.similarity_threshold = settings.SIMILARITY_THRESHOLD
        
        logger.info("RAG Service initialized")

    def _get_circuit_breaker(self):
        """Get or create circuit breaker for RAG pipeline"""
        return circuit_breaker_manager.get_or_create(
            name="rag_pipeline",
            failure_threshold=3,
            recovery_timeout=60,
            half_open_timeout=30
        )

    async def process_query(
        self,
        query_request: QueryRequest,
        endpoint: str = "/"
    ) -> QueryResponse:
        """
        Process a query through the RAG pipeline
        """
        start_time = time.time()
        query = query_request.query
        blog_name = query_request.blog_name
        
        # Moderate query
        is_safe, violations = self.content_moderator.moderate_text(query)
        if not is_safe:
            return QueryResponse(
                answer="I cannot respond to this query as it violates our ethical guidelines.",
                confidence=0.0,
                sources=[],
                rag_used=False,
                model_used="content_moderation",
                processing_time_ms=(time.time() - start_time) * 1000,
                fallback_used=False,
                query=query,
                endpoint=endpoint
            )
        
        try:
            # Step 1: Generate query embedding
            query_embedding = await self.embedding_service.generate_embedding(query)
            
            # Step 2: Build filter based on endpoint
            filter_dict = None
            if blog_name:
                filter_dict = {"file_name": {"$eq": f"{blog_name}.txt"}}
            
            # Step 3: Search Pinecone
            search_results = await self.pinecone_service.query_vectors(
                embedding=query_embedding,
                top_k=self.top_k,
                filter=filter_dict,
                include_metadata=True
            )
            
            # Step 4: Filter results by similarity threshold
            relevant_results = [
                r for r in search_results 
                if r['score'] >= self.similarity_threshold
            ]
            
            # Step 5: Check if we have relevant results
            if relevant_results:
                # Build context from results
                context = self._build_context(relevant_results)
                sources = self._extract_sources(relevant_results)
                
                # Step 6: Generate answer with RAG
                rag_response = await self.mistral_service.generate_with_rag(
                    question=query,
                    context=context,
                    sources=sources
                )
                
                # Step 7: Prepare response
                processing_time = (time.time() - start_time) * 1000
                
                return QueryResponse(
                    answer=rag_response.get('response', ''),
                    confidence=max([r['score'] for r in relevant_results[:3]]),
                    sources=sources,
                    rag_used=True,
                    model_used=rag_response.get('model', settings.MISTRAL_MODEL),
                    tokens_used=rag_response.get('usage', {}).get('total_tokens'),
                    processing_time_ms=processing_time,
                    fallback_used=False,
                    query=query,
                    endpoint=endpoint
                )
            else:
                # Fallback: Use Mistral without context
                logger.info(f"No relevant results found for query: {query[:50]}...")
                
                fallback_response = await self.mistral_service.generate_fallback_response(query)
                
                processing_time = (time.time() - start_time) * 1000
                
                return QueryResponse(
                    answer=fallback_response.get('response', ''),
                    confidence=0.0,
                    sources=[],
                    rag_used=False,
                    model_used=fallback_response.get('model', settings.MISTRAL_MODEL),
                    tokens_used=fallback_response.get('usage', {}).get('total_tokens'),
                    processing_time_ms=processing_time,
                    fallback_used=True,
                    query=query,
                    endpoint=endpoint
                )
                
        except Exception as e:
            logger.error(f"Error in RAG pipeline: {str(e)}")
            
            # Emergency fallback
            try:
                emergency_response = await self.mistral_service.generate_fallback_response(query)
                processing_time = (time.time() - start_time) * 1000
                
                return QueryResponse(
                    answer=emergency_response.get('response', "I encountered an error processing your request. Please try again."),
                    confidence=0.0,
                    sources=[],
                    rag_used=False,
                    model_used="emergency_fallback",
                    processing_time_ms=processing_time,
                    fallback_used=True,
                    query=query,
                    endpoint=endpoint
                )
            except Exception as e2:
                logger.error(f"Emergency fallback also failed: {str(e2)}")
                return QueryResponse(
                    answer="I'm currently unable to process your request. Please try again later.",
                    confidence=0.0,
                    sources=[],
                    rag_used=False,
                    model_used="none",
                    processing_time_ms=(time.time() - start_time) * 1000,
                    fallback_used=True,
                    query=query,
                    endpoint=endpoint
                )

    def _build_context(self, results: List[Dict]) -> str:
        """Build context string from search results"""
        context_parts = []
        for i, result in enumerate(results[:5], 1):
            metadata = result.get('metadata', {})
            file_name = metadata.get('file_name', 'Unknown')
            chunk_text = metadata.get('chunk_text', '')
            
            context_parts.append(f"[Document {i}: {file_name}]\n{chunk_text}")
        
        return "\n\n".join(context_parts)

    def _extract_sources(self, results: List[Dict]) -> List[SourceDocument]:
        """Extract source documents from search results"""
        sources = []
        seen_files = set()
        
        for result in results[:3]:
            metadata = result.get('metadata', {})
            file_name = metadata.get('file_name', 'Unknown')
            
            if file_name not in seen_files:
                seen_files.add(file_name)
                sources.append(
                    SourceDocument(
                        file_name=file_name,
                        similarity=result.get('score', 0.0),
                        chunk_text=metadata.get('chunk_text', '')[:200],
                        chunk_index=metadata.get('chunk_index', 0)
                    )
                )
        
        return sources

    async def index_file_content(
        self,
        file_id: str,
        file_name: str,
        content: str
    ) -> bool:
        """
        Index a file's content in Pinecone
        """
        try:
            # Step 1: Chunk the content
            chunks = self._chunk_content(content, file_id, file_name)
            
            if not chunks:
                logger.warning(f"No chunks generated for file: {file_name}")
                return False
            
            # Step 2: Generate embeddings for chunks
            chunk_embeddings = await self.embedding_service.generate_chunk_embeddings(chunks)
            
            # Step 3: Prepare vectors for Pinecone
            vectors = []
            for chunk in chunk_embeddings:
                vector_id = f"{file_id}_{chunk['index']}"
                vectors.append((
                    vector_id,
                    chunk['embedding'],
                    {
                        'file_id': file_id,
                        'file_name': file_name,
                        'chunk_index': chunk['index'],
                        'chunk_text': chunk['text'],
                        'file_path': f"{settings.MEGA_FOLDER_PATH}/{file_name}"
                    }
                ))
            
            # Step 4: Upsert to Pinecone
            await self.pinecone_service.upsert_vectors(vectors)
            
            logger.info(f"Successfully indexed file: {file_name} with {len(chunks)} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Error indexing file {file_name}: {str(e)}")
            return False

    async def delete_file_index(self, file_id: str) -> bool:
        """
        Delete a file's vectors from Pinecone
        """
        try:
            await self.pinecone_service.delete_by_filter(
                {"file_id": {"$eq": file_id}}
            )
            logger.info(f"Deleted index for file: {file_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file index {file_id}: {str(e)}")
            return False

    def _chunk_content(self, content: str, file_id: str, file_name: str) -> List[Dict]:
        """Chunk content using semantic chunking"""
        try:
            # Use LangChain's semantic chunking
            from langchain.text_splitter import RecursiveCharacterTextSplitter
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", ".", "!", "?", " ", ""]
            )
            
            chunks = text_splitter.split_text(content)
            
            # Prepare chunk data
            chunk_data = []
            for idx, chunk in enumerate(chunks):
                if chunk.strip():  # Skip empty chunks
                    chunk_data.append({
                        'text': chunk.strip(),
                        'index': idx,
                        'file_id': file_id,
                        'file_name': file_name
                    })
            
            logger.info(f"Created {len(chunk_data)} chunks for file: {file_name}")
            return chunk_data
            
        except ImportError:
            # Fallback: Simple chunking if LangChain not available
            logger.warning("LangChain not available, using fallback chunking")
            return self._fallback_chunking(content, file_id, file_name)
        except Exception as e:
            logger.error(f"Error chunking content: {str(e)}")
            return self._fallback_chunking(content, file_id, file_name)

    def _fallback_chunking(self, content: str, file_id: str, file_name: str) -> List[Dict]:
        """Fallback chunking method"""
        chunks = []
        chunk_size = self.chunk_size
        overlap = self.chunk_overlap
        
        for i in range(0, len(content), chunk_size - overlap):
            chunk = content[i:i + chunk_size]
            if chunk.strip():
                chunks.append({
                    'text': chunk.strip(),
                    'index': len(chunks),
                    'file_id': file_id,
                    'file_name': file_name
                })
        
        return chunks

    async def sync_all_files(self):
        """
        Sync all files from Mega.nz
        """
        try:
            logger.info("Starting full sync of all files...")
            
            # Step 1: Sync with Mega.nz
            sync_result = await self.mega_service.sync_folder()
            
            if sync_result.get('status') != 'success':
                logger.error(f"Sync failed: {sync_result}")
                return {'status': 'failed', 'message': 'Mega.nz sync failed'}
            
            # Step 2: Process new and updated files
            processed_files = sync_result.get('processed', {})
            new_files = processed_files.get('new', [])
            updated_files = processed_files.get('updated', [])
            
            all_files_to_process = new_files + updated_files
            
            logger.info(f"Processing {len(all_files_to_process)} files")
            
            # Step 3: Process each file
            successful = 0
            failed = 0
            
            for file_info in all_files_to_process:
                try:
                    # Get file content
                    content = await self.mega_service.get_file_content(file_info['id'])
                    
                    if content:
                        # Index the file
                        success = await self.index_file_content(
                            file_id=file_info['id'],
                            file_name=file_info['name'],
                            content=content
                        )
                        
                        if success:
                            successful += 1
                        else:
                            failed += 1
                except Exception as e:
                    logger.error(f"Error processing file {file_info.get('name')}: {str(e)}")
                    failed += 1
            
            logger.info(f"Sync completed: {successful} successful, {failed} failed")
            
            return {
                'status': 'success',
                'successful': successful,
                'failed': failed,
                'total_processed': successful + failed,
                'sync_result': sync_result
            }
            
        except Exception as e:
            logger.error(f"Error during sync: {str(e)}")
            return {'status': 'failed', 'message': str(e)}