import os
from pathlib import Path
from google import genai
from google.genai import types

from app.config import settings
from app.models.schemas import ChatQuery, ChatResponse
from app.repositories import routing_repository

# 1. Initialize Gemini Client
# Uses client.aio for async compatibility in FastAPI
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# 2. Load Knowledge Base (RAG)
KB_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"

def load_system_instructions() -> str:
    instructions = (
        "You are an AI customer service agent for AERO Airlines. "
        "Answer passenger questions politely and concisely.\n\n"
        "If a passenger asks about policies, use the OFFICIAL AIRLINE POLICIES provided below.\n"
        "If a passenger asks to find a flight, use the `search_cheapest_flight` tool. "
        "When returning flight information, format it beautifully in Markdown. Do NOT use Markdown tables. Use beautifully formatted bulleted lists with bold labels instead.\n\n"
    )
    
    if KB_DIR.exists():
        instructions += "### OFFICIAL AIRLINE POLICIES ###\n"
        for md_file in KB_DIR.glob("*.md"):
            with open(md_file, "r", encoding="utf-8") as f:
                instructions += f"\n--- {md_file.name} ---\n"
                instructions += f.read()
                instructions += "\n"
        instructions += "###############################\n"
            
    return instructions

SYSTEM_INSTRUCTION = load_system_instructions()

# 3. Define the Tool (Function Calling)
search_tool = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="search_cheapest_flight",
            description="Search the graph database for the cheapest flight route between two airports.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "origin": types.Schema(type="STRING", description="The 3-letter IATA code for the departure airport (e.g., 'JFK')."),
                    "destination": types.Schema(type="STRING", description="The 3-letter IATA code for the arrival airport (e.g., 'LHR').")
                },
                required=["origin", "destination"]
            )
        )
    ]
)

async def search_cheapest_flight(origin: str, destination: str) -> dict:
    """
    Search the graph database for the cheapest flight route between two airports.
    
    Args:
        origin: The 3-letter IATA code for the departure airport (e.g., 'JFK').
        destination: The 3-letter IATA code for the arrival airport (e.g., 'LHR').
    """
    print(f"🤖 [AI Tool] Searching flights from {origin} to {destination}...")
    try:
        paths = await routing_repository.cheapest_path(origin.upper(), destination.upper(), max_hops=3)
        if not paths:
            return {"error": "No flights found between these airports."}
            
        best_path = paths[0]
        legs_data = []
        iata_path = best_path["iata_path"]
        for i, leg in enumerate(best_path["legs"]):
            legs_data.append({
                "flight_number": leg["flight_number"],
                "origin": iata_path[i],
                "destination": iata_path[i+1],
                "departure_time": str(leg["departure_time"]),
                "arrival_time": str(leg["arrival_time"]),
                "base_price": leg["base_price"]
            })
            
        return {
            "status": "success",
            "total_price": best_path["total_price"],
            "legs": legs_data
        }
    except Exception as e:
        return {"error": str(e)}


# 4. Main Chat Function
async def process_chat(query: ChatQuery) -> ChatResponse:
    if not settings.GEMINI_API_KEY:
        return ChatResponse(
            answer="⚠️ Error: GEMINI_API_KEY is missing from the backend .env file.", 
            sources=[]
        )
        
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        tools=[search_tool],
        temperature=0.3, # Keep answers factual
    )

    try:
        # Map our schema messages to Gemini Content objects
        contents = []
        for msg in query.messages:
            role = "user" if msg.sender == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.text)]))

        # 1. First generate_content call
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=config
        )
        
        # 2. Check if the AI wants to call our tool
        if response.function_calls:
            fc = response.function_calls[0]
            if fc.name == "search_cheapest_flight":
                origin = fc.args.get("origin")
                destination = fc.args.get("destination")
                
                # Execute the async function manually
                flight_data = await search_cheapest_flight(origin, destination)
                
                # We prompt the model again with the result in text to bypass functionCall API
                follow_up_prompt = (
                    f"User asked: {query.messages[-1].text}\n"
                    f"You requested to search flights from {origin} to {destination}.\n"
                    f"The search returned this JSON data: {flight_data}\n"
                    f"Please answer the user's question clearly and precisely based on this flight data."
                )
                
                # Replace the last user message with this follow-up prompt so it keeps history
                follow_up_msg = types.Content(role="user", parts=[types.Part.from_text(text=follow_up_prompt)])
                updated_contents = contents[:-1] + [follow_up_msg]
                
                response = await client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=updated_contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        temperature=0.3
                    )
                )
                
        return ChatResponse(
            answer=response.text,
            sources=[f.name for f in KB_DIR.glob("*.md")]
        )
    except Exception as e:
        return ChatResponse(
            answer=f"⚠️ AI Service Error: {str(e)}", 
            sources=[]
        )
