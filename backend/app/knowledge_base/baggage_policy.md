# Baggage & Terminal Policy (sample knowledge base file)

Replace this with your real airline/terminal policy documents. Each markdown
file in this folder is chunked and embedded once (see the RAG indexing step
you'll add to app/services/rag_service.py) so the chat endpoint can retrieve
relevant passages alongside live Neo4j/Postgres data.

## London Heathrow (LHR) Transit
- International-to-international transfers do not require re-clearing security
  if staying airside.
- Standard economy carry-on allowance: 1 bag, 10kg, 56x45x25cm.

## New York JFK Arrivals
- All international arrivals must clear US Customs and re-check baggage,
  even on connecting itineraries.
