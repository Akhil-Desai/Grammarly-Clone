# Grammarly‑Clone

Full‑stack writing assistant: React editor, Node/Express backend, PostgreSQL storage, AI rewrite (Gemini), and spell/grammar checks (LanguageTool).

## Prerequisites
- Node 18+ and npm
- Docker (Desktop or Colima)
- macOS/Linux recommended

## Quick Start
```bash

# 1) Install deps
make bootstrap

# 2) Start Postgres and LanguageTool
make db-up
make lt-up

# 3) Initialize database schema
make db-init

# 4) Run backend and frontend
make dev
```

App URLs:
- Frontend: http://localhost:8080
- Backend API: http://localhost:5001

## Environment Variables
Create `backend/.env`:
```env
AUTH_SECRET=dev-secret-change-me
GEMINI_API_KEY=your_key_here
# If not set, backend defaults to http://localhost:8010
LT_URL=http://localhost:8010

# If you prefer to set DB explicitly:
# DATABASE_URL=postgres://postgres:postgres@localhost:5433/writerly
```

Notes:
- Postgres runs via Docker and is exposed on port 5433 (container 5432).
- `make db-init` applies `backend/schema.sql`.
- The backend automatically reads `backend/.env`.

## What’s Implemented
- Auth: JWT register/login/me
- Documents: create, list, fetch, autosave updates (content + title)
- Grammar: debounced checks via LanguageTool; suggestions with offsets; precise “Accept” by offsets
- AI Rewrite: Gemini proxy endpoint

API (auth required unless noted):
- `POST /api/auth/register` (public)
- `POST /api/auth/login` (public)
- `GET /api/auth/me`
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/documents/:id`
- `PUT /api/documents/:id`
- `POST /api/grammar/check`
- `POST /api/rewrite`

## Troubleshooting
- Port in use (5001): kill existing server
  ```bash
  lsof -i :5001
  kill -9 <PID>
  ```
- LanguageTool image not found: we use `erikvl87/languagetool:latest`
  ```bash
  docker compose pull languagetool
  make lt-up
  ```
- Postgres auth error: ensure URL matches the Docker DB
  ```
  DATABASE_URL=postgres://postgres:postgres@localhost:5433/writerly
  ```
- Verify LanguageTool:
  ```bash
  curl -s "http://localhost:8010/v2/check" \
    --data-urlencode "language=en-US" \
    --data-urlencode "text=Thiss is a smple sentence."
  ```

## Development Notes
- Frontend dev server proxies `/api` → `http://localhost:5001`
- Editor autosaves after ~800ms idle and flushes on unload
- Grammar checks debounce at ~500ms and operate on current editor text

