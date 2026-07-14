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
BAGGAGE_POLICY_PATH = KB_DIR / "baggage_policy.md"

def load_system_instructions() -> str:
    instructions = (
        "You are an AI customer service agent for AERO Airlines. "
        "Answer passenger questions politely and concisely.\n\n"
        "If a passenger asks about policies, use the OFFICIAL BAGGAGE POLICY provided below.\n"
        "If a passenger asks to find a flight, use the `search_cheapest_flight` tool. "
        "When returning flight information, format it beautifully in Markdown.\n\n"
    )
    
    if BAGGAGE_POLICY_PATH.exists():
        with open(BAGGAGE_POLICY_PATH, "r", encoding="utf-8") as f:
            instructions += "### OFFICIAL BAGGAGE POLICY ###\n"
            instructions += f.read()
            instructions += "\n###############################\n"
            
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
        for leg in best_path["legs"]:
            legs_data.append({
                "flight_number": leg["flight_number"],
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
        # 1. Send the initial query
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL, 
            contents=query.message,
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
                
                # Format the result back to Gemini
                part = types.Part.from_function_response(
                    name="search_cheapest_flight",
                    response={"result": flight_data}
                )
                
                # 3. Send the function result back to get the final text answer
                response = await client.aio.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=[query.message, response.candidates[0].content, part],
                    config=config
                )
                
        return ChatResponse(
            answer=response.text,
            sources=["baggage_policy.md"]
        )
    except Exception as e:
        return ChatResponse(
            answer=f"⚠️ AI Service Error: {str(e)}", 
            sources=[]
        )
