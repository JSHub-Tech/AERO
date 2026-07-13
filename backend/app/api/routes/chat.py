"""Natural-language routing agent: Gemini RAG over static docs + Neo4j/Supabase retrieval."""
from fastapi import APIRouter

from app.models.schemas import ChatQuery, ChatResponse

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(query: ChatQuery):
    # TODO: call app/services/rag_service.py once implemented
    return ChatResponse(answer="RAG service not yet implemented.", sources=[])
