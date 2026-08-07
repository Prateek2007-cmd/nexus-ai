# CampusX AI — Autonomous Multi-Agent Backend Engine

Production-grade, asynchronous Python backend powered by **FastAPI**, **LangGraph**, **ChromaDB**, and **Google Gemini 2.5 Flash**.

---

## 🏛 System Architecture

```
[ Frontend: TanStack Start ]
          │
          ▼  (REST / WebSocket)
 [ FastAPI Gateway & Security ]
          │
          ├── Auth & Session Management (JWT + bcrypt)
          ├── Structured JSON Logging (structlog + contextvars)
          └── Rate Limiting & Error Recovery Middleware
          │
          ▼
   [ Orchestrator Agent ] ◄───────► [ Planner Agent ]
          │                           (Intent Parsing & DAG Plan)
          ├─────────────────────────────────────────┐
          ▼                                         ▼
   [ Specialist Agents (Parallel) ]         [ Memory System ]
   ├── Academic Agent                       ├── Session Context
   ├── Placement Agent                      ├── Long-term Preferences
   ├── Events Agent                         └── Compression Engine
   ├── Knowledge Agent (RAG)
   ├── Student Services Agent               [ Tool Registry ]
   ├── Communication Agent                  ├── Calendar Tool
   ├── Notification Agent                   ├── Email Tool
   └── Calendar Agent                       ├── Vector Search Tool
          │                                 └── Notification Tool
          ▼
   [ RAG Pipeline & ChromaDB ]
          │
          ▼
   [ Gemini 2.5 Flash Synthesis Engine ]
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- virtualenv / venv

### 2. Setup & Virtual Environment
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -e .
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and set your `GOOGLE_API_KEY` (Gemini API key).

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation available at:
- **Interactive Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

---

## 🧪 Running Tests
```bash
pytest tests/ -v
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status and agents online |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Register new user account |
| `GET` | `/api/agents` | List all 13 registered agents and stats |
| `POST` | `/api/chat/send` | Synchronous chat query execution |
| `WS` | `/api/chat/stream` | WebSocket real-time agent execution stream |
| `GET` | `/api/stats/hero` | Hero banner KPI statistics |
| `GET` | `/api/stats/kpis` | Operational dashboard KPIs |
| `GET` | `/api/analytics/throughput` | 24-hour request & token throughput |
| `GET` | `/api/academic/courses` | Student course enrollments & attendance |
| `GET` | `/api/placement/companies` | Placement drives & eligibility checks |
| `GET` | `/api/knowledge/documents` | Vector store document index |
