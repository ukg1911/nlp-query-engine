import docx
import pypdf
import faiss
import numpy as np
from typing import List, IO
from sentence_transformers import SentenceTransformer

class DocumentProcessor:
    """
    Processes uploaded documents by extracting text, generating embeddings,
    and storing them in an in-memory FAISS index.
    """
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initializes the document processor, loads the embedding model,
        and sets up the FAISS index and document store.
        """
        try:
            self.model = SentenceTransformer(model_name)
            embedding_dim = self.model.get_sentence_embedding_dimension()
            
            # Initialize an in-memory FAISS index for vector search
            self.index = faiss.IndexFlatL2(embedding_dim)
            
            # --- THIS IS THE FIX ---
            # Initialize a list to store the text chunks and metadata
            self.documents = []
            # --------------------

            print("DocumentProcessor initialized successfully with FAISS index.")
        except Exception as e:
            print(f"Error initializing DocumentProcessor: {e}")
            self.model = None
            self.index = None
            self.documents = []

    def _extract_text_from_pdf(self, file: IO) -> str:
        pdf_reader = pypdf.PdfReader(file)
        return "".join(page.extract_text() or "" for page in pdf_reader.pages)

    def _extract_text_from_docx(self, file: IO) -> str:
        doc = docx.Document(file)
        return "\n".join(para.text for para in doc.paragraphs)

    def _extract_text_from_txt(self, file: IO) -> str:
        return file.read().decode('utf-8')

    def process_and_index_document(self, file: IO, filename: str) -> dict:
        """
        Processes a single document, generates embeddings, and adds them to the index.
        """
        if not self.model or not self.index is not None:
            return {"error": "Embedding model or FAISS index is not available."}
        
        text = ""
        try:
            if filename.endswith(".pdf"):
                text = self._extract_text_from_pdf(file)
            elif filename.endswith(".docx"):
                text = self._extract_text_from_docx(file)
            elif filename.endswith(".txt"):
                text = self._extract_text_from_txt(file)
            else:
                return {"error": f"Unsupported file type: {filename}"}

            if not text.strip():
                return {"error": f"No text could be extracted from {filename}."}
            
            # TODO: Implement dynamic chunking here. For now, we treat the whole doc as one chunk.
            chunks = [text]
            
            # Generate embeddings for the chunks
            embeddings = self.model.encode(chunks)
            
            # Add the new embeddings to the FAISS index
            self.index.add(np.array(embeddings, dtype=np.float32))
            
            # Store the corresponding text chunks and their metadata
            for chunk in chunks:
                self.documents.append({
                    "filename": filename,
                    "content": chunk
                })

            return {
                "filename": filename,
                "status": "processed and indexed",
                "chunks_added": len(chunks)
            }
        except Exception as e:
            return {"error": f"Failed to process document {filename}: {str(e)}"}

