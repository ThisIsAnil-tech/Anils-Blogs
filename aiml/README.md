# AIML RAG Service

A FastAPI-based RAG (Retrieval-Augmented Generation) service that integrates with Mega.nz, Pinecone vector database, and Mistral AI.

## 🚀 Features

- **RAG Pipeline**: Semantic search with vector embeddings
- **Mega.nz Integration**: Auto-sync text files from cloud storage
- **Pinecone Vector DB**: High-performance vector search
- **Mistral AI**: LLM integration with fallback support
- **Auto-Sync**: Background file synchronization
- **Security**: Content moderation, rate limiting, input validation
- **Circuit Breaker**: Fault tolerance for external services
- **REST API**: FastAPI with OpenAPI documentation

## 📋 Prerequisites

- Python 3.9+
- Pinecone account (free tier)
- Mistral AI API key
- Mega.nz account

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd aiml-service
2. Create virtual environment
bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
3. Install dependencies
bash
pip install -r requirements.txt
4. Configure environment
bash
cp .env.example .env
# Edit .env with your credentials
5. Run the service
bash
python -m app.main
6. Access API documentation
Swagger UI: http://localhost:8000/docs

ReDoc: http://localhost:8000/redoc

🐳 Docker Deployment
Build Docker image
bash
docker build -t aiml-service .
Run with Docker Compose
bash
docker-compose up -d
📊 API Endpoints
Method	Endpoint	Description
GET	/	Service info
GET	/api/v1/health	Health check
POST	/api/v1/query	Query all documents
POST	/api/v1/blogs/{name}	Query specific blog
GET	/api/v1/files	List processed files
DELETE	/api/v1/files/{id}	Delete file
POST	/api/v1/sync	Trigger manual sync
GET	/api/v1/sync/status	Sync status
POST	/api/v1/sync/reset	Reset index
GET	/api/v1/metrics	Service metrics
GET	/api/v1/circuit-breakers	Circuit breaker status
🔒 Security Features
Input Validation: SQL injection, XSS prevention

Content Moderation: Hate speech, profanity filtering

Rate Limiting: IP-based (10/min, 100/hour)

Circuit Breakers: Fault tolerance for external services

Query Length Limit: Maximum 500 characters

📁 Project Structure
text
aiml-service/
├── app/
│   ├── api/            # API routes
│   ├── core/           # Core modules
│   ├── models/         # Pydantic models
│   ├── services/       # Business logic
│   ├── utils/          # Utilities
│   ├── config.py       # Configuration
│   └── main.py         # Entry point
├── tests/              # Test files
├── logs/               # Log files
├── data/               # Data storage
├── .env.example        # Environment template
├── requirements.txt    # Dependencies
├── Dockerfile          # Docker configuration
└── README.md           # Documentation
🧪 Testing
bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_api.py
📝 Environment Variables
Variable	Description
MEGA_EMAIL	Mega.nz account email
MEGA_PASSWORD	Mega.nz account password
MEGA_FOLDER_PATH	Folder path in Mega.nz
PINECONE_API_KEY	Pinecone API key
PINECONE_ENVIRONMENT	Pinecone environment
PINECONE_INDEX_NAME	Pinecone index name
MISTRAL_API_KEY	Mistral AI API key
MISTRAL_MODEL	Mistral model to use
DEBUG	Enable debug mode
LOG_LEVEL	Logging level
RATE_LIMIT_PER_MINUTE	Rate limit per minute
RATE_LIMIT_PER_HOUR	Rate limit per hour
CHUNK_SIZE	Text chunk size
CHUNK_OVERLAP	Chunk overlap
TOP_K_RESULTS	Number of results to retrieve
SIMILARITY_THRESHOLD	Minimum similarity score
SYNC_INTERVAL_MINUTES	Auto-sync interval
MAX_QUERY_LENGTH	Maximum query length
🚀 Performance Tuning
Adjust CHUNK_SIZE and CHUNK_OVERLAP for better retrieval

Modify TOP_K_RESULTS for more/less context

Tune SIMILARITY_THRESHOLD for precision/recall balance

Adjust rate limits based on usage patterns

🐛 Troubleshooting
Mega.nz Connection Issues
Verify credentials in .env

Check folder path exists

Ensure internet connectivity

Pinecone Issues
Verify API key and environment

Check index exists and is ready

Monitor quota usage

Mistral API Issues
Verify API key is valid

Check rate limits

Monitor token usage

📄 License
MIT License

🤝 Contributing
Fork the repository

Create feature branch

Commit changes

Push to branch

Create pull request

text

---