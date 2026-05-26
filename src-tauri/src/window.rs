use tauri::WebviewWindow;

/// Tự động điều chỉnh kích thước cửa sổ chính theo tỷ lệ 16:10 và chiếm 80% màn hình chính
pub fn setup_main_window_size(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(monitor) = window.primary_monitor()? {
        let size = monitor.size();
        let monitor_width = size.width as f64;
        let monitor_height = size.height as f64;

        // Tỷ lệ khung hình cửa sổ cố định là 16:10 (chiều rộng / chiều cao = 1.6)
        // Cửa sổ chiếm tối đa 80% (0.8) chiều rộng/chiều cao màn hình
        let mut w = 0.8 * monitor_width;
        let mut h = w / 1.6;

        if h > 0.8 * monitor_height {
            h = 0.8 * monitor_height;
            w = h * 1.6;
        }

        window.set_size(tauri::Size::Physical(tauri::PhysicalSize::new(
            w.round() as u32,
            h.round() as u32,
        )))?;

        window.center()?;
    }
    Ok(())
}
