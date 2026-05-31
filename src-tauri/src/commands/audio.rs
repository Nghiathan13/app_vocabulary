use crate::services::elevenlabs::{self, AudioDownloadResult, Quota};

#[tauri::command]
pub async fn get_elevenlabs_quota() -> Result<Quota, String> {
    elevenlabs::fetch_quota().await
}

#[tauri::command]
pub async fn download_elevenlabs_audio(
    app: tauri::AppHandle,
    word: String,
) -> Result<AudioDownloadResult, String> {
    elevenlabs::download_audio(&app, word).await
}
