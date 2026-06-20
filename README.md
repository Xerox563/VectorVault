# VectorVault

A production-ready Multi-Document RAG (Retrieval-Augmented Generation) system built with FastAPI, ChromaDB, and Local Embeddings. Efficiently query across multiple PDF/TXT files with precise source attribution and grounding.

## Features
- **Multi-Document Ingestion**: Upload and process PDF/TXT files automatically.
- **Local Embeddings**: Uses `all-MiniLM-L6-v2` locally for privacy and speed.
- **Persistent Vector Store**: Managed via `ChromaDB` for efficient retrieval.
- **Source Attribution**: Every answer is grounded in specific source documents.
- **FastAPI Backend**: Clean, documented API for ingestion and querying.

## Tech Stack
- **Framework**: FastAPI
- **Database**: ChromaDB (Vector Database)
- **Embeddings**: Sentence-Transformers (Local)
- **LLM**: OpenRouter (Mistral/GPT-4 compatible)
- **PDF Processing**: PyMuPDF (fitz)

## Setup
1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure your `.env` file with `OPENROUTER_API_KEY`.
4. Run the server: `uvicorn main:app --reload`.
