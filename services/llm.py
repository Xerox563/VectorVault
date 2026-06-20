from openai import OpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, LLM_MODEL

# OpenRouter is OpenAI-compatible
# we just point the base_url to OpenRouter instead of OpenAI
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url=OPENROUTER_BASE_URL
)


def build_prompt(question: str, context: str) -> list[dict]:
    """
    Build the message list for the LLM.

    We use two messages:
    - system: tells LLM its role and strict rules
    - user: the actual question + context

    Why strict rules in system prompt:
    - "only use the context" → prevents hallucination
    - "cite sources" → keeps answers traceable
    - "say if unsure" → prevents confident wrong answers
    """

    system_prompt = """You are a helpful assistant that answers questions 
strictly based on the provided document context.

Rules:
- Only use information from the context below to answer
- Always mention which source document your answer comes from
- If the context doesn't contain enough info, say "I don't have enough information in the provided documents"
- Keep answers clear and concise
- If sources contradict each other, mention both perspectives"""

    # user message contains the context + question
    # context is already grouped by source (e.g. [SOURCE: django.txt])
    user_prompt = f"""Context from documents:
{context}

Question: {question}

Answer based only on the context above, citing the source documents:"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt}
    ]


def get_llm_answer(question: str, context: str) -> str:
    """
    Send question + context to LLM via OpenRouter.
    Returns the generated answer as a string.
    """
    messages = build_prompt(question, context)

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        temperature=0.2,   # low temperature = more factual, less creative
        max_tokens=500     # enough for a thorough answer
    )

    # extract the text content from response
    return response.choices[0].message.content.strip()

"""
This module handles communication with the Large Language Model (LLM).
It uses the OpenAI-compatible OpenRouter API to generate answers based on
provided document context. It includes prompt engineering logic to ensure
the LLM stays grounded in the provided facts and properly attributes sources.
"""