import os
from fastapi import APIRouter, Body, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from typing import List
from core.services.schema_discovery import SchemaDiscovery
from core.services.document_processor import DocumentProcessor
from core.services.activity_logger import activity_logger

# --- Dependency Injection ---
# Creates a single, shared instance of the DocumentProcessor for the application
document_processor_service = DocumentProcessor()
def get_doc_processor():
    """Dependency injector to provide the shared DocumentProcessor instance."""
    return document_processor_service
# --------------------------

router = APIRouter()
schema_discovery_service = SchemaDiscovery()

class ConnectionPayload(BaseModel):
    # The frontend sends the connection string, but we will ignore it
    # in favor of the environment variable for Docker networking.
    connection_string: str

@router.post("/connect-database", tags=["Ingestion"])
async def connect_and_discover_schema(payload: ConnectionPayload = Body(...)):
    """
    Handles the database connection request from the frontend.
    It uses the internal DATABASE_URL for a reliable connection within Docker.
    """
    # --- THIS IS THE FIX ---
    # Ignore the payload's connection_string and use the one set in the
    # Docker environment. This allows the backend container to find the db container.
    connection_string = os.getenv("DATABASE_URL")
    # --------------------

    if not connection_string:
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL environment variable is not set in the backend."
        )

    # Call the service to analyze the database schema
    schema_info = schema_discovery_service.analyze_database(connection_string)

    if "error" in schema_info:
        raise HTTPException(status_code=500, detail=schema_info["error"])

    # Log the successful connection
    table_count = len(schema_info.get('tables', []))
    activity_logger.log(
        type="connection",
        description=f"Connected to database and discovered {table_count} tables."
    )
    return schema_info

@router.post("/upload-documents", tags=["Ingestion"])
async def upload_documents(
    files: List[UploadFile] = File(...),
    doc_processor: DocumentProcessor = Depends(get_doc_processor)
):
    """Handles the upload and processing of multiple document files."""
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")

    results = []
    for file in files:
        # Process each file and add its embedding to the in-memory index
        result = doc_processor.process_and_index_document(file.file, file.filename)
        results.append(result)
    
    # Log the successful upload batch
    successful_uploads = len([r for r in results if "error" not in r])
    activity_logger.log(
        type="upload",
        description=f"Processed {successful_uploads} / {len(files)} documents."
    )
    return {"message": f"{len(files)} files processed.", "results": results}

