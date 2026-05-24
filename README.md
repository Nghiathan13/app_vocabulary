# engvocab

A desktop English vocabulary app built with Tauri 2 and React. Words are stored locally in SQLite. Review uses spaced repetition with flashcard and typing modes. Vocabulary can be managed in a searchable table with Excel import/export, and pronunciation audio can be synced via ElevenLabs TTS.

## Features

- **Add vocabulary** — enter word, IPA, type, and meaning; optional TTS download on save
- **Spaced repetition review** — due words based on `next_review`; custom interval schedule on pass/fail
- **Typing review mode** — flashcard or typing mode; typing answers checked against the target word
- **Local SQLite storage** — vocabulary persisted on device via Tauri SQL plugin
- **Vocabulary table** — virtualized table with search, inline edit, save, and delete
- **Excel import/export** — bulk import from `.xlsx` files; export current vocabulary
- **ElevenLabs TTS audio** — download pronunciation MP3s; background sync for missing audio on startup (optional; see Environment variables)
- **Basic chart** — bar chart of word counts grouped by repetition level (`reps`)

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 7
- **Desktop:** Tauri 2 (Rust)
- **Database:** SQLite via `@tauri-apps/plugin-sql`
- **UI / libraries:** Recharts, TanStack React Virtual, SheetJS (`xlsx`)
- **Testing:** Vitest (pure logic in feature `lib/` modules)
- **HTTP (Rust):** reqwest (ElevenLabs API)

Requires Node.js, npm, and a Rust toolchain with Tauri 2 system dependencies.

## Architecture

```
src/
├── app/              App shell, tab routing, useGlobalWords hook
├── features/         Feature pages and UI
│   ├── add-word/
│   ├── review/
│   ├── vocabulary/   Table, chart, import/export
│   └── practice/     Placeholder
├── entities/word/    Domain types + SQLite repository (words.ts)
├── shared/           Navbar, Toast, audio API, utils, tab model
└── main.tsx

src-tauri/            Rust backend, migrations, file/audio commands
```

Features and the app shell call `entities/word/api/words.ts` for SQLite access. Tauri commands handle filesystem operations and ElevenLabs requests.

**Word repository** (`entities/word/api/words.ts`):

- `insertWord` — add a single word
- `listWords` — all words, ordered by word
- `listDueReviewWords` — words due for review
- `updateWordReview` — update reps and review dates after a session
- `updateWordFields` — full row update from the vocabulary table
- `deleteWordById` — delete by row id
- `importWords` — transactional bulk import (`INSERT OR IGNORE`)

Dependency direction: `features` → `entities` / `shared`; `entities` does not import from `features`.

## Data model

SQLite table `words` (see `src-tauri/migrations/001_create_words.sql`):

| Column        | Type    | Notes                          |
|---------------|---------|--------------------------------|
| `word`        | TEXT    | NOT NULL, UNIQUE               |
| `ipa`         | TEXT    | Optional                       |
| `type`        | TEXT    | Optional (e.g. noun, verb)     |
| `meaning`     | TEXT    | Optional                       |
| `reps`        | INTEGER | Default 0; spaced rep count    |
| `last_review` | TEXT    | Date string                    |
| `next_review` | TEXT    | Due date for review queue      |
| `created_at`  | DATETIME| Auto timestamp                 |

The app reads SQLite `rowid` as `id` in queries. `created_at` is not shown in the UI today.

Migrations run automatically through the Tauri SQL plugin (`sqlite:vocabulary.db` in `tauri.conf.json`).

## Release

Installable Linux packages are available on the GitHub Releases page.

Current release: `v0.1.0`

Available packages:
- `.deb` for Debian/Ubuntu-based systems
- `.rpm` for RPM-based systems

AppImage is not included in the first release because AppImage bundling failed during `linuxdeploy`.

## Development

```bash
npm install
npm run tauri dev    # desktop app (Vite + Tauri)
npm run dev          # frontend only (http://localhost:1420)
npm run build        # production frontend build
npm run test         # Vitest unit tests
npm run tauri build  # production desktop bundle
```

## Environment variables

Create a `.env` file at the repo root (not committed; see `.gitignore`):

```bash
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=your_voice_id
```

ElevenLabs TTS is **optional**. Core vocabulary and review features work without it. When keys are missing or invalid, audio download and sync commands fail and the app logs warnings; word CRUD and review continue to work.

Rust loads these via `dotenvy` in `src-tauri/src/lib.rs`.

## Verification

```bash
npm run test
npm run build
```

Current test coverage: **22 tests** for spaced repetition logic, typing answer comparison, and table search — no repository or end-to-end tests yet.

## Known limitations

- **Practice tab** — placeholder UI only; no practice content yet
- **No repository integration tests** — SQLite access is not covered by unit tests
- **Large production bundle** — Vite reports a JS chunk over 500 kB; no code-splitting yet
- **Tab id naming** — the vocabulary UI uses internal tab id `insights` while the feature folder is `vocabulary`
- **Review page data** — fetches its own due-word list separately from `useGlobalWords` in the app shell
