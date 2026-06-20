import fitz  # PyMuPDF for reading PDFs

def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Read raw text from uploaded file.
    Supports PDF and plain text files.
    """
    if filename.endswith(".pdf"):
        # open PDF from bytes (not from disk)
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        # join text from every page into one big string
        return "\n".join(page.get_text() for page in doc)
    else:
        # plain .txt file — just decode bytes to string
        return file_bytes.decode("utf-8")
    
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # only add if chunk has actual content (not empty/whitespace)
        if chunk.strip():
            chunks.append(chunk.strip())

        # move start forward, but step back by overlap
        # so next chunk shares some context with previous
        start += chunk_size - overlap

    return chunks

"""
This module handles document text extraction and chunking.
It uses PyMuPDF (fitz) for PDF files and basic decoding for text files.
The chunking logic ensures that large documents are broken into manageable pieces
with overlapping sections to maintain contextual information for retrieval.
"""
          