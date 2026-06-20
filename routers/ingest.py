from fastapi import APIRouter, UploadFile, File, HTTPException
from services.chunker import extract_text, chunk_text
from services.embedder import embed_chunks
from services.vector_store import store_chunks

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF or .txt file.
    It gets chunked, embedded, and stored automatically.
    """
    # only allow PDF and txt files
    if not file.filename.endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only .pdf and .txt files are supported"
        )

    # read raw bytes from uploaded file
    file_bytes = await file.read()

    # step 1: extract raw text from file
    raw_text = extract_text(file_bytes, file.filename)

    # step 2: split text into chunks
    chunks = chunk_text(raw_text)

    # nothing to store if file was empty
    if not chunks:
        raise HTTPException(status_code=400, detail="File appears to be empty")

    # step 3: convert chunks to vectors
    embeddings = embed_chunks(chunks)

    # step 4: store everything in ChromaDB with source label
    store_chunks(chunks, embeddings, source=file.filename)

    return {
        "filename": file.filename,
        "chunks_stored": len(chunks),
        "message": f"Successfully ingested {file.filename}"
    }

"""
This router defines the ingestion API endpoints.
It coordinates the multi-step process of document ingestion:
1. Validating file types and reading content.
2. Extracting raw text and splitting it into semantic chunks.
3. Generating vector embeddings for each chunk.
4. Storing chunks and vectors in the database for later retrieval.
"""