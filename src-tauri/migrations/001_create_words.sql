CREATE TABLE IF NOT EXISTS words (
  word TEXT NOT NULL UNIQUE,
  ipa TEXT,
  type TEXT,
  meaning_vi TEXT NOT NULL,
  definition TEXT,
  example TEXT,
  band TEXT,
  level INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  last_review TEXT,
  next_review TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
