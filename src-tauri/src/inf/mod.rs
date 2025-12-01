use std::path::PathBuf;
use std::process::Command;

// use serde::Deserialize;
use directories_next::ProjectDirs;

use base64::{engine::general_purpose::STANDARD, Engine as _};
use std::fs::File;
use std::io::Write;
use tauri::path::BaseDirectory;
use tauri::Manager;

#[tauri::command]
pub fn salvar_imagem_temp(image_base64: &str) -> Result<PathBuf, String> {
    let proj_dirs = ProjectDirs::from("com", "themarker", "temp")
        .ok_or("Não foi possível obter diretório do projeto")?;

    let data_dir = proj_dirs.data_dir();
    std::fs::create_dir_all(data_dir).map_err(|e| format!("Falha ao criar diretório: {}", e))?;

    let image_path = data_dir.join("temp.png");

    let image_data = STANDARD
        .decode(image_base64)
        .map_err(|e| format!("Falha ao decodificar base64: {}", e))?;

    let mut file =
        File::create(&image_path).map_err(|e| format!("Falha ao criar arquivo: {}", e))?;

    file.write_all(&image_data)
        .map_err(|e| format!("Falha ao escrever arquivo: {}", e))?;

    Ok(image_path)
}

#[tauri::command]
pub async fn executar_script_python(
    handle: tauri::AppHandle,
    points: String,
) -> Result<String, String> {
    // Resolve o caminho para a pasta resources
    let resource_dir = handle
        .path()
        .resolve("resources", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Falha ao resolver resources: {}", e))?;

    // Constrói o caminho para o script Python
    let script_path = resource_dir.join("script.py");

    // Constrói o caminho para o Python no ambiente virtual
    let venv_python_path = if cfg!(windows) {
        resource_dir
            .join(".venv")
            .join("Scripts")
            .join("python.exe")
    } else {
        resource_dir.join(".venv").join("bin").join("python")
    };

    // Verifica se os arquivos existem
    if !venv_python_path.exists() {
        return Err(format!(
            "Python do venv não encontrado em: {:?}",
            venv_python_path
        ));
    }
    if !script_path.exists() {
        return Err(format!(
            "Script Python não encontrado em: {:?}",
            script_path
        ));
    }

    // Executa o comando com os argumentos separados corretamente
    let output = Command::new(&venv_python_path)
        .arg(&script_path)
        .arg("--points") // Flag separada
        .arg(&points) // Valor separado
        .current_dir(&resource_dir)
        .output()
        .map_err(|e| format!("Falha ao executar comando: {}", e))?;

    // Verifica o resultado
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("Saída do Python: {}", stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        eprintln!("Erro do Python: {}", stderr);
        Err(format!("Erro na execução: {}", stderr))
    }
}
