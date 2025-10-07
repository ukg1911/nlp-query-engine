from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import ingestion, query, metrics

app = FastAPI(
    title="NLP Query Engine API",
    description="API for database schema discovery, document ingestion, and natural language querying.",
    version="1.0.0"
)

# A list of origins that are allowed to make cross-origin requests.
# This is crucial for allowing your frontend to communicate with the backend.
allowed_origins = [
    "http://localhost:8080",  # The port your frontend Docker container uses
    "http://localhost:5173",  # The default port for local Vite development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include the API routers from other files to organize the application
app.include_router(ingestion.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")

@app.get("/", tags=["Root"])
async def read_root():
    """A simple root endpoint to confirm that the API is running."""
    return {"message": "Welcome to the NLP Query Engine API!"}

