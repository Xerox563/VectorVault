import os
from dotenv import load_dotenv

# load variables from .env file into environment
load_dotenv()

# OpenRouter settings
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# which LLM to use via OpenRouter (free and capable)
LLM_MODEL = "openai/gpt-3.5-turbo"

# embedding model (runs locally, no API needed)
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# ChromaDB will store its data in this folder
CHROMA_DB_PATH = "./chroma_db"

# how many top chunks to retrieve per query
TOP_K = 5

"""
This file manages the application configuration.
It loads environment variables using python-dotenv and defines global settings
for the LLM provider, local embedding model, and vector database paths.
"""