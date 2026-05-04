use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_words",
            sql: include_str!("../migrations/001_create_words.sql"),
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:vocabulary.db", migrations)
                .build()
        )
        .invoke_handler(tauri::generate_handler![
            write_binary_file,
            read_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
