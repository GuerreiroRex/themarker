//use duckdb::{params, Connection, Result};
use duckdb::Connection;
use directories_next::ProjectDirs;

pub fn criar_db() {
    let caminho_da_projeto = ProjectDirs::from("com", "GuerreiroRex", "themarker").expect("Não foi possível encontrar.");
    let caminho_da_pasta = caminho_da_projeto.data_dir().to_path_buf();

    let caminho_arquivo = caminho_da_pasta.join("meudb2.db");

    //println!( caminho_arquivo );

    let _conn = Connection::open( caminho_arquivo ).expect("Erro ao criar a conexão.");
}
