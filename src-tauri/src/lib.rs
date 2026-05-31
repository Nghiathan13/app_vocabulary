use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

mod commands;
mod db;
mod services;
mod window;

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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    if let Ok(is_maximized) = window.is_maximized() {
                        let state = if is_maximized { "maximized" } else { "normal" };
                        if let Ok(config_dir) = window.path().app_config_dir() {
                            let _ = std::fs::create_dir_all(&config_dir);
                            let _ = std::fs::write(config_dir.join("window_state.txt"), state);
                        }
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::files::write_binary_file,
            commands::files::read_binary_file,
            commands::files::remove_file,
            commands::audio::get_elevenlabs_quota,
            commands::audio::download_elevenlabs_audio,
            commands::words::get_all_words,
            commands::words::insert_new_word,
            commands::words::update_word_fields_rust,
            commands::words::delete_word_by_id_rust,
            commands::words::import_words_rust,
            commands::words::get_due_review_words,
            commands::words::update_word_review_rust,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
