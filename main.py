from fastapi import FastAPI
from config import OPENROUTER_API_KEY
from routers.ingest import router as ingest_router
from routers.query import router as query_router

app = FastAPI(
    title="Multi-Document RAG",
    description="Ask questions across multiple documents",
    version="1.0"
)

app.include_router(ingest_router)
app.include_router(query_router)

# health check
@app.get("/health")
def health_check():
    return {
        "status": "running",
        "openrouter_key_loaded": bool(OPENROUTER_API_KEY)
    }

"""
The main entry point for the FastAPI application.
It initializes the FastAPI instance with project metadata, includes the
necessary routers (such as the ingestion router), and provides a basic
health check endpoint to verify the system status and configuration.
"""