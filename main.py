from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import OPENROUTER_API_KEY
from routers.ingest import router as ingest_router
from routers.query import router as query_router

app = FastAPI(
    title="VectorVault API",
    description="Multi-Document RAG backend",
    version="1.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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