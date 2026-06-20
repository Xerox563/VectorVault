import chromadb
from config import CHROMA_DB_PATH

client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

# one collection = one "table" that holds all our chunks
# get_or_create = don't crash if it already exists
collection = client.get_or_create_collection(name="documents")

'''
  Save chunks into ChromaDB with their vectors and source label.

    ChromaDB needs three things for each chunk:
    - id         : unique string identifier
    - embedding  : the vector
    - document   : the raw text
    - metadata   : extra info (we store source filename here)

    The source label in metadata is the key to Multi-Doc RAG.
    Every chunk knows which file it came from.
'''
def store_chunks(chunks: list[str], embeddings: list[list[float]], source: str):
 collection.add(
  ids = [f"{source}_{i}" for i in range(len(chunks))],
  embeddings = embeddings,
  documents=chunks,
  metadatas=[{"source":source} for _ in chunks]
 )

def get_collection_stats() -> dict:
    """
    How many chunks are stored total?
    Useful for debugging and health checks.
    """
    return {"total_chunks": collection.count()}

def list_sources() -> list[str]:
    """
    Get a list of all unique source filenames in the database.
    """
    results = collection.get(include=["metadatas"])
    metadatas = results["metadatas"]
    # extract "source" from each metadata dict and get unique values
    return list(set(m["source"] for m in metadatas if m))

"""
This module manages the local vector database using ChromaDB.
It handles the initialization of the persistent storage, creation of document
collections, and the logic for adding embedded chunks with metadata.
Metadata storage allows for multi-document filtering and tracking during retrieval.
"""
