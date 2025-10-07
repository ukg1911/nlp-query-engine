# 🧠 NLP Query Engine

### Natural Language Interface for Dynamic Employee Databases  
Connect any employee database, upload documents, and ask questions in plain English — no hard-coded schemas or SQL knowledge required.

---

## 🚀 Overview

This project implements an **AI-powered Query Engine** that automatically discovers database schemas and enables **natural-language queries** across both structured (SQL) and unstructured (documents) employee data.  

The system dynamically adapts to any schema and returns results from either database tables, uploaded documents, or both.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Python 3.13 · FastAPI · SQLAlchemy · asyncio |
| **Frontend** | React (Vite) + Tailwind CSS + ShadCN UI |
| **Database** | PostgreSQL (local demo uses SQLite) |
| **NLP / Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Caching & Performance** | LRU Cache · Connection Pooling · Async Queries |
| **Testing** | `pytest` |
| **Deployment (optional)** | Docker + docker-compose |

---

## 🧩 Features

✅ **Dynamic Schema Discovery** — Detects tables, columns, and relationships automatically  
✅ **Document Upload** — Supports PDF, DOCX, TXT, CSV with intelligent chunking  
✅ **Natural-Language Query Interface** — Classifies queries (SQL / Document / Hybrid)  
✅ **Query Caching** — Instant *cache hit* for repeated queries  
✅ **Schema Visualization** — Graph/tree view of discovered structure  
✅ **Performance Metrics Dashboard** — Query count, average response time, docs processed  
✅ **Dark / Light Mode** — Seamless theme toggle (bonus feature)  
✅ **Real-time Feedback** — Live upload progress, success indicators, and activity logs  

---

## 🧠 Example Queries

| Query Type | Example | Result Source |
|-------------|----------|----------------|
| SQL | “How many employees do we have?” | Database |
| SQL | “Average salary by department” | Database |
| Document | “What is GitHub ID of Utkarsh?” | Resume PDF |
| Document | “Who has Python experience?” | Uploaded documents |
| Hybrid | “Show Python developers in Engineering” | Database + Documents |
| Hybrid | “Top 5 highest paid engineers” | Combined results |

---

## 📺 Demo Video

🎥 **Loom Demo (5 – 7 min):** [Add your Loom link here]

**Demo Flow:**
1. Connect to a database → schema auto-discovered  
2. Upload documents (PDF resume, etc.) → progress indicator  
3. Execute 6 queries (2 SQL, 2 Document, 2 Hybrid)  
4. Demonstrate cache hits, error handling, and metrics updates  
5. Toggle dark/light mode  
6. Wrap-up: architecture + performance summary  

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ukg1911/nlp-query-engine.git
cd nlp-query-engine


2️⃣ Backend Setup
cd backend
python -m venv .venv
.venv\Scripts\activate   # (Windows)
pip install -r requirements.txt
uvicorn main:app --reload


Backend runs at http://localhost:8000

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev


Frontend runs at http://localhost:5173

4️⃣ Configuration

Edit config.yml to update:

database:
  connection_string: postgresql://user:password@localhost:5432/mydb
embeddings:
  model: sentence-transformers/all-MiniLM-L6-v2
cache:
  ttl_seconds: 300
