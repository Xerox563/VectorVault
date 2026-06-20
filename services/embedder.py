from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

model = SentenceTransformer(EMBEDDING_MODEL)

def embed_chunks(chunks : list[str]) -> list[list[float]]:
    # encode returns numpy array, convert to plain python list
    # ChromaDB expects plain python lists, not numpy arrays
    return model.encode(chunks).tolist()

"""
This module provides embedding services for text chunks.
It uses the SentenceTransformer library to load a local embedding model
(defined in config.py) and converts lists of text strings into high-dimensional
vector representations suitable for vector similarity search.
"""

    