def group_by_source(hits: list[dict]) -> dict[str, list[str]]:
    """
    Group retrieved chunks under their source filename.

    Input (flat list from retriever):
    [
        {"chunk": "Django has admin...", "source": "django.txt", "similarity": 0.95},
        {"chunk": "Flask is lightweight...", "source": "flask.txt", "similarity": 0.92},
        {"chunk": "Django uses ORM...", "source": "django.txt", "similarity": 0.88},
    ]

    Output (grouped by source):
    {
        "django.txt": ["Django has admin...", "Django uses ORM..."],
        "flask.txt":  ["Flask is lightweight..."]
    }

    Why: LLM needs to know which fact came from which doc.
    Flat list = LLM blends everything. Grouped = LLM can cite sources.
    """
    grouped = {}

    for hit in hits:
        source = hit["source"]
        chunk  = hit["chunk"]

        # if source seen for first time, create empty list for it
        if source not in grouped:
            grouped[source] = []

        grouped[source].append(chunk)

    return grouped


def build_context_string(grouped: dict[str, list[str]], max_chars: int = 3000) -> str:
    """
    Convert grouped chunks into a formatted string for the LLM prompt.
    Also handles token budget — stop adding if we hit max_chars.

    Output format:
    [SOURCE: django.txt]
    Django has admin panel built in...
    Django uses ORM for database...

    [SOURCE: flask.txt]
    Flask is lightweight and minimal...

    Why max_chars: LLMs have input limits. We cap at 3000 chars
    (~750 tokens) to leave room for the prompt template + answer.
    """
    context = ""
    total_chars = 0

    for source, chunks in grouped.items():
        # add source header
        source_header = f"\n[SOURCE: {source}]\n"
        context += source_header
        total_chars += len(source_header)

        for chunk in chunks:
            # check if adding this chunk would exceed budget
            if total_chars + len(chunk) > max_chars:
                # budget hit — stop adding more chunks
                context += "[...remaining content trimmed for length]\n"
                return context

            context += chunk + "\n"
            total_chars += len(chunk)

    return context


def get_sources_used(grouped: dict[str, list[str]]) -> list[str]:
    """
    Return just the list of source filenames that were used.
    We include this in the API response so user knows
    which docs contributed to the answer.
    """
    return list(grouped.keys())

"""
This module provides utilities to format retrieved information for the LLM.
It includes functions to group raw search results by their source document,
build a formatted context string with source attribution headers, and extract
a list of unique sources used in a specific RAG generation step.
"""