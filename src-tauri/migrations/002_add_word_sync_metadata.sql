ALTER TABLE words ADD COLUMN sync_id TEXT;
ALTER TABLE words ADD COLUMN sync_status TEXT DEFAULT 'pending_create';
ALTER TABLE words ADD COLUMN updated_at TEXT;
ALTER TABLE words ADD COLUMN deleted_at TEXT;
ALTER TABLE words ADD COLUMN last_synced_at TEXT;

UPDATE words
SET
  sync_id = lower(hex(randomblob(16))),
  sync_status = 'pending_create',
  updated_at = COALESCE(created_at, datetime('now'))
WHERE sync_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_words_sync_id ON words(sync_id);
CREATE INDEX IF NOT EXISTS idx_words_sync_status ON words(sync_status);
CREATE INDEX IF NOT EXISTS idx_words_deleted_at ON words(deleted_at);
