.PHONY: bootstrap db-up db-down db-init lt-up dev

bootstrap:
	@echo "Installing dependencies..."
	cd backend && npm i
	cd writerly && npm i

db-up:
	@echo "Starting Postgres (Docker)..."
	docker compose up -d db

db-down:
	@echo "Stopping Postgres..."
	docker compose down

db-init:
	@echo "Applying database schema..."
	cd backend && DATABASE_URL=postgres://postgres:postgres@localhost:5433/writerly node db/init.js

lt-up:
	@echo "Starting LanguageTool (Docker)..."
	docker compose up -d languagetool

dev:
	@echo "Starting backend and frontend..."
	cd backend && PORT=5001 node server.js & \
	cd writerly && npm run dev & \
	wait

ai-up:
	@echo "Starting Ollama (Docker)..."
	docker compose up -d ollama

ai-pull:
	@echo "Pulling default local model (llama3.2:3b) into Ollama..."
	docker exec -it writerly-ollama ollama pull llama3.2:3b


