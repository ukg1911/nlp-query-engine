from pydantic import BaseModel
from typing import List, Optional, Any, Dict

class DBConnectionRequest(BaseModel):
    connection_string: str

class QueryRequest(BaseModel):
    query: str

class DocumentResult(BaseModel):
    source: str
    content: str

class QueryResponse(BaseModel):
    query_type: str
    sql_query: Optional[str] = None
    results: List[Dict[str, Any]] | List[DocumentResult]
    performance_metrics: dict