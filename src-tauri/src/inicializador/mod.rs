use crate::enums::Modelo;
use crate::servidor::{Servidor, DICIONARIO};

#[tauri::command]
pub fn conseguir_servidor(nome: &str) -> String {
    let dicionario = DICIONARIO.lock().unwrap();
    let servidor = dicionario.get(nome).cloned().unwrap();
    servidor.mostrar_url()
}

pub fn inicializar() {
    println!("Iniciando servidor");
    // let _ = Servidor::novo(Modelo::Fechado);
    let _ = Servidor::novo("sistema".to_string(), Modelo::Aberto);
    //MeuDB::novo("sistema", MODELO::FECHADO, 0);
    // let cell: OnceCell<Servidor> = OnceCell::new();
    // cell.get_or_init(|| Servidor::novo(MODELO::FECHADO, 0));

    // MeuDB::novo("projetoA", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoB", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoC", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoD", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoE", MODELO::FECHADO, 0);

    // criar_caminhos();
    // criar_db();
}
