use rusqlite::Connection;
use tauri::Manager;

pub mod words;

pub fn get_db_conn(app: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join("vocabulary.db");

    Connection::open(db_path).map_err(|e| e.to_string())
}
