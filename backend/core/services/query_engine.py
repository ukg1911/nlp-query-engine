import os
import time
import json
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
import google.generativeai as genai
from dotenv import load_dotenv
import numpy as np
from .document_processor import DocumentProcessor

# Load environment variables from a .env file if it exists
load_dotenv()

# Configure the Gemini API client at startup
try:
    # This will only succeed if the GOOGLE_API_KEY is set in the environment
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Warning: Could not configure Gemini API. LLM features will be disabled. Error: {e}")

class QueryEngine:
    """
    Processes natural language queries by classifying them, generating SQL,
    performing semantic search, and extracting specific answers from documents.
    """
    def __init__(self, schema: dict = None):
        """
        Initializes the query engine and the Gemini model client.
        """
        self.schema = schema
        # Use a stable and available model name for the API
        self.llm = genai.GenerativeModel('gemini-2.5-flash') if os.getenv("GOOGLE_API_KEY") else None
        # Simple in-memory dictionary for query caching
        self.cache = {}

    def get_cache_size(self):
        """Returns the number of items currently in the cache."""
        return len(self.cache)

    def _classify_query(self, user_query: str) -> str:
        """A simple keyword-based classifier to determine query type."""
        query_lower = user_query.lower()
        sql_keywords = ["salary", "employee", "department", "hired", "count", "average", "list"]
        doc_keywords = ["skills", "experience", "resume", "review", "contract", "performance", "contact", "email", "link", "github"]
        
        is_sql = any(keyword in query_lower for keyword in sql_keywords)
        is_doc = any(keyword in query_lower for keyword in doc_keywords)

        if is_sql and not is_doc:
            return "SQL"
        elif is_doc and not is_sql:
            return "DOCUMENT"
        else: # If it's ambiguous or contains keywords from both, treat as Hybrid
            return "HYBRID"

    def _generate_sql_from_nlp(self, user_query: str) -> str:
        """Uses the Gemini LLM to convert a natural language query into an SQL query."""
        if not self.llm: return "LLM_ERROR: LLM not configured."
        if not self.schema: return "LLM_ERROR: Database schema is not available."

        prompt = f"""
        You are an expert SQL generator. Based on the database schema provided below, write a single, precise, and executable SQL query to answer the user's question.

        **Database Schema:**
        ```json
        {json.dumps(self.schema, indent=2)}
        ```

        **User's Question:**
        "{user_query}"

        **Instructions:**
        1. Only output the SQL query. Do not include any explanations, markdown, or introductory text.
        2. Ensure the query is valid for a PostgreSQL database.
        3. Do not hallucinate table or column names; use only what is provided in the schema.
        4. If the question cannot be answered with the given schema, output: "SELECT 'Sorry, I cannot answer this question with the available data.'"

        **Generated SQL Query:**
        """
        try:
            response = self.llm.generate_content(prompt)
            sql_query = response.text.strip().replace("```sql", "").replace("```", "")
            return sql_query
        except Exception as e:
            print(f"Error generating SQL from LLM: {e}")
            return f"LLM_ERROR: {str(e)}"

    def _extract_answer_from_document(self, user_query: str, document_snippet: str) -> str:
        """
        Uses the LLM to perform extractive QA on a document snippet.
        This is the second step of the RAG pipeline.
        """
        if not self.llm:
            return "LLM not configured."

        prompt = f"""
        You are an expert at reading comprehension. Based ONLY on the following text snippet from a document, please provide a direct and concise answer to the user's question.

        **Document Snippet:**
        ---
        {document_snippet}
        ---

        **User's Question:**
        "{user_query}"

        **Instructions:**
        1. If the answer is explicitly present in the text, provide ONLY the specific answer (e.g., just the email address, just the link).
        2. If the answer cannot be found in the text, respond with ONLY the phrase: "The information was not found in the provided document."
        """
        try:
            response = self.llm.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error extracting answer from document: {e}")
            return f"Error during answer extraction: {str(e)}"

    def process_query(self, user_query: str, connection_string: str, doc_processor: DocumentProcessor) -> dict:
        """The main method to process a user's query from start to finish."""
        start_time = time.time()
        
        if user_query in self.cache:
            cached_result = self.cache[user_query]
            cached_result["performance_metrics"]["cache_status"] = "hit"
            return cached_result

        from .schema_discovery import SchemaDiscovery
        self.schema = SchemaDiscovery().analyze_database(connection_string)
        if "error" in self.schema:
             return {"error": f"Schema discovery failed: {self.schema['error']}"}

        query_type = self._classify_query(user_query)
        response_results = []
        
        if query_type in ["SQL", "HYBRID"]:
            sql_query = self._generate_sql_from_nlp(user_query)
            if sql_query.startswith("LLM_ERROR:"):
                error_message = sql_query.replace("LLM_ERROR: ", "")
                response_results.append({"source": "Database", "query": "Error generating SQL", "data": {"error": error_message}})
            else:
                try:
                    engine = create_engine(connection_string)
                    df = pd.read_sql_query(sql_query, engine)
                    sql_data = df.to_dict(orient='records')
                    response_results.append({"source": "Database", "query": sql_query, "data": sql_data})
                except SQLAlchemyError as e:
                    error_message = f"Error executing SQL: {e.args[0] if e.args else 'Unknown SQL Error'}"
                    response_results.append({"source": "Database", "query": sql_query, "data": {"error": error_message}})
        
        if query_type in ["DOCUMENT", "HYBRID"]:
            if doc_processor and doc_processor.index and doc_processor.index.ntotal > 0:
                # Step 1: Retrieval (Find the most relevant document snippet)
                query_embedding = doc_processor.model.encode([user_query])
                distances, indices = doc_processor.index.search(np.array(query_embedding, dtype=np.float32), k=1) # Get only the single best match
                
                doc_data = []
                if len(indices[0]) > 0:
                    best_doc_index = indices[0][0]
                    doc_content = doc_processor.documents[best_doc_index]
                    
                    # Step 2: Extraction (Send the best snippet to the LLM to find the specific answer)
                    extracted_answer = self._extract_answer_from_document(user_query, doc_content["content"])

                    similarity_score = 1 / (1 + distances[0][0])

                    doc_data.append({
                        "filename": doc_content["filename"],
                        "snippet": extracted_answer, # The final answer is now the concise extracted text
                        "relevance_score": float(similarity_score)
                    })
                response_results.append({"source": "Documents", "data": doc_data})
            else:
                response_results.append({"source": "Documents", "data": []})
            
        end_time = time.time()
        
        final_result = {
            "user_query": user_query, "query_type": query_type, "results": response_results,
            "performance_metrics": {"response_time_seconds": round(end_time - start_time, 2), "cache_status": "miss"}
        }
        self.cache[user_query] = final_result
        return final_result

