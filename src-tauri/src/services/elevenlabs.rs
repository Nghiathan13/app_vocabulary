use std::path::PathBuf;

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tauri::Manager;

const TTS_MODEL: &str = "eleven_multilingual_v2";
const OUTPUT_FORMAT: &str = "mp3_44100_128";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Quota {
    pub character_count: i64,
    pub character_limit: i64,
    pub next_character_count_reset_unix: Option<i64>,
    pub status: Option<String>,
}

#[derive(Deserialize)]
struct QuotaResponse {
    character_count: i64,
    character_limit: i64,
    next_character_count_reset_unix: Option<i64>,
    status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDownloadResult {
    pub status: String,
    pub file_name: String,
    pub message: Option<String>,
}

#[derive(Serialize)]
struct TextToSpeechRequest<'a> {
    text: &'a str,
    model_id: &'static str,
}

struct Config {
    api_key: String,
    voice_id: String,
}

fn load_config() -> Result<Config, String> {
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

    Ok(Config { api_key, voice_id })
}

pub fn get_audio_file_name(word: &str) -> String {
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

pub fn audio_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
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

pub async fn fetch_quota() -> Result<Quota, String> {
    let config = load_config()?;
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
        .json::<QuotaResponse>()
        .await
        .map_err(|error| error.to_string())?;

    Ok(Quota {
        character_count: quota.character_count,
        character_limit: quota.character_limit,
        next_character_count_reset_unix: quota.next_character_count_reset_unix,
        status: quota.status,
    })
}

pub async fn download_audio(
    app: &tauri::AppHandle,
    word: String,
) -> Result<AudioDownloadResult, String> {
    let config = load_config()?;
    let file_name = get_audio_file_name(&word);
    let file_path = audio_dir(app)?.join(&file_name);

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
        config.voice_id, OUTPUT_FORMAT
    );

    let response = reqwest::Client::new()
        .post(url)
        .header("xi-api-key", config.api_key)
        .header("Accept", "audio/mpeg")
        .json(&TextToSpeechRequest {
            text: &text,
            model_id: TTS_MODEL,
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
