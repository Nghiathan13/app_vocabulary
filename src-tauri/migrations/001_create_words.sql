CREATE TABLE IF NOT EXISTS words (
  word TEXT NOT NULL UNIQUE,
  ipa TEXT,
  type TEXT,
  meaning TEXT,
  reps INTEGER DEFAULT 0,
  last_review TEXT,
  next_review TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);