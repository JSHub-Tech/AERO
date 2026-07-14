"""Natural-language routing agent: Gemini RAG over static docs + Neo4j/Supabase retrieval."""
from fastapi import APIRouter

from app.models.schemas import ChatQuery, ChatResponse
from app.services import rag_service

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(query: ChatQuery):
    """
    Send a natural language query to the Gemini RAG agent.
    It can answer questions about the knowledge base or search flights.
    """
    return await rag_service.process_chat(query)
