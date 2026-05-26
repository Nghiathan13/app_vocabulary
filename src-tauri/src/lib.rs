use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

mod window;

const ELEVENLABS_TTS_MODEL: &str = "eleven_multilingual_v2";
const ELEVENLABS_OUTPUT_FORMAT: &str = "mp3_44100_128";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ElevenLabsQuota {
    character_count: i64,
    character_limit: i64,
    next_character_count_reset_unix: Option<i64>,
    status: Option<String>,
}

#[derive(Deserialize)]
struct ElevenLabsQuotaResponse {
    character_count: i64,
    character_limit: i64,
    next_character_count_reset_unix: Option<i64>,
    status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AudioDownloadResult {
    status: String,
    file_name: String,
    message: Option<String>,
}

#[derive(Serialize)]
struct TextToSpeechRequest<'a> {
    text: &'a str,
    model_id: &'static str,
}

struct ElevenLabsConfig {
    api_key: String,
    voice_id: String,
}

fn load_elevenlabs_config() -> Result<ElevenLabsConfig, String> {
    let _ = dotenvy::dotenv();
    let _ = dotenvy::from_filename("../.env");

    let api_key = std::env::var("ELEVENLABS_API_KEY")
        .map_err(|_| "Missing ELEVENLABS_API_KEY in .env".to_string())?;
    let voice_id = std::env::var("ELEVENLABS_VOICE_ID")
        .map_err(|_| "Missing ELEVENLABS_VOICE_ID in .env".to_string())?;

    if api_key.trim().is_empty() {
        return Err("ELEVENLABS_API_KEY is empty".to_string());
    }

    if voice_id.trim().is_empty() {
        return Err("ELEVENLABS_VOICE_ID is empty".to_string());
    }

    Ok(ElevenLabsConfig { api_key, voice_id })
}

fn get_audio_file_name(word: &str) -> String {
    let mut file_name = String::new();
    let mut replacing = false;

    for ch in word.to_lowercase().chars() {
        let should_replace = ch.is_whitespace()
            || matches!(
                ch,
                '/' | '\\' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' | '+'
            );

        if should_replace {
            if !replacing {
                file_name.push('_');
                replacing = true;
            }
        } else {
            file_name.push(ch);
            replacing = false;
        }
    }

    file_name.push_str(".mp3");
    file_name
}

fn clean_tts_text(word: &str) -> String {
    let mut text = String::new();
    let mut in_parentheses = false;

    for ch in word.chars() {
        match ch {
            '(' => {
                while text.chars().last().is_some_and(|ch| ch.is_whitespace()) {
                    text.pop();
                }
                in_parentheses = true;
            }
            ')' if in_parentheses => {
                in_parentheses = false;
            }
            _ if !in_parentheses => text.push(ch),
            _ => {}
        }
    }

    text.trim().to_string()
}

fn audio_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("audio");

    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn is_quota_error(status: StatusCode, body: &str) -> bool {
    let body = body.to_lowercase();

    status == StatusCode::PAYMENT_REQUIRED
        || body.contains("quota")
        || body.contains("credit")
        || body.contains("character_limit")
        || body.contains("limit exceeded")
        || body.contains("exceeded")
}

#[tauri::command]
fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn remove_file(path: String) -> Result<(), String> {
    std::fs::remove_file(path).map_err(|error| error.to_string())
}

#[tauri::command]
async fn get_elevenlabs_quota() -> Result<ElevenLabsQuota, String> {
    let config = load_elevenlabs_config()?;
    let response = reqwest::Client::new()
        .get("https://api.elevenlabs.io/v1/user/subscription")
        .header("xi-api-key", config.api_key)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("ElevenLabs quota request failed: {status} {body}"));
    }

    let quota = response
        .json::<ElevenLabsQuotaResponse>()
        .await
        .map_err(|error| error.to_string())?;

    Ok(ElevenLabsQuota {
        character_count: quota.character_count,
        character_limit: quota.character_limit,
        next_character_count_reset_unix: quota.next_character_count_reset_unix,
        status: quota.status,
    })
}

#[tauri::command]
async fn download_elevenlabs_audio(
    app: tauri::AppHandle,
    word: String,
) -> Result<AudioDownloadResult, String> {
    let config = load_elevenlabs_config()?;
    let file_name = get_audio_file_name(&word);
    let file_path = audio_dir(&app)?.join(&file_name);

    if file_path.exists() {
        return Ok(AudioDownloadResult {
            status: "ready".to_string(),
            file_name,
            message: None,
        });
    }

    let text = clean_tts_text(&word);
    if text.is_empty() {
        return Ok(AudioDownloadResult {
            status: "error".to_string(),
            file_name,
            message: Some("Word is empty after cleanup".to_string()),
        });
    }

    let url = format!(
        "https://api.elevenlabs.io/v1/text-to-speech/{}?output_format={}",
        config.voice_id, ELEVENLABS_OUTPUT_FORMAT
    );

    let response = reqwest::Client::new()
        .post(url)
        .header("xi-api-key", config.api_key)
        .header("Accept", "audio/mpeg")
        .json(&TextToSpeechRequest {
            text: &text,
            model_id: ELEVENLABS_TTS_MODEL,
        })
        .send()
        .await
        .map_err(|error| error.to_string())?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Ok(AudioDownloadResult {
            status: if is_quota_error(status, &body) {
                "quota_exhausted".to_string()
            } else {
                "error".to_string()
            },
            file_name,
            message: Some(format!("ElevenLabs TTS failed: {status} {body}")),
        });
    }

    let bytes = response.bytes().await.map_err(|error| error.to_string())?;
    std::fs::write(file_path, bytes).map_err(|error| error.to_string())?;

    Ok(AudioDownloadResult {
        status: "ready".to_string(),
        file_name,
        message: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_words",
        sql: include_str!("../migrations/001_create_words.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:vocabulary.db", migrations)
                .build(),
        )
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Err(e) = window::setup_main_window_size(&window) {
                    eprintln!("Lỗi cấu hình kích thước cửa sổ: {}", e);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            write_binary_file,
            read_binary_file,
            remove_file,
            get_elevenlabs_quota,
            download_elevenlabs_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
