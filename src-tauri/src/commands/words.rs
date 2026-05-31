use crate::db::words::{self, WordImportDraft, WordWithId};

#[tauri::command]
pub async fn get_all_words(app: tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    words::list_words_db(&app)
}

#[tauri::command]
pub async fn insert_new_word(
    app: tauri::AppHandle,
    word: String,
    ipa: String,
    r#type: String,
    meaning_vi: String,
) -> Result<WordWithId, String> {
    words::insert_word_db(&app, word, ipa, r#type, meaning_vi)
}

#[tauri::command]
pub async fn update_word_fields_rust(
    app: tauri::AppHandle,
    word: WordWithId,
) -> Result<(), String> {
    words::update_word_db(&app, word)
}

#[tauri::command]
pub async fn delete_word_by_id_rust(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    words::delete_word_db(&app, id)
}

#[tauri::command]
pub async fn import_words_rust(
    app: tauri::AppHandle,
    draft_words: Vec<WordImportDraft>,
) -> Result<(), String> {
    words::import_words_db(&app, draft_words)
}

#[tauri::command]
pub async fn get_due_review_words(app: tauri::AppHandle) -> Result<Vec<WordWithId>, String> {
    words::list_due_words_db(&app)
}

#[tauri::command]
pub async fn update_word_review_rust(
    app: tauri::AppHandle,
    word: String,
    level: i32,
    wrong_count: i32,
    last_review: String,
    next_review: Option<String>,
) -> Result<(), String> {
    words::update_word_review_db(
        &app,
        word,
        level,
        wrong_count,
        last_review,
        next_review,
    )
}
