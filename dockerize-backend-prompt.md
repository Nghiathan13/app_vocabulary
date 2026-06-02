PLEASE IMPLEMENT THIS PLAN:

# Dockerize Backend + PostgreSQL Compose

## Summary
Dockerize the NestJS backend in `server/` and update `server/docker-compose.yml` so it can run both PostgreSQL and the backend API. Keep this simple and production-leaning, but do not add cloud deploy yet.

## Current Context
Backend:
- Path: `server/`
- NestJS + Prisma
- Uses npm, not pnpm
- Build command:
```bash
npm run build
```
- Start command:
```bash
npm run start
```
- Prisma schema:
```txt
server/prisma/schema.prisma
```
- Existing compose file:
```txt
server/docker-compose.yml
```
currently only runs PostgreSQL.

Required env:
```txt
DATABASE_URL
JWT_SECRET
PORT
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
AUDIO_STORAGE_DIR
```

Audio storage:
- Backend stores mp3 files in `storage/audio`.
- This folder should be persisted with a Docker volume.
- Do not commit generated audio files.

## Key Changes

### 1. Add `server/Dockerfile`
Use Node 22.

Recommended Dockerfile behavior:
- `FROM node:22-bookworm-slim`
- install needed runtime package `openssl`
- set `WORKDIR /app`
- copy `package*.json`
- run `npm ci`
- copy `prisma/`, `src/`, `tsconfig*.json`
- run `npm run build`
- run `npm prune --omit=dev`
- expose `3000`
- command:
```bash
npm run start
```

Do not run Prisma migrate inside Dockerfile.

### 2. Add `server/.dockerignore`
Ignore:
```txt
node_modules
dist
storage
.env
npm-debug.log
```

### 3. Update `server/docker-compose.yml`
Keep existing `postgres` service.

Add `api` service:
- build from `server/Dockerfile`
- expose port `3000:3000`
- depends on `postgres`
- use DATABASE_URL with Docker service host `postgres`, not localhost:
```txt
postgresql://engvocab:engvocab@postgres:5432/engvocab?schema=public
```
- env:
```txt
DATABASE_URL=postgresql://engvocab:engvocab@postgres:5432/engvocab?schema=public
JWT_SECRET=dev-docker-secret-change-me
PORT=3000
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-}
ELEVENLABS_VOICE_ID=${ELEVENLABS_VOICE_ID:-}
AUDIO_STORAGE_DIR=storage/audio
```
- mount audio storage:
```yaml
volumes:
  - engvocab-audio:/app/storage/audio
```

Add volume:
```yaml
engvocab-audio:
```

### 4. Do Not Change
- Do not change backend business logic.
- Do not add deploy config.
- Do not run migrations automatically on container startup.
- Do not modify frontend.

## Usage After Implementation
From repo root:
```bash
docker compose -f server/docker-compose.yml up --build
```

Run migration manually if needed:
```bash
cd server
DATABASE_URL="postgresql://engvocab:engvocab@localhost:5432/engvocab?schema=public" npm run prisma:migrate
```

Then backend should be available at:
```txt
http://localhost:3000
```

## Test Plan
Run:
```bash
docker compose -f server/docker-compose.yml build
docker compose -f server/docker-compose.yml up
```

Verify:
```bash
curl http://localhost:3000/auth/me
```

Expected:
- `401 Unauthorized` is fine because `/auth/me` requires token.
- The important part is backend container starts and responds.

Also run local backend build:
```bash
cd server
npm run build
```

## Assumptions
- Migrations are still run manually for now.
- Docker Compose is for local/dev and basic deploy readiness.
- Audio files are persisted in Docker volume `engvocab-audio`.
- Real ElevenLabs secrets are supplied by environment, not committed.
