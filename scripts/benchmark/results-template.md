# Vocabulary Table Benchmark Results

Copy this file to `results.md` (gitignored) and fill in measured values only.

## Session metadata

| Field | Value |
|-------|-------|
| Date | |
| Git commit | |
| OS | |
| Build | `npm run tauri dev` |
| Window size | 1000 x 750 (default) |
| Dataset | bench-1000 / bench-5000 / bench-10000 |
| Existing non-bench words | 0 recommended |
| Audio sync deferred | yes / no |

## Dataset: bench-1000

Run each metric 3–5 times; record median.

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Median | Notes |
|--------|-------|-------|-------|-------|-------|--------|-------|
| Import duration (s) | | | | | | | Add click → modal close / refresh |
| Cold load (s) | | | | | | | Launch → loading spinner gone |
| Table visible (s) | | | | | | | Vocabulary tab → grid rows painted |
| DOM `.word-grid-row` count | | | | | | | Expect ~20–25 visible |
| Scroll (top→bottom→top) | | | | | | | smooth / minor jank / major jank |
| Search `ben` (ms) | | | | | | | After 100ms debounce |
| Sort by Word toggle (ms) | | | | | | | Click Word header |
| Sort by Type toggle (ms) | | | | | | | Prefer over Reps — imported rows all have `reps = 0` |
| JS heap approx (MB) | | | | | | | Memory snapshot after load |

## Dataset: bench-5000

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Median | Notes |
|--------|-------|-------|-------|-------|-------|--------|-------|
| Import duration (s) | | | | | | | |
| Cold load (s) | | | | | | | |
| Table visible (s) | | | | | | | |
| DOM `.word-grid-row` count | | | | | | | |
| Scroll (top→bottom→top) | | | | | | | |
| Search `ben` (ms) | | | | | | | |
| Sort by Word toggle (ms) | | | | | | | |
| Sort by Type toggle (ms) | | | | | | | |
| JS heap approx (MB) | | | | | | | |

## Dataset: bench-10000

| Metric | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Median | Notes |
|--------|-------|-------|-------|-------|-------|--------|-------|
| Import duration (s) | | | | | | | |
| Cold load (s) | | | | | | | |
| Table visible (s) | | | | | | | |
| DOM `.word-grid-row` count | | | | | | | |
| Scroll (top→bottom→top) | | | | | | | |
| Search `ben` (ms) | | | | | | | |
| Sort by Word toggle (ms) | | | | | | | |
| Sort by Type toggle (ms) | | | | | | | |
| JS heap approx (MB) | | | | | | | |

## Observations

- Import path sets `reps = 0` for all imported rows; prefer Word/Type sort tests over Reps for this dataset.
- Do not publish numbers in the root README until this matrix is complete.
