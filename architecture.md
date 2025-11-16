# Grammarly Clone - Architecture

## System Overview

This project is a Grammarly‑inspired writing assistant with:
- Authentication (JWT)
- Document storage (PostgreSQL, JSONB body)
- AI rewrite (Gemini)
- Spell/grammar checking (LanguageTool via Docker)

It is currently optimized for local development (single Node/Express backend + React frontend), with a clear path to scale.

## Architecture Components

### 1. Current Implementation (v0.2)

- Frontend (writerly/): React + Vite (port 8080)
- Backend (backend/): Node + Express (port 5001)
- Database: PostgreSQL (Docker, exposed on 5433)
- Grammar Engine: LanguageTool server (Docker, 8010)
- Make targets: bootstrap, db-up, db-init, lt-up, dev
- Auth: Custom JWT (HS256), 15-minute expiry

### 2. Core Services

#### 2.1 Grammar Engine (v1)
**Technology**: LanguageTool Server (Docker) proxied by Express
**Purpose**: Low-latency spelling/grammar checks while typing

**Endpoint (backend)**:
- `POST /api/grammar/check` → proxies to `LT_URL/v2/check` (default http://localhost:8010)
- Request: `{ text: string, language?: string }`
- Response (normalized): `{ suggestions: [{ id, from, to, message, ruleId, original, replacements[] }] }`

Frontend debounces input (≈500ms), calls this endpoint, and renders highlights. Applying a fix uses the returned `from/to` offsets to splice content reliably (handles multiple identical errors).

#### 2.2 AI Engine Service (Rewrite & Chat)
**Technology**: Python FastAPI + Celery for async processing
**Purpose**: Handle AI-powered rewrites and suggestions

**Components**:
- **Prompt Builder**: Constructs optimized prompts based on user settings
- **Model Router**: Directs requests to appropriate LLM
- **Response Parser**: Extracts and formats AI responses
- **Context Manager**: Maintains document context (2000 token window)

**Implementation**:
```python
# Core flow
1. Receive rewrite request
2. Build context-aware prompt
3. Route to appropriate model
4. Stream response back to client
5. Cache successful rewrites
```

#### 2.3 User Profile & Settings Service
**Technology**: Node.js Express + MongoDB
**Purpose**: Manage user preferences and writing profiles

**Data Model**:
```json
{
  "userId": "uuid",
  "voiceSettings": {
    "tone": "professional|casual|formal",
    "formality": 1-10,
    "profession": "string",
    "language": "en-US"
  },
  "customDictionary": [],
  "writingGoals": [],
  "ignoreRules": []
}
```

#### 2.4 Prompt Builder Service
**Technology**: Node.js microservice
**Purpose**: Generate optimized prompts for LLM queries

**Features**:
- Template-based prompt generation
- Context injection (document type, tone, formality)
- Token counting and optimization
- Prompt caching for common operations

**Prompt Templates**:
```javascript
{
  "rewrite": "Rewrite this text with {tone} tone and {formality} formality: {text}",
  "suggestions": "Provide 3 alternative ways to write: {text}",
  "grammar_fix": "Fix grammar while maintaining meaning: {text}"
}
```

### 3. Model Layer

#### 3.1 Model Router
**Technology**: Python service with model registry
**Purpose**: Intelligent routing to appropriate LLM based on task

**Routing Logic**:
- Grammar fixes → Local quantized model (Llama 3.2 3B)
- Simple rewrites → Gemini Flash
- Complex rewrites → Claude Sonnet
- Professional writing → OpenAI GPT-4o-mini
- Code documentation → Continue/Codestral

**Selection Criteria**:
```python
def select_model(task_type, complexity, user_tier):
    if task_type == "grammar":
        return local_model
    elif complexity < 0.3:
        return gemini_flash
    elif user_tier == "premium":
        return claude_sonnet
    else:
        return openai_gpt4_mini
```

#### 3.2 Local Quantized Model
**Technology**: Llama.cpp + Llama 3.2 3B Q4_K_M
**Infrastructure**: GPU server (min RTX 3060 12GB)
**Purpose**: Fast, cost-effective grammar and simple rewrites

**Optimization**:
- Batch processing for multiple requests
- Model warm-up on server start
- Response caching for common corrections

### 4. External APIs Integration

#### 4.1 LLM APIs
**Integration Pattern**: Adapter pattern for provider abstraction

```typescript
interface LLMProvider {
  complete(prompt: string, options: CompletionOptions): Promise<string>
  stream(prompt: string, options: StreamOptions): AsyncIterator<string>
}
```

**Providers**:
- **Claude API**: Complex rewrites, tone adjustment
- **Gemini API**: Fast suggestions, summarization  
- **OpenAI API**: General purpose, fallback provider
- **Grammar APIs**: LanguageTool, Grammarly API (if available)

### 5. Storage Layer

#### 5.1 Database (Current)
**PostgreSQL** (Docker: 5433->5432)
- Table `users` (id uuid PK, email citext unique via lower(email) index, settings jsonb, created_at)
- Table `documents` (id uuid PK, user_id FK, content_jsonb jsonb, metadata jsonb, version int, timestamps)
- Table `voice_profiles` (optional), `grammar_corrections`, `prompt_history`

Schema is in `backend/schema.sql`. Connection pooling via `backend/db/pool.js`.

Indexes:
- `users_email_lower_unique` on `lower(email)`
- `documents_user_updated_idx (user_id, updated_at desc)`
- `documents_content_jsonb_gin` (jsonb_path_ops)

### 6. Real-time Processing Pipeline

#### WebSocket Architecture
**Technology**: Socket.io + Redis Pub/Sub
**Flow**:
1. Client establishes WebSocket connection
2. Document changes stream to grammar engine
3. Grammar engine processes in 100-character chunks
4. Results broadcast back through WebSocket
5. Client applies suggestions in real-time

**Scaling Strategy**:
- Horizontal scaling with Redis Pub/Sub
- Sticky sessions for WebSocket connections
- Connection pooling for database queries

### 7. Security & Performance

#### Security Measures
- JWT-based authentication with refresh tokens
- API key management for external services
- Rate limiting per endpoint and user tier
- Input sanitization and XSS prevention
- Document encryption at rest (AES-256)
- HTTPS/WSS only communication

#### Performance Optimization
- CDN for static assets
- Database query optimization with indexes
- Connection pooling (min: 10, max: 100)
- Lazy loading for large documents
- Implement circuit breakers for external APIs
- Response compression (gzip)

### 8. Deployment Architecture

#### Container Orchestration
**Technology**: Kubernetes / Docker Swarm

**Services Deployment**:
```yaml
Services:
  - api-gateway: 2 replicas
  - grammar-engine: 3 replicas  
  - ai-engine: 2 replicas
  - user-service: 2 replicas
  - prompt-builder: 2 replicas
  - model-router: 1 replica
  - local-llm: 1 GPU node
```

#### Infrastructure Requirements
**Minimum for 20+ users**:
- 3x Application servers (8 CPU, 16GB RAM each)
- 1x GPU server for local model (8 CPU, 32GB RAM, RTX 3060)
- 1x Database server (4 CPU, 8GB RAM, 100GB SSD)
- 1x Redis server (2 CPU, 4GB RAM)
- Load balancer (Nginx/HAProxy)

### 9. API (Current)

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Documents:
- `POST /api/documents` (create; returns id)
- `GET /api/documents` (list for current user)
- `GET /api/documents/:id` (fetch one; owner-only)
- `PUT /api/documents/:id` (update content_jsonb and optional metadata; bumps version)

AI:
- `POST /api/rewrite` (Gemini)

Grammar:
- `POST /api/grammar/check` (LanguageTool proxy)

### 10. Monitoring & Observability

#### Metrics Collection
**Technology**: Prometheus + Grafana

**Key Metrics**:
- API response times (p50, p95, p99)
- WebSocket connection count
- Grammar check latency
- LLM API response times
- Error rates by service
- Document processing throughput

#### Logging
**Technology**: ELK Stack (Elasticsearch, Logstash, Kibana)

**Log Levels**:
- ERROR: System failures, API errors
- WARN: Performance degradation, rate limits
- INFO: User actions, API calls
- DEBUG: Detailed processing steps

### 11. Development Workflow

#### CI/CD Pipeline
```yaml
1. Git push to main
2. Run automated tests
3. Build Docker images
4. Push to registry
5. Deploy to staging
6. Run integration tests
7. Deploy to production (blue-green)
```

#### Testing Strategy
- Unit tests: 80% code coverage minimum
- Integration tests: All API endpoints
- Load testing: 100 concurrent users
- WebSocket testing: Connection stability
- LLM response testing: Quality checks

### 12. Cost Optimization

#### Strategies
1. Cache AI responses aggressively
2. Use local model for simple tasks
3. Batch similar requests to LLMs
4. Implement user quotas by tier
5. Use spot instances for non-critical services
6. Compress stored documents

#### Estimated Costs (20-50 users)
- Infrastructure: $200-400/month
- LLM APIs: $100-300/month (with caching)
- Grammar API: $50/month
- Total: ~$350-750/month

### 13. Future Enhancements

#### Phase 2 Features
- Collaborative editing with CRDTs
- Browser extension API
- Mobile SDK
- Custom training for domain-specific writing
- Plagiarism detection
- Multi-language support expansion

#### Scaling Considerations
- Implement GraphQL for flexible queries
- Add message queue (RabbitMQ/Kafka) for async processing
- Implement micro-frontends for modular UI
- Add edge caching with Cloudflare Workers
- Implement federated learning for personalization

## Local Development Notes

Ports:
- Frontend: 8080
- Backend: 5001
- Postgres (Docker): 5433 (mapped to container 5432)
- LanguageTool: 8010

Make targets:
- `make bootstrap` – install deps
- `make db-up` – start Postgres
- `make db-init` – apply schema
- `make lt-up` – start LanguageTool
- `make dev` – start backend and frontend

## Architecture Decision Records (ADRs)

### ADR-001: WebSocket for Real-time Grammar
**Decision**: Use WebSocket over SSE
**Rationale**: Bi-directional communication needed for instant feedback

### ADR-002: Hybrid LLM Approach
**Decision**: Mix of local and cloud LLMs
**Rationale**: Balance cost, speed, and quality

### ADR-003: Document Storage in MongoDB
**Decision**: MongoDB for document content, PostgreSQL for metadata
**Rationale**: Flexible schema for documents, ACID for critical data

---

*Last Updated: November 2025*
*Version: 1.0.0*