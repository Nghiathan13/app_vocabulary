use tauri::{Manager, WebviewWindow};

/// Tự động điều chỉnh kích thước cửa sổ chính theo tỷ lệ 16:10 và chiếm 80% màn hình chính
pub fn setup_main_window_size(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    // 1. Kiểm tra trạng thái lưu lần trước
    let mut is_previously_maximized = false;
    if let Ok(config_dir) = window.path().app_config_dir() {
        let state_path = config_dir.join("window_state.txt");
        if state_path.exists() {
            if let Ok(content) = std::fs::read_to_string(state_path) {
                if content.trim() == "maximized" {
                    is_previously_maximized = true;
                }
            }
        }
    }

    if let Some(monitor) = window
        .current_monitor()?
        .or(window.primary_monitor()?)
        .or_else(|| {
            window
                .available_monitors()
                .ok()
                .and_then(|monitors| monitors.into_iter().next())
        })
    {
        let size = monitor.size();
        let scale_factor = monitor.scale_factor();
        let monitor_width = size.width as f64 / scale_factor;
        let monitor_height = size.height as f64 / scale_factor;

        // Tỷ lệ khung hình cửa sổ cố định là 16:10 (chiều rộng / chiều cao = 1.6)
        let mut w = 0.8 * monitor_width;
        let mut h = w / 1.6;

        if h > 0.8 * monitor_height {
            h = 0.8 * monitor_height;
            w = h * 1.6;
        }

        window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(
            w.round(),
            h.round(),
        )))?;

        window.center()?;
    }

    if is_previously_maximized {
        window.maximize()?;
    }

    Ok(())
}
