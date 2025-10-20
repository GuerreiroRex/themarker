use crate::servidor::SERVIDORES;

fn api_servidor_encontrar(id_servidor: String) -> String {
    let dicionario_servidor = SERVIDORES.lock().unwrap();
    let servidor = dicionario_servidor.get( id_servidor.as_str() ).unwrap();

    let endereço = servidor.mostrar_url();
    
    endereço
}
//////////////////////////////////////////////////////////
#[tauri::command]
pub fn api_servidor_criar_imagem(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_ler_imagem(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_atualizar_imagem(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_remover_imagem(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}
//////////////////////////////////////////////////////////
#[tauri::command]
pub fn api_servidor_criar_marcação(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_ler_marcação(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_atualizar_marcação(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}

#[tauri::command]
pub fn api_servidor_remover_marcação(id_servidor: String) {
    let _endereço = api_servidor_encontrar(id_servidor);
}