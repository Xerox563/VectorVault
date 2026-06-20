from config import TOP_K
from services.embedder import embed_chunks
from services.vector_store import collection


def search(query: str, top_k: int = TOP_K, source_filter: str = None) -> list[dict]:
    """
    Search ChromaDB for chunks most relevant to the query.

    Steps:
    1. Convert query text → vector (same model used during ingestion)
    2. ChromaDB compares query vector vs all stored chunk vectors
    3. Returns top_k closest matches with scores and source labels

    source_filter: optional — if provided, only search chunks
    from that specific document (this is routing from Step 3 theory)
    """

    # embed the query using same model we used for chunks
    # IMPORTANT: must use same model — different models produce
    # incompatible vector spaces, comparison would be meaningless
    query_vector = embed_chunks([query])[0]  # [0] because we only have one query

    # build filter if user wants results from one specific doc
    # ChromaDB uses "where" clause for metadata filtering
    where_filter = {"source": source_filter} if source_filter else None

    # search ChromaDB
    # n_results = how many chunks to return
    # include = what data to return alongside the chunks
    results = collection.query(
        query_embeddings=[query_vector],  # list of query vectors
        n_results=top_k,
        where=where_filter,               # None = search all docs
        include=["documents", "metadatas", "distances"]
        # distances = how far each chunk is from query vector
        # smaller distance = more similar = more relevant
    )

    # ChromaDB returns nested lists (because you can send multiple queries)
    # we sent one query so we take index [0] from each
    chunks    = results["documents"][0]   # list of chunk texts
    metadatas = results["metadatas"][0]   # list of {"source": "filename"}
    distances = results["distances"][0]   # list of distance scores

    # package everything into clean dicts
    hits = []
    for chunk, meta, distance in zip(chunks, metadatas, distances):
        hits.append({
            "chunk": chunk,
            "source": meta["source"],

            # convert distance → similarity score (0 to 1)
            # distance 0   = identical = similarity 1.0
            # distance 2   = opposite  = similarity 0.0
            # formula: 1 - (distance / 2) keeps it in 0-1 range
            "similarity": round(1 - (distance / 2), 4)
        })

    # sort by similarity descending (most relevant first)
    hits.sort(key=lambda x: x["similarity"], reverse=True)

    return hits

"""
This module implements the retrieval logic for the RAG system.
It takes a natural language query, converts it into an embedding vector,
and performs a similarity search against the ChromaDB collection.
It also supports metadata filtering to restrict searches to specific documents.
"""