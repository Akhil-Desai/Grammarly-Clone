# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Grammarly-inspired writing assistant with real-time grammar checking, AI-powered rewrites, and document enhancement. Built as a monorepo with a React/TypeScript frontend ([writerly/](writerly/)) and Node.js/Express backend ([backend/](backend/)).

## Architecture

### Frontend (writerly/)
- **Stack**: React 18 + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Routing**: React Router with protected routes via [ProtectedRoute.tsx](writerly/src/components/ProtectedRoute.tsx)
- **Auth**: Context-based authentication using [use-auth.tsx](writerly/src/hooks/use-auth.tsx) with JWT tokens stored in localStorage
- **State**: TanStack Query for server state, React Context for auth
- **Dev Server**: Vite on port 8080 with proxy to backend at `/api` → `http://localhost:5001`

Key routes:
- `/login`, `/signup` - Authentication pages
- `/` - Main editor (protected)
- `/demo` - Demo/index page (protected)

### Backend (backend/)
- **Stack**: Node.js + Express + ES modules
- **Auth**: Custom JWT implementation (HS256) with 15-minute token expiry
- **Storage**: File-based user storage in `.data/users.json` (no database yet)
- **AI Integration**: Google Gemini API via `@google/generative-ai`
- **Port**: 5001 (configurable via `PORT` env var, note: frontend proxy expects 5001 not default 5000)

Authentication flow:
- Passwords hashed with scrypt + salt
- JWT tokens signed with `AUTH_SECRET` or `JWT_SECRET` env var
- Protected routes use `authenticate` middleware
- Token verification includes expiry check

### Target Architecture vs Current Implementation

The project follows a layered architecture (see architecture diagram in repo):

**Target Architecture** (from [architecture.md](architecture.md)):
```
User Interface (Voice Settings, AI, Document)
           ↓
    API Gateway (Auth + Rate Limit + Input Sanitization)
           ↓
Core Services:
  - Real-time Grammar Engine (WebSocket, LanguageTool)
  - AI Engine (Rewrite & Chat)
  - User Profile & Settings
  - Prompt Builder
           ↓
Model Router → External APIs (Claude, Gemini, OpenAI, Grammar API)
            ↘ Local Quantized Model (Llama 3.2 3B)
           ↓
Storage: Database (PostgreSQL/MongoDB) + Redis Cache
```

**Current Implementation** (v0.1):
- ✅ Basic API Gateway (Express server with auth middleware)
- ✅ User authentication (JWT-based, file storage)
- ✅ AI Engine (Gemini API integration only)
- ❌ Real-time Grammar Engine (not implemented)
- ❌ WebSocket support (not implemented)
- ❌ Prompt Builder service (not implemented)
- ❌ Model Router (not implemented - Gemini hardcoded)
- ❌ Database layer (using file-based storage)
- ❌ Redis caching (not implemented)
- ❌ Rate limiting (not implemented)
- ❌ Local LLM (not implemented)

**Development Priority**: The architecture is aspirational. Current focus is on building core functionality with simple implementations before scaling to the full microservices architecture.

## Development Commands

### Frontend (writerly/)
```bash
cd writerly
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (backend/)
```bash
cd backend
node server.js       # Start backend server on port 5001
```

**Important**: No `npm start` script exists in backend. Always use `node server.js` directly.

### Full Stack Development
Run both servers simultaneously in separate terminals:
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd writerly && npm run dev
```

Frontend will be available at http://localhost:8080 with API proxied to backend.

## Environment Variables

### Backend (backend/.env)
```env
GEMINI_API_KEY=your_key_here          # Required for AI rewrites
AUTH_SECRET=your_secret_here          # JWT signing secret (falls back to JWT_SECRET or "dev-secret-change-me")
PORT=5001                             # Backend port (must match frontend proxy config)
```

**Critical**: Backend must run on port 5001 to match the Vite proxy configuration in [vite.config.ts:13](writerly/vite.config.ts#L13). If you change the backend port, update the proxy target.

## Key Files and Patterns

### Authentication Implementation
- [server.js:108-171](backend/server.js#L108-L171) - Auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- [server.js:49-94](backend/server.js#L49-L94) - JWT token signing/verification
- [use-auth.tsx](writerly/src/hooks/use-auth.tsx) - Frontend auth context with `authorizedFetch` helper
- [ProtectedRoute.tsx](writerly/src/components/ProtectedRoute.tsx) - Route protection component

### API Structure
Backend endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/rewrite` - AI text rewrite (requires auth, uses Gemini)

### Frontend Components
Main UI components in [writerly/src/components/](writerly/src/components/):
- `Editor.tsx` - Main text editor
- `SuggestionsSidebar.tsx` - AI suggestions panel
- `SuggestionCard.tsx` - Individual suggestion display
- `ToneAnalysisModal.tsx` - Tone adjustment interface
- `GoalsDialog.tsx` - Writing goals configuration
- `Header.tsx` - Top navigation bar

### Styling
- Uses shadcn/ui component library with Radix UI primitives
- TailwindCSS for styling with custom config in [tailwind.config.ts](writerly/tailwind.config.ts)
- Custom CSS tokens in [src/index.css](writerly/src/index.css)

## Important Technical Details

### Port Configuration
- Frontend dev server: **8080** (Vite)
- Backend API server: **5001** (Express)
- The Vite proxy forwards `/api/*` requests to `http://localhost:5001`

If you change backend port from 5001, you **must** update [vite.config.ts:13](writerly/vite.config.ts#L13).

### Authentication Flow
1. User registers/logs in via `/api/auth/*` endpoints
2. Backend returns JWT token + user object
3. Frontend stores token in localStorage
4. `authorizedFetch` helper auto-adds `Authorization: Bearer <token>` header
5. Backend middleware verifies token on protected routes
6. 401 responses trigger automatic logout

### File-Based User Storage
Users stored in `backend/.data/users.json` with schema:
```json
{
  "id": "uuid",
  "email": "string",
  "passwordHash": "salt:hash",
  "roles": ["user"],
  "tier": "free",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

This is temporary - architecture calls for PostgreSQL/MongoDB migration.

### Module System
Both frontend and backend use ES modules (`"type": "module"` in package.json):
- Use `import/export` syntax
- Backend uses `import.meta.url` for `__dirname` equivalent ([server.js:13-14](backend/server.js#L13-L14))

## Testing

No test infrastructure currently exists. When adding tests:
- Frontend: Consider Vitest (already Vite-based)
- Backend: Consider Jest or Vitest with node test runner
- E2E: Consider Playwright

## Deployment Considerations

Currently optimized for local development only. For production:
- Replace file-based storage with proper database
- Use real JWT library (e.g., `jsonwebtoken`)
- Add HTTPS/TLS termination
- Configure CORS properly
- Set strong `AUTH_SECRET`
- Add rate limiting
- Implement proper logging
- Follow security measures from [architecture.md:231-237](architecture.md#L231-L237)

## Next Implementation Steps

Based on the target architecture, the recommended development sequence is:

### Phase 1: Core Features (Current)
1. ✅ Authentication system
2. 🔄 Basic editor UI with text input
3. ⏳ AI rewrite functionality (Gemini integration exists, needs UI)
4. ⏳ Document storage and retrieval

### Phase 2: Grammar & Real-time Features
1. Integrate LanguageTool API or similar for grammar checking
2. Implement WebSocket server for real-time checking
3. Add debounced checking (300ms after typing stops)
4. Build suggestions UI in sidebar

### Phase 3: Advanced AI Features
1. Build Prompt Builder service (template-based prompts)
2. Implement Model Router for intelligent LLM selection
3. Add tone analysis and adjustment
4. Implement writing goals and tracking

### Phase 4: Storage & Scaling
1. Migrate from file-based to PostgreSQL (user data, metadata)
2. Add MongoDB for document content and revisions
3. Implement Redis caching layer
4. Add rate limiting per user tier

### Phase 5: Production Hardening
1. Replace custom JWT with `jsonwebtoken` library
2. Add comprehensive error handling and logging
3. Implement monitoring (Prometheus/Grafana per architecture)
4. Add automated tests (unit, integration, E2E)
5. Set up CI/CD pipeline

See [architecture.md](architecture.md) for detailed service specifications.

## Git Workflow

Current branch: `auth`
Main branch: `main`

Recent work focused on authentication implementation - new auth pages, protected routes, and backend auth endpoints added but frontend files deleted in migration.
