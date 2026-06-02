# Railway Deploy (Backend)

Deploy the NestJS API from `server/` using the existing Dockerfile. This document covers setup only; it does not perform the deploy for you.

## Prerequisites

- GitHub repo connected to Railway
- ElevenLabs API key and voice ID (for TTS)
- A long random `JWT_SECRET` for production

## 1. Create project and database

1. Create a new Railway project.
2. Add a **PostgreSQL** service. Railway injects `DATABASE_URL` into linked services.

## 2. Add backend service

1. Add a service from this GitHub repository.
2. Set **Root Directory** (or build context) to **`server`** so Railway uses [`Dockerfile`](Dockerfile).
3. Railway builds the Docker image and runs `npm run start:prod`.

## 3. Environment variables

Set these on the backend service:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | From PostgreSQL service (reference variable) |
| `JWT_SECRET` | Long random secret; never commit |
| `PORT` | Often `3000`; Railway may set this automatically |
| `CORS_ORIGIN` | Production web app URL, e.g. `https://your-web-domain.com` |
| `ELEVENLABS_API_KEY` | Server TTS |
| `ELEVENLABS_VOICE_ID` | Server TTS voice |
| `AUDIO_STORAGE_DIR` | Use `storage/audio` |
| `TTS_ENABLED` | Set `false` to skip TTS; set `true` only when ElevenLabs keys are valid |

Comma-separated CORS example:

```txt
CORS_ORIGIN=https://your-web-domain.com,http://localhost:5173
```

If `CORS_ORIGIN` is unset, the API allows `http://localhost:1420` and `http://localhost:5173` for local dev.

### TTS toggle

Set `TTS_ENABLED=false` if ElevenLabs is unavailable or you want to disable audio generation temporarily. Vocabulary add/sync still works; no new `audio_assets` rows are created and ElevenLabs is not called.

Set `TTS_ENABLED=true` only when `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are valid.

## 4. Run Prisma migrations (manual, once per schema change)

Do **not** run migrations on every container start in V1. Run deploy migrations as a one-off step.

The production Docker image prunes dev dependencies, so `prisma` CLI is not available inside the running container. Run migrations from your machine (or CI) with dev dependencies installed:

```bash
cd server
DATABASE_URL="<railway-postgres-url>" npm run prisma:migrate:deploy
```

Use the public or internal `DATABASE_URL` from the Railway PostgreSQL service settings.

## 5. Smoke test deployed API

Replace `https://your-api-url` with the Railway public URL.

```bash
curl https://your-api-url/health
# {"status":"ok"}

curl -X POST https://your-api-url/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}'

curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}'

curl https://your-api-url/vocab \
  -H "Authorization: Bearer <access-token>"
```

## 6. Audio storage (MVP limitation)

V1 stores generated MP3 files under `storage/audio` on the container filesystem.

- Fine for MVP and smoke testing.
- **Not ideal for long-term production:** redeploys or multiple instances can lose or split files.
- Later: move audio to object storage (S3, Cloudflare R2, Supabase Storage, etc.) and serve via signed URLs or CDN.

## Local Docker (unchanged)

From repo root:

```bash
docker compose -f server/docker-compose.yml up --build
```

Migrations for local Postgres:

```bash
cd server
DATABASE_URL="postgresql://engvocab:engvocab@localhost:5432/engvocab?schema=public" npm run prisma:migrate
```
