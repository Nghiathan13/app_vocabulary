use std::collections::HashSet;

use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use tauri::Manager;

const WORD_SELECT: &str =
    "rowid, word, ipa, type, meaning_vi, definition, example, band, level, wrong_count, \
     last_review, next_review, sync_id, sync_status, updated_at, deleted_at, last_synced_at";
const SYNC_NOW_SQL: &str = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WordWithId {
    pub id: i64,
    pub word: String,
    pub ipa: Option<String>,
    pub r#type: Option<String>,
    pub meaning_vi: String,
    pub definition: Option<String>,
    pub example: Option<String>,
    pub band: Option<String>,
    pub level: i32,
    pub wrong_count: i32,
    pub last_review: Option<String>,
    pub next_review: Option<String>,
    #[serde(default)]
    pub sync_id: Option<String>,
    #[serde(default)]
    pub sync_status: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub deleted_at: Option<String>,
    #[serde(default)]
    pub last_synced_at: Option<String>,
    #[serde(rename = "hasAudio")]
    pub has_audio: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct RemoteSyncWord {
    pub sync_id: String,
    pub word: String,
    pub ipa: Option<String>,
    pub r#type: Option<String>,
    pub meaning_vi: String,
    pub definition: Option<String>,
    pub example: Option<String>,
    pub band: Option<String>,
    pub level: i32,
    pub wrong_count: i32,
    pub last_review: Option<String>,
    pub next_review: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SyncMergeId {
    pub local_id: String,
    pub server_id: String,
}

#[derive(Debug, Deserialize)]
pub struct WordImportDraft {
    pub word: String,
    pub ipa: Option<String>,
    pub r#type: Option<String>,
    pub meaning_vi: Option<String>,
}

fn get_audio_files(app: &tauri::AppHandle) -> HashSet<String> {
    let mut audio_files = HashSet::new();
    if let Ok(config_dir) = app.path().app_config_dir() {
        let audio_dir = config_dir.join("audio");
        if let Ok(entries) = std::fs::read_dir(audio_dir) {
            for entry in entries.flatten() {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_file() {
                        let name = entry.file_name().to_string_lossy().to_lowercase();
                        audio_files.insert(name);
                    }
                }
            }
        }
    }
    audio_files
}

fn map_word_row(row: &Row<'_>, has_audio: bool) -> rusqlite::Result<WordWithId> {
    let word: String = row.get(1)?;
    Ok(WordWithId {
        id: row.get(0)?,
        word,
        ipa: row.get(2)?,
        r#type: row.get(3)?,
        meaning_vi: row.get(4)?,
        definition: row.get(5)?,
        example: row.get(6)?,
        band: row.get(7)?,
        level: row.get(8)?,
        wrong_count: row.get(9)?,
        last_review: row.get(10)?,
        next_review: row.get(11)?,
        sync_id: row.get(12)?,
        sync_status: row.get(13)?,
        updated_at: row.get(14)?,
        deleted_at: row.get(15)?,
        last_synced_at: row.get(16)?,
        has_audio: Some(has_audio),
    })
}

fn has_audio_for_word(audio_files: &HashSet<String>, word: &str) -> bool {
    let expected_file_name = crate::services::elevenlabs::get_audio_file_name(word).to_lowercase();
    audio_files.contains(&expected_file_name)
}

pub fn list_words_db(app: &tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    let conn = super::get_db_conn(app)?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {WORD_SELECT} FROM words WHERE deleted_at IS NULL ORDER BY word ASC"
        ))
        .map_err(|e| e.to_string())?;

    let audio_files = get_audio_files(app);

    let word_iter = stmt
        .query_map([], |row| {
            let word: String = row.get(1)?;
            let has_audio = has_audio_for_word(&audio_files, &word);
            map_word_row(row, has_audio)
        })
        .map_err(|e| e.to_string())?;

    let mut words = Vec::new();
    for word in word_iter {
        words.push(word.map_err(|e| e.to_string())?);
    }

    Ok(words)
}

pub fn insert_word_db(
    app: &tauri::AppHandle,
    word: String,
    ipa: String,
    r#type: String,
    meaning_vi: String,
) -> Result<WordWithId, String> {
    let conn = super::get_db_conn(app)?;

    let existing_word = conn
        .query_row(
            "SELECT rowid, deleted_at FROM words WHERE word = ?1",
            params![&word],
            |row| Ok((row.get::<_, i64>(0)?, row.get::<_, Option<String>>(1)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some((id, deleted_at)) = existing_word {
        if deleted_at.is_none() {
            return Err("Word already exists".to_string());
        }

        conn.execute(
            &format!(
                "UPDATE words SET word = ?1, ipa = ?2, type = ?3, meaning_vi = ?4, definition = NULL, \
                 example = NULL, band = NULL, level = 0, wrong_count = 0, last_review = NULL, \
                 next_review = date('now', 'localtime', '+1 day'), updated_at = {SYNC_NOW_SQL}, deleted_at = NULL, \
                 sync_status = CASE WHEN sync_status = 'pending_create' THEN 'pending_create' ELSE 'pending_update' END \
                 WHERE rowid = ?5"
            ),
            params![&word, &ipa, &r#type, &meaning_vi, id],
        )
        .map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(&format!("SELECT {WORD_SELECT} FROM words WHERE rowid = ?1"))
            .map_err(|e| e.to_string())?;

        return stmt
            .query_row(params![id], |row| map_word_row(row, false))
            .map_err(|e| e.to_string());
    }

    conn.execute(
        &format!(
            "INSERT INTO words (\
         word, ipa, type, meaning_vi, last_review, next_review, sync_id, sync_status, updated_at\
         ) VALUES (\
         ?1, ?2, ?3, ?4, NULL, date('now', 'localtime', '+1 day'), lower(hex(randomblob(16))), \
         'pending_create', {SYNC_NOW_SQL}\
         )"
        ),
        params![&word, &ipa, &r#type, &meaning_vi],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let mut stmt = conn
        .prepare(&format!("SELECT {WORD_SELECT} FROM words WHERE rowid = ?1"))
        .map_err(|e| e.to_string())?;

    stmt.query_row(params![id], |row| map_word_row(row, false))
        .map_err(|e| e.to_string())
}

pub fn update_word_db(app: &tauri::AppHandle, word: WordWithId) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        &format!("UPDATE words SET word = ?1, ipa = ?2, type = ?3, meaning_vi = ?4, definition = ?5, \
         example = ?6, band = ?7, level = ?8, wrong_count = ?9, last_review = ?10, \
         next_review = ?11, updated_at = {SYNC_NOW_SQL}, deleted_at = NULL, \
         sync_status = CASE WHEN sync_status = 'pending_create' THEN 'pending_create' ELSE 'pending_update' END \
         WHERE rowid = ?12"),
        params![
            word.word,
            word.ipa,
            word.r#type,
            word.meaning_vi,
            word.definition,
            word.example,
            word.band,
            word.level,
            word.wrong_count,
            word.last_review,
            word.next_review,
            word.id
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn delete_word_db(app: &tauri::AppHandle, id: i64) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        &format!(
            "UPDATE words SET deleted_at = {SYNC_NOW_SQL}, updated_at = {SYNC_NOW_SQL}, \
         sync_status = 'pending_delete' WHERE rowid = ?1"
        ),
        params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn import_words_db(
    app: &tauri::AppHandle,
    draft_words: Vec<WordImportDraft>,
) -> Result<(), String> {
    let mut conn = super::get_db_conn(app)?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                &format!("INSERT OR IGNORE INTO words (\
                 word, ipa, type, meaning_vi, last_review, next_review, sync_id, sync_status, updated_at\
                 ) VALUES (\
                 ?1, ?2, ?3, ?4, NULL, date('now', 'localtime', '+1 day'), lower(hex(randomblob(16))), \
                 'pending_create', {SYNC_NOW_SQL}\
                 )"),
            )
            .map_err(|e| e.to_string())?;

        for word in &draft_words {
            let meaning_vi = word.meaning_vi.clone().unwrap_or_default();
            stmt.execute(params![&word.word, &word.ipa, &word.r#type, meaning_vi])
                .map_err(|e| e.to_string())?;
        }
    }

    {
        let mut stmt = tx
            .prepare(&format!(
                "UPDATE words SET ipa = ?2, type = ?3, meaning_vi = ?4, definition = NULL, \
                 example = NULL, band = NULL, level = 0, wrong_count = 0, last_review = NULL, \
                 next_review = date('now', 'localtime', '+1 day'), updated_at = {SYNC_NOW_SQL}, deleted_at = NULL, \
                 sync_status = CASE WHEN sync_status = 'pending_create' THEN 'pending_create' ELSE 'pending_update' END \
                 WHERE word = ?1 AND deleted_at IS NOT NULL"
            ))
            .map_err(|e| e.to_string())?;

        for word in &draft_words {
            let meaning_vi = word.meaning_vi.clone().unwrap_or_default();
            stmt.execute(params![&word.word, &word.ipa, &word.r#type, meaning_vi])
                .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn list_due_words_db(app: &tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    let conn = super::get_db_conn(app)?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {WORD_SELECT} FROM words \
             WHERE deleted_at IS NULL AND next_review <= date('now', 'localtime') \
             ORDER BY next_review ASC"
        ))
        .map_err(|e| e.to_string())?;

    let audio_files = get_audio_files(app);

    let word_iter = stmt
        .query_map([], |row| {
            let word: String = row.get(1)?;
            let has_audio = has_audio_for_word(&audio_files, &word);
            map_word_row(row, has_audio)
        })
        .map_err(|e| e.to_string())?;

    let mut words = Vec::new();
    for word in word_iter {
        words.push(word.map_err(|e| e.to_string())?);
    }

    Ok(words)
}

pub fn update_word_review_db(
    app: &tauri::AppHandle,
    word: String,
    level: i32,
    wrong_count: i32,
    last_review: String,
    next_review: Option<String>,
) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        &format!("UPDATE words SET level = ?1, wrong_count = ?2, last_review = ?3, next_review = ?4, \
         updated_at = {SYNC_NOW_SQL}, \
         sync_status = CASE WHEN sync_status = 'pending_create' THEN 'pending_create' ELSE 'pending_update' END \
         WHERE word = ?5 AND deleted_at IS NULL"),
        params![level, wrong_count, last_review, next_review, word],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn list_word_sync_changes_db(app: &tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    let conn = super::get_db_conn(app)?;

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {WORD_SELECT} FROM words \
             WHERE sync_status IS NULL OR sync_status != 'synced' \
             ORDER BY updated_at ASC"
        ))
        .map_err(|e| e.to_string())?;

    let word_iter = stmt
        .query_map([], |row| map_word_row(row, false))
        .map_err(|e| e.to_string())?;

    let mut words = Vec::new();
    for word in word_iter {
        words.push(word.map_err(|e| e.to_string())?);
    }

    Ok(words)
}

pub fn apply_word_sync_result_db(
    app: &tauri::AppHandle,
    remote_words: Vec<RemoteSyncWord>,
    deleted_sync_ids: Vec<String>,
    merged_ids: Vec<SyncMergeId>,
    synced_at: String,
) -> Result<(), String> {
    let mut conn = super::get_db_conn(app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for merge in merged_ids {
        tx.execute(
            "UPDATE words SET sync_id = ?1 WHERE sync_id = ?2",
            params![merge.server_id, merge.local_id],
        )
        .map_err(|e| e.to_string())?;
    }

    for word in remote_words {
        tx.execute(
            "UPDATE words SET word = ?1, ipa = ?2, type = ?3, meaning_vi = ?4, definition = ?5, \
             example = ?6, band = ?7, level = ?8, wrong_count = ?9, last_review = ?10, \
             next_review = ?11, updated_at = ?12, deleted_at = NULL, sync_status = 'synced', \
             last_synced_at = ?13 WHERE sync_id = ?14",
            params![
                word.word,
                word.ipa,
                word.r#type,
                word.meaning_vi,
                word.definition,
                word.example,
                word.band,
                word.level,
                word.wrong_count,
                word.last_review,
                word.next_review,
                word.updated_at,
                synced_at,
                word.sync_id
            ],
        )
        .map_err(|e| e.to_string())?;

        if tx.changes() > 0 {
            continue;
        }

        tx.execute(
            "INSERT INTO words (\
             word, ipa, type, meaning_vi, definition, example, band, level, wrong_count, \
             last_review, next_review, created_at, sync_id, sync_status, updated_at, deleted_at, last_synced_at\
             ) VALUES (\
             ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, COALESCE(?12, datetime('now')), \
             ?13, 'synced', ?14, NULL, ?15\
             ) ON CONFLICT(word) DO UPDATE SET \
             sync_id = excluded.sync_id, ipa = excluded.ipa, type = excluded.type, \
             meaning_vi = excluded.meaning_vi, definition = excluded.definition, example = excluded.example, \
             band = excluded.band, level = excluded.level, wrong_count = excluded.wrong_count, \
             last_review = excluded.last_review, next_review = excluded.next_review, updated_at = excluded.updated_at, \
             deleted_at = NULL, sync_status = 'synced', last_synced_at = excluded.last_synced_at",
            params![
                word.word,
                word.ipa,
                word.r#type,
                word.meaning_vi,
                word.definition,
                word.example,
                word.band,
                word.level,
                word.wrong_count,
                word.last_review,
                word.next_review,
                word.created_at,
                word.sync_id,
                word.updated_at,
                synced_at
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for sync_id in deleted_sync_ids {
        tx.execute(
            "UPDATE words SET deleted_at = COALESCE(deleted_at, datetime('now')), \
             sync_status = 'synced', last_synced_at = ?1 WHERE sync_id = ?2",
            params![synced_at, sync_id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}
