# EngVocab

EngVocab is a vocabulary learning app built around a local-first desktop experience and an online account sync workflow. The desktop app works offline with SQLite, while the web app and account sync use a NestJS API backed by PostgreSQL.

The project is designed as a practical full-stack product: desktop app, web client, REST API, authentication, cloud database, deployment, CI, and local/offline sync behavior.

## Highlights

- Local-first desktop app with offline vocabulary storage.
- Web app with login/register and server-backed vocabulary data.
- Account sync between desktop SQLite and PostgreSQL.
- Spaced repetition review with flashcard and typing modes.
- Searchable vocabulary table with inline editing, save preview, delete, import, and export.
- Home dashboard with learning progress and vocabulary summaries.
- Optional pronunciation audio metadata and backend audio cache support.
- Dark and light theme support.

## Tech Stack

**Client**

- React 19
- TypeScript
- Vite
- React Router
- TanStack React Virtual
- SheetJS for Excel import/export
- Vitest for unit tests

**Desktop**

- Tauri 2
- Rust commands for native integration
- SQLite via Tauri SQL plugin

**Backend**

- NestJS
- Prisma
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Docker and Docker Compose

**Deployment**

- Vercel for web frontend
- Railway for backend and PostgreSQL
- GitHub Actions for frontend, backend, and Tauri Rust checks

## Product Overview

EngVocab supports two usage modes.

**Desktop mode**

The desktop app stores vocabulary locally in SQLite, so users can add, edit, delete, and review words without a network connection. When the user logs in and the backend is available, local pending changes can sync to the account backend.

**Web mode**

The web app requires an account. Vocabulary is read and written directly through the backend API, so data is persisted in PostgreSQL and can be shared with the desktop app through sync.

## System Overview

```txt
Desktop app (Tauri + SQLite)
        |
        | sync when logged in
        v
NestJS REST API  --->  PostgreSQL
        ^
        |
Web app (Vite + React)
```

The desktop app remains usable without an account. The account system is only required for sync and web access.

## Core Features

### Vocabulary Management

- Add words with IPA, type, Vietnamese meaning, definition, example, band, level, and review data.
- Edit words inline in a virtualized table.
- Preview modified fields before saving changes.
- Delete words locally and sync deletes to the backend.
- Import and export vocabulary with Excel files in desktop mode.

### Review

- Review due words based on `next_review`.
- Flashcard mode for quick self-checking.
- Typing mode for active recall.
- Review results update level, wrong count, last review, and next review.

### Account and Sync

- Register and log in with email/password.
- JWT-based API authentication.
- Desktop stores changes locally first.
- Pending local changes sync when the user is logged in and the backend is reachable.
- Web reads and writes directly to PostgreSQL through the API.

### Audio

The codebase includes backend audio asset support and optional TTS generation. Audio generation depends on valid provider credentials and the `TTS_ENABLED` setting. Core vocabulary, review, sync, and account features work without audio.

## Getting Started

### Prerequisites

- Node.js 22
- pnpm
- npm for the backend package
- Docker and Docker Compose for local PostgreSQL
- Rust toolchain and Tauri system dependencies for desktop development

### Install Dependencies

```bash
pnpm install

cd server
npm install
cp .env.example .env
cd ..
```

The default `server/.env.example` is configured for local Docker PostgreSQL.

## Local Development

### Full Local Stack

```bash
pnpm run dev:local
```

This command:

- starts local PostgreSQL through Docker Compose,
- runs Prisma deploy migrations,
- starts the Tauri desktop app,
- starts the desktop Vite server at `http://localhost:1420`,
- starts the web Vite server at `http://localhost:5173`,
- starts the NestJS backend at `http://localhost:3000`.

Open the web app manually at:

```txt
http://localhost:5173
```

### Desktop Against Deployed Backend

```bash
pnpm run dev:desktop:cloud
```

This opens the desktop app and points it at the deployed Railway API.

### Web Against Deployed Backend

```bash
pnpm run dev:web:cloud
```

This starts web mode locally and points it at the deployed Railway API.

## Useful Commands

```bash
pnpm run build          # desktop frontend production build
pnpm run build:web      # web frontend production build
pnpm run test           # frontend unit tests
pnpm run tauri dev      # Tauri desktop dev mode

cd server
npm run build           # backend build
npm run prisma:studio   # inspect local PostgreSQL data
```

## Backend

The backend lives in `server/` and exposes REST endpoints for:

- authentication,
- user session restore,
- vocabulary CRUD,
- vocabulary sync,
- health checks,
- audio file serving when audio assets are available.

For local Docker:

```bash
docker compose -f server/docker-compose.yml up -d postgres

cd server
npm run prisma:migrate:deploy
npm run dev
```

To run both local PostgreSQL and the API as containers:

```bash
docker compose -f server/docker-compose.yml up --build
```

## Deployment

### Backend on Railway

Railway runs the NestJS API from `server/Dockerfile` and uses Railway PostgreSQL.

Required production variables include:

```txt
DATABASE_URL
JWT_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
PORT
CORS_ORIGIN
```

Optional audio variables:

```txt
TTS_ENABLED
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
AUDIO_STORAGE_DIR
```

Run Prisma deploy migrations after schema changes:

```bash
cd server
DATABASE_URL="<railway-postgres-url>" npm run prisma:migrate:deploy
```

### Web on Vercel

Vercel build settings:

```txt
Install command: pnpm install --frozen-lockfile
Build command: pnpm run build:web
Output directory: dist
```

Required Vercel environment variables:

```txt
VITE_APP_MODE=web
VITE_API_BASE_URL=https://your-api-domain
```

The repo includes `vercel.json` rewrites so browser routes such as `/home`, `/vocabulary`, `/review`, and `/login` resolve to the React app.

## CI

GitHub Actions currently checks:

- frontend desktop build,
- frontend web build,
- frontend unit tests,
- Tauri Rust `cargo check`,
- backend build.

## Current Status

EngVocab is in active development. The main product flows are implemented: desktop offline vocabulary, account login/register, web vocabulary, PostgreSQL backend, sync, review, deployment, and CI.

Planned next improvements:

- stronger auth lifecycle and session handling,
- improved sync conflict handling,
- production-grade audio storage,
- more complete review analytics,
- a dedicated web architecture if the web product grows beyond the current shared React app.

## Environment Notes

Do not commit `.env` files or provider secrets. Local examples are provided in `.env.example` and `server/.env.example`.
