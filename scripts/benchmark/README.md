# Vocabulary Table Benchmark (Minimal First Pass)

Dev-only workflow to measure vocabulary table behavior at **1,000 / 5,000 / 10,000** words using:

- Generated `.xlsx` files (`bench-*` prefix)
- Existing Excel import in the app
- Manual DevTools timing
- No app or Rust code changes

Do **not** add performance claims to the root README until results are recorded in a local `results.md`.

## Generate benchmark files

From the repo root (requires `npm install`):

```bash
node scripts/benchmark/generate-xlsx.mjs
```

Generates:

```
scripts/benchmark/output/bench-1000.xlsx
scripts/benchmark/output/bench-5000.xlsx
scripts/benchmark/output/bench-10000.xlsx
```

Single size:

```bash
node scripts/benchmark/generate-xlsx.mjs 10000
```

Each row uses:

- `Word`: `bench-000001` … `bench-010000` (lowercase, unique)
- `IPA`, `Type`, `Meaning`: short placeholder values compatible with the import parser

Generated files and `results.md` are gitignored.

## Safety before importing

Large imports modify your real Tauri SQLite database (`vocabulary.db`).

**Recommended:**

1. Quit the app completely.
2. Back up the app database file from Tauri app data (identifier `com.thanm.engvocab`), **or** use a throwaway dev profile.
3. Prefer benchmarking on an empty or backup database — not your primary vocabulary.

**One benchmark file per tier.** Do not import 1k + 5k + 10k into the same DB unless you intentionally want cumulative counts.

## Disable ElevenLabs sync (no code changes)

Startup audio sync runs once after the first word load and would skew timings for thousands of words without audio.

Before a benchmark session, in DevTools console:

```javascript
localStorage.setItem(
  "elevenlabsAudioSyncRetryAfter",
  String(Date.now() + 365 * 24 * 60 * 60 * 1000)
);
```

This uses the existing key read by `useGlobalWords` — sync is skipped while the timestamp is in the future.

Set this **before** cold-load measurements, or restart the app after setting it.

Verify: no ElevenLabs network activity on startup.

After benchmarking:

```javascript
localStorage.removeItem("elevenlabsAudioSyncRetryAfter");
```

Avoid adding new words on the Home tab during benchmark sessions (per-word TTS still runs there).

## Import benchmark data (manual)

1. `npm run tauri dev`
2. Open the vocabulary tab (`insights`)
3. Click **Import** → select one file, e.g. `scripts/benchmark/output/bench-1000.xlsx`
4. Confirm preview is valid and word count matches
5. Click **Add** and wait for import to finish

Import duration is a separate metric from table render time. The import path sets `reps = 0` for all rows.

## Measure (manual)

Copy [`results-template.md`](results-template.md) to `results.md` and record **median of 3–5 runs** per dataset size.

Suggested metrics:

| Metric | How |
|--------|-----|
| Import duration | Wall clock: Add → modal close / table refresh |
| Cold load | App launch → loading spinner gone |
| Table visible | Vocabulary tab → grid rows painted |
| DOM row count | Inspect `.word-grid-row` (~20–25 visible, not N) |
| Scroll | Wheel top → bottom → top; note jank in Performance panel |
| Search | Type `ben`; note lag after 100ms debounce |
| Sort by Word | Click Word column header; note resort time |
| Sort by Type | Prefer over Reps — imported rows all have `reps = 0`; Meaning is not sortable in the UI |
| Memory (approx) | DevTools Memory snapshot after load |

For cold-load runs: import → quit app fully → set sync deferral if needed → relaunch → measure.

## Cleanup

First pass has no bulk delete command.

**Recommended:** restore the backed-up `vocabulary.db`.

Alternatives:

- Delete the app data directory for a throwaway profile
- Advanced: `DELETE FROM words WHERE word LIKE 'bench-%'` with an external SQLite tool on a **copy** of the database

Always remove the audio sync deferral key when done.

Delete generated `.xlsx` files from `output/` if desired.

## Limitations

- Import of 10k rows can take a long time (sequential inserts in one transaction)
- Measurements include full stack: SQLite fetch, audio dir scan, Table sort, virtualized grid
- All timings are manual and machine-dependent
- Cannot isolate TanStack Virtual alone without future dev-only tooling

## Future Step 2 (optional)

Consider debug-only seed/clear Tauri commands if:

- 10k Excel import is too slow for repeated runs
- DB restore cleanup is too cumbersome
- You need fetch vs render breakdown with dev instrumentation
