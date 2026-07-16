import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn

from .config import settings
from .api.routes import router
from .services.rag_service import RAGService
from .services.mega_service import MegaService
from .services.pinecone_service import PineconeService

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Initialize services
    try:
        logger.info("Initializing services...")
        rag_service = RAGService()
        mega_service = MegaService()
        pinecone_service = PineconeService()
        
        # Check connections
        if not mega_service.get_connection_status():
            logger.warning("Mega.nz connection failed on startup")
        
        if not pinecone_service.is_initialized():
            logger.warning("Pinecone initialization failed on startup")
        
        if not rag_service.mistral_service.is_available():
            logger.warning("Mistral service not available on startup")
        
        logger.info("Services initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing services: {str(e)}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down services...")
    logger.info(f"{settings.APP_NAME} stopped")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AIML RAG Service with FastAPI, Pinecone, and Mistral AI",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure this properly in production
)

# Include routers
app.include_router(router, prefix="/api/v1")

# Root route
@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# Main entry point
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )