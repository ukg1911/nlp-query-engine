import os
from fastapi import APIRouter, Body, HTTPException, Depends
from pydantic import BaseModel
from core.services.query_engine import QueryEngine
from core.services.document_processor import DocumentProcessor
from core.services.activity_logger import activity_logger
from .ingestion import get_doc_processor

# --- Dependency Injection ---
# Creates a single, shared instance of the QueryEngine for the application.
query_engine_service = QueryEngine()

def get_query_engine():
    """Dependency injector to provide the shared QueryEngine instance."""
    return query_engine_service
# --------------------------

router = APIRouter()

# Update the Pydantic model to only require the 'query' field from the frontend.
class QueryPayload(BaseModel):
    query: str

@router.post("/query", tags=["Query"])
async def process_user_query(
    payload: QueryPayload = Body(...),
    query_engine: QueryEngine = Depends(get_query_engine),
    doc_processor: DocumentProcessor = Depends(get_doc_processor)
):
    """
    Handles incoming natural language queries from the frontend.
    It uses the internal DATABASE_URL for a reliable connection within Docker.
    """
    user_query = payload.query
    
    # Ignore any connection string from the payload and use the one set in the
    # Docker environment. This allows the backend container to find the db container.
    connection_string = os.getenv("DATABASE_URL")

    if not user_query or not connection_string:
        raise HTTPException(
            status_code=400,
            detail="Query is required and the DATABASE_URL must be set on the backend."
        )

    # Process the query using the correct internal connection string
    result = query_engine.process_query(user_query, connection_string, doc_processor)

    if "error" in result:
        # Log the failed query attempt
        activity_logger.log(
            type="query",
            description=f"Failed query: '{user_query}'",
            status="error"
        )
        raise HTTPException(status_code=500, detail=result["error"])

    # Log the successful query
    activity_logger.log(
        type="query",
        description=f"Executed {result.get('query_type', 'N/A')} query: '{user_query}'"
    )

    return result
