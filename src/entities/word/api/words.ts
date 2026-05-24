import Database from "@tauri-apps/plugin-sql";

import { WordImportDraft, WordWithId } from "../model/types";
import { getLocalDateString } from "../../../shared/lib/utils";

interface InsertWordParams {
  word: string;
  ipa: string;
  type: string;
  meaning: string;
}

export async function insertWord({
  word,
  ipa,
  type,
  meaning,
}: InsertWordParams): Promise<WordWithId> {
  const db = await Database.load("sqlite:vocabulary.db");

  await db.execute(
    `INSERT INTO words (word, ipa, type, meaning, reps, last_review, next_review) 
     VALUES ($1, $2, $3, $4, 0, NULL, date('now', 'localtime', '+1 day'))`,
    [word, ipa, type, meaning],
  );

  const [{ id }] = await db.select<{ id: number }[]>(
    "SELECT last_insert_rowid() as id",
  );

  return {
    id,
    word,
    ipa,
    type,
    meaning,
    reps: 0,
    last_review: null,
    next_review: getLocalDateString(1),
    hasAudio: false,
  };
}

export async function listWords(): Promise<WordWithId[]> {
  const db = await Database.load("sqlite:vocabulary.db");
  return db.select<WordWithId[]>(
    "SELECT rowid as id, * FROM words ORDER BY word ASC",
  );
}

export async function listDueReviewWords(): Promise<WordWithId[]> {
  const db = await Database.load("sqlite:vocabulary.db");
  return db.select<WordWithId[]>(
    `SELECT rowid as id, * FROM words 
     WHERE next_review <= date('now', 'localtime')
     ORDER BY next_review ASC`,
  );
}

export interface UpdateWordReviewParams {
  word: string;
  reps: number;
  lastReview: string;
  nextReview: string | null;
}

export async function updateWordReview({
  word,
  reps,
  lastReview,
  nextReview,
}: UpdateWordReviewParams): Promise<void> {
  const db = await Database.load("sqlite:vocabulary.db");
  await db.execute(
    `UPDATE words
     SET reps = $1,
         last_review = $2,
         next_review = $3
     WHERE word = $4`,
    [reps, lastReview, nextReview, word],
  );
}

export async function updateWordFields(word: WordWithId): Promise<void> {
  const db = await Database.load("sqlite:vocabulary.db");
  await db.execute(
    "UPDATE words SET word = $1, ipa = $2, type = $3, meaning = $4, reps = $5, last_review = $6, next_review = $7 WHERE rowid = $8",
    [
      word.word,
      word.ipa,
      word.type,
      word.meaning,
      word.reps,
      word.last_review,
      word.next_review,
      word.id,
    ],
  );
}

export async function deleteWordById(id: number): Promise<void> {
  const db = await Database.load("sqlite:vocabulary.db");
  await db.execute("DELETE FROM words WHERE rowid = $1", [id]);
}

export async function importWords(draftWords: WordImportDraft[]): Promise<void> {
  const db = await Database.load("sqlite:vocabulary.db");
  let hasTransaction = false;

  try {
    await db.execute("BEGIN TRANSACTION");
    hasTransaction = true;

    for (const word of draftWords) {
      await db.execute(
        `INSERT OR IGNORE INTO words (
          word,
          ipa,
          type,
          meaning,
          reps,
          last_review,
          next_review
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          0,
          NULL,
          date('now', 'localtime', '+1 day')
        )`,
        [word.word, word.ipa, word.type, word.meaning],
      );
    }

    await db.execute("COMMIT");
  } catch (error) {
    if (hasTransaction) {
      try {
        await db.execute("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
    throw error;
  }
}
