from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.retriever import search
from services.vector_store import get_collection_stats, list_sources
from services.context_builder import group_by_source, build_context_string, get_sources_used
from services.llm import get_llm_answer

router = APIRouter(prefix="/query", tags=["Query"])


# request body shape
class SearchRequest(BaseModel):
    question: str           # what the user is asking
    top_k: int = 5          # how many chunks to return
    source_filter: str = None  # optional: limit to one doc

class AskRequest(BaseModel):
    question: str           # user's question
    api_key: str            # user's OpenRouter API key
    top_k: int = 5          # how many chunks to retrieve
    source_filter: str = None  # optional routing to one doc



@router.post("/search")
def search_docs(request: SearchRequest):
    """
    Search across all ingested documents.
    Returns top K most relevant chunks with source labels and scores.

    source_filter is optional routing:
    - None           → search all docs (broad query)
    - "django.txt"   → only search django doc (specific query)
    """
    # make sure there's something to search
    stats = get_collection_stats()
    if stats["total_chunks"] == 0:
        raise HTTPException(
            status_code=404,
            detail="No documents ingested yet. Upload files first."
        )

    # run the search
    hits = search(
        query=request.question,
        top_k=request.top_k,
        source_filter=request.source_filter
    )

    if not hits:
        raise HTTPException(
            status_code=404,
            detail="No relevant chunks found for your query."
        )

    return {
        "question": request.question,
        "source_filter": request.source_filter,  # None = searched all
        "results_count": len(hits),
        "results": hits  # list of {chunk, source, similarity}
    }


@router.get("/sources")
def get_sources():
    """
    List all documents currently ingested.
    Helps user know what they can query against.
    """
    sources = list_sources()
    return {
        "total_documents": len(sources),
        "sources": sources
    }


@router.post("/ask")
def ask(request: AskRequest):
    """
    Full RAG pipeline in one endpoint:
    retrieve → group by source → build context → LLM → answer

    This is the endpoint users will actually use day to day.
    /search is for debugging retrieval. /ask is the full product.
    """

    # make sure something is ingested
    stats = get_collection_stats()
    if stats["total_chunks"] == 0:
        raise HTTPException(
            status_code=404,
            detail="No documents ingested yet. Upload files first."
        )

    # step 1: retrieve relevant chunks from ChromaDB
    hits = search(
        query=request.question,
        top_k=request.top_k,
        source_filter=request.source_filter
    )

    if not hits:
        raise HTTPException(
            status_code=404,
            detail="No relevant chunks found for this question."
        )

    # step 2: group chunks by source
    # {"django.txt": [...chunks], "flask.txt": [...chunks]}
    grouped = group_by_source(hits)

    # step 3: build context string with source headers + token budget
    # "[SOURCE: django.txt]\nDjango has admin...\n[SOURCE: flask.txt]\n..."
    context = build_context_string(grouped)

    # step 4: send to LLM, get answer with user's API key
    answer = get_llm_answer(request.question, context, request.api_key)

    # step 5: return answer + metadata about what sources were used
    return {
        "question": request.question,
        "answer": answer,
        "sources_used": get_sources_used(grouped),   # which docs contributed
        "chunks_retrieved": len(hits)
    }

"""
This router handles user queries against the ingested documents.
It provides endpoints for both raw semantic search and full RAG-based
question answering. The RAG pipeline involves retrieving relevant chunks,
organizing them by source, and using an LLM to generate a grounded answer.
"""
