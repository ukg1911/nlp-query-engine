from fastapi import APIRouter, HTTPException
from backend.services.schema_discovery import get_cached_schema

router = APIRouter()

@router.get("/")
async def get_current_schema():
    schema = get_cached_schema()
    if not schema:
        raise HTTPException(status_code=404, detail="No schema has been discovered yet.")
    return schema