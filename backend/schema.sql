-- Simple PostgreSQL schema for Writerly
-- Safe to run multiple times (IF NOT EXISTS everywhere)

-- Extensions (used for UUID defaults)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  settings jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- enforce case-insensitive unique email using a functional unique index
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (lower(email));

-- documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_jsonb jsonb NOT NULL,
  metadata jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- helpful indexes for common queries
CREATE INDEX IF NOT EXISTS documents_user_updated_idx
  ON documents (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_id_idx
  ON documents (user_id, id);
CREATE INDEX IF NOT EXISTS documents_content_jsonb_gin
  ON documents USING gin (content_jsonb jsonb_path_ops);

-- voice_profiles
CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tone text,
  formality text,
  profession text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS voice_profiles_uniq
  ON voice_profiles (user_id, coalesce(tone, ''), coalesce(formality, ''), coalesce(profession, ''));

-- grammar_corrections
CREATE TABLE IF NOT EXISTS grammar_corrections (
  id bigserial PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  suggestions jsonb NOT NULL,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grammar_corrections_doc_idx
  ON grammar_corrections (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS grammar_corrections_applied_idx
  ON grammar_corrections (applied_at);

-- prompt_history
CREATE TABLE IF NOT EXISTS prompt_history (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  prompts jsonb NOT NULL,
  responses jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prompt_history_user_doc_idx
  ON prompt_history (user_id, document_id, created_at DESC);


