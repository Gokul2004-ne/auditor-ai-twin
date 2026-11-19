# Deployment & Production Setup Guide

Instructions for deploying the Auditor AI Twin in local development, staging, or production cloud environments.

---

## 1. Environment Configurations

Create a `.env` in `backend/` and `.env.local` in `frontend/`.

### Backend `.env`:
```env
SUPABASE_URL=https://dkpcclyyuqzseqqmfqvh.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEO4J_URI=neo4j+ssc://30b20a56.databases.neo4j.io
NEO4J_USERNAME=30b20a56
NEO4J_PASSWORD=...
NEO4J_DATABASE=30b20a56

QDRANT_URL=https://4d5f85b2-488c-46a4-8393-4e3d951e1554.us-east4-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=...
QDRANT_COLLECTION=audit_documents

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

APP_ENV=production
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
```

### Frontend `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dkpcclyyuqzseqqmfqvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 2. Docker / Service Execution

### Run Backend
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Run Frontend
```bash
cd frontend
npm run build
npm run start -p 3000
```

---

## 3. Production Health Monitoring
- Backend Health: `GET http://localhost:8000/health` (verifies Supabase, Neo4j, Qdrant, and Gemini connectivity)
- Standards Graph API: `GET http://localhost:8000/api/standards`
- Public Verification Endpoint: `GET http://localhost:8000/api/reports/{id}/verify`
