// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::time::Duration;
use tauri::tray::TrayIconBuilder;
use tauri::{async_runtime, Manager};

pub mod caminhos;
pub mod enums;
pub mod inicializador;
pub mod servidor;
pub mod tabelas;
pub mod rotas;
pub mod meudb;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // pega a janela 'main' (ela foi criada mas está oculta)
            let window = app
                .get_webview_window("main")
                .expect("janela 'main' não encontrada");
            let window = window.clone(); // mover para o task async

            let icon = app
                .default_window_icon()
                .expect("icone padrão não encontrado")
                .clone();

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("The Marker")
                .build(app)?; // -> tauri::Result<...>

            // spawn de uma task async na runtime do Tauri
            async_runtime::spawn(async move {
                // espera desejada
                tokio::time::sleep(Duration::from_secs(3)).await;

                // mostra a janela
                // pode usar `window.show().unwrap()` ou `window.set_visible(true).unwrap()`
                if let Err(e) = window.show() {
                    eprintln!("falha ao mostrar janela: {:?}", e);
                } else {
                    // opcional: colocar foco
                    let _ = window.set_focus();
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            inicializador::conseguir_servidor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
