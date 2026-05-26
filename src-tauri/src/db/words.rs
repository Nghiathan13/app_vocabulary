use std::collections::HashSet;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WordWithId {
    pub id: i64,
    pub word: String,
    pub ipa: Option<String>,
    pub r#type: Option<String>,
    pub meaning: Option<String>,
    pub reps: i32,
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
    pub meaning: Option<String>,
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

pub fn list_words_db(app: &tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    let conn = super::get_db_conn(app)?;

    let mut stmt = conn
        .prepare("SELECT rowid, word, ipa, type, meaning, reps, last_review, next_review FROM words ORDER BY word ASC")
        .map_err(|e| e.to_string())?;

    let audio_files = get_audio_files(app);

    let word_iter = stmt
        .query_map([], |row| {
            let id: i64 = row.get(0)?;
            let word: String = row.get(1)?;
            let ipa: Option<String> = row.get(2)?;
            let r#type: Option<String> = row.get(3)?;
            let meaning: Option<String> = row.get(4)?;
            let reps: i32 = row.get(5)?;
            let last_review: Option<String> = row.get(6)?;
            let next_review: Option<String> = row.get(7)?;

            let expected_file_name = crate::get_audio_file_name(&word).to_lowercase();
            let has_audio = audio_files.contains(&expected_file_name);

            Ok(WordWithId {
                id,
                word,
                ipa,
                r#type,
                meaning,
                reps,
                last_review,
                next_review,
                has_audio: Some(has_audio),
            })
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
    meaning: String,
) -> Result<WordWithId, String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        "INSERT INTO words (word, ipa, type, meaning, reps, last_review, next_review) \
         VALUES (?1, ?2, ?3, ?4, 0, NULL, date('now', 'localtime', '+1 day'))",
        params![word, ipa, r#type, meaning],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // Lấy lại các trường thời gian mặc định vừa được tạo từ SQLite
    let mut stmt = conn
        .prepare("SELECT last_review, next_review FROM words WHERE rowid = ?1")
        .map_err(|e| e.to_string())?;

    let (last_review, next_review): (Option<String>, Option<String>) = stmt
        .query_row(params![id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .map_err(|e| e.to_string())?;

    Ok(WordWithId {
        id,
        word,
        ipa: Some(ipa),
        r#type: Some(r#type),
        meaning: Some(meaning),
        reps: 0,
        last_review,
        next_review,
        has_audio: Some(false),
    })
}

pub fn update_word_db(app: &tauri::AppHandle, word: WordWithId) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        "UPDATE words SET word = ?1, ipa = ?2, type = ?3, meaning = ?4, reps = ?5, last_review = ?6, next_review = ?7 WHERE rowid = ?8",
        params![
            word.word,
            word.ipa,
            word.r#type,
            word.meaning,
            word.reps,
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
                 word, ipa, type, meaning, reps, last_review, next_review\
                 ) VALUES (\
                 ?1, ?2, ?3, ?4, 0, NULL, date('now', 'localtime', '+1 day')\
                 )",
            )
            .map_err(|e| e.to_string())?;

        for word in draft_words {
            stmt.execute(params![word.word, word.ipa, word.r#type, word.meaning])
                .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn list_due_words_db(app: &tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    let conn = super::get_db_conn(app)?;

    let mut stmt = conn
        .prepare(
            "SELECT rowid, word, ipa, type, meaning, reps, last_review, next_review \
             FROM words \
             WHERE next_review <= date('now', 'localtime') \
             ORDER BY next_review ASC",
        )
        .map_err(|e| e.to_string())?;

    let audio_files = get_audio_files(app);

    let word_iter = stmt
        .query_map([], |row| {
            let id: i64 = row.get(0)?;
            let word: String = row.get(1)?;
            let ipa: Option<String> = row.get(2)?;
            let r#type: Option<String> = row.get(3)?;
            let meaning: Option<String> = row.get(4)?;
            let reps: i32 = row.get(5)?;
            let last_review: Option<String> = row.get(6)?;
            let next_review: Option<String> = row.get(7)?;

            let expected_file_name = crate::get_audio_file_name(&word).to_lowercase();
            let has_audio = audio_files.contains(&expected_file_name);

            Ok(WordWithId {
                id,
                word,
                ipa,
                r#type,
                meaning,
                reps,
                last_review,
                next_review,
                has_audio: Some(has_audio),
            })
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
    reps: i32,
    last_review: String,
    next_review: Option<String>,
) -> Result<(), String> {
    let conn = super::get_db_conn(app)?;

    conn.execute(
        "UPDATE words SET reps = ?1, last_review = ?2, next_review = ?3 WHERE word = ?4",
        params![reps, last_review, next_review, word],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
