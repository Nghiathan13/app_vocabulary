use std::collections::HashSet;

use rusqlite::{params, Row};
use serde::{Deserialize, Serialize};
use tauri::Manager;

const WORD_SELECT: &str =
    "rowid, word, ipa, type, meaning_vi, definition, example, band, level, wrong_count, last_review, next_review";

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
    #[serde(rename = "hasAudio")]
    pub has_audio: Option<bool>,
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
        .prepare(&format!("SELECT {WORD_SELECT} FROM words ORDER BY word ASC"))
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

    conn.execute(
        "INSERT INTO words (word, ipa, type, meaning_vi, last_review, next_review) \
         VALUES (?1, ?2, ?3, ?4, NULL, date('now', 'localtime', '+1 day'))",
        params![word, ipa, r#type, meaning_vi],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    let mut stmt = conn
        .prepare("SELECT last_review, next_review FROM words WHERE rowid = ?1")
        .map_err(|e| e.to_string())?;

    let (last_review, next_review): (Option<String>, Option<String>) = stmt
        .query_row(params![id], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?;

    Ok(WordWithId {
        id,
        word,
        ipa: Some(ipa),
        r#type: Some(r#type),
        meaning_vi,
        definition: None,
        example: None,
        band: None,
        level: 0,
        wrong_count: 0,
        last_review,
        next_review,
        has_audio: Some(false),
    })
}

pub fn update_word_db(app: &tauri::AppHandle, word: WordWithId) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        "UPDATE words SET word = ?1, ipa = ?2, type = ?3, meaning_vi = ?4, definition = ?5, \
         example = ?6, band = ?7, level = ?8, wrong_count = ?9, last_review = ?10, \
         next_review = ?11 WHERE rowid = ?12",
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

    conn.execute("DELETE FROM words WHERE rowid = ?1", params![id])
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
                "INSERT OR IGNORE INTO words (\
                 word, ipa, type, meaning_vi, last_review, next_review\
                 ) VALUES (\
                 ?1, ?2, ?3, ?4, NULL, date('now', 'localtime', '+1 day')\
                 )",
            )
            .map_err(|e| e.to_string())?;

        for word in draft_words {
            let meaning_vi = word.meaning_vi.unwrap_or_default();
            stmt.execute(params![word.word, word.ipa, word.r#type, meaning_vi])
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
             WHERE next_review <= date('now', 'localtime') \
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
        "UPDATE words SET level = ?1, wrong_count = ?2, last_review = ?3, next_review = ?4 WHERE word = ?5",
        params![level, wrong_count, last_review, next_review, word],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
