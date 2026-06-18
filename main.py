from fastapi import FastAPI
from config import OPENROUTER_API_KEY

app = FastAPI(
    title="Multi-Document RAG",
    description="Ask questions across multiple documents",
    version="1.0"
)


# health check
@app.get("/health")
def health_check():
    return {
        "status":"running",
         "openrouter_key_loaded": bool(OPENROUTER_API_KEY)
    }