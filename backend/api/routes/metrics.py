from fastapi import APIRouter, Depends
from core.services.query_engine import QueryEngine
from core.services.document_processor import DocumentProcessor
from core.services.activity_logger import activity_logger # Import the shared logger instance
from .query import get_query_engine
from .ingestion import get_doc_processor

router = APIRouter()

@router.get("/metrics", tags=["Metrics"])
async def get_system_metrics(
    query_engine: QueryEngine = Depends(get_query_engine),
    doc_processor: DocumentProcessor = Depends(get_doc_processor)
):
    """
    Provides a rich set of metrics for the frontend dashboard,
    including summary cards and recent activity.
    """
    # In a real production app, trend data would be calculated by
    # comparing current values to historical data (e.g., from a time-series database).
    # For this project, we'll use static placeholder values for trends.
    summary_metrics = [
        {
            "title": "Total Queries",
            "value": str(query_engine.get_cache_size()), # Use method to get live cache size
            "change": "+5%", # Placeholder trend data
            "trend": "up"
        },
        {
            "title": "Documents Processed",
            "value": str(len(doc_processor.documents)),
            "change": "+10%", # Placeholder trend data
            "trend": "up"
        },
        {
            "title": "Databases Connected",
            "value": "1" if query_engine.schema else "0",
            "change": "0%",
            "trend": "neutral"
        },
        {
            "title": "Avg Query Time", # This would also require more detailed logging
            "value": "0.8s",
            "change": "-10%",
            "trend": "down"
        },
    ]

    return {
        "summary_metrics": summary_metrics,
        "recent_activity": activity_logger.get_activities()
    }

