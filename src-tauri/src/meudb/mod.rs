use crate::caminhos::criar_arquivo_data;
// use async_duckdb::{Client, ClientBuilder};
use duckdb::Connection;
use std::sync::{Arc, Mutex};

pub struct BancoDeDados {
    pub nome: String,
    pub cliente: Arc<Mutex<Connection>>,
}

impl BancoDeDados {
    pub async fn novo(nome: String) -> BancoDeDados {
        let caminho = criar_arquivo_data(format!("{}.db", nome.as_str()).as_str());
        let chave = "minha senhas";

        let conn = Connection::open_in_memory().expect("Falha ao criar o banco de dados.");

        let mut encriptografar_db = conn
            .prepare(
                format!(
                    "ATTACH '{}' AS base (ENCRYPTION_KEY '{}');",
                    caminho.display(),
                    chave
                )
                .as_str(),
            )
            .expect("Falha ao preparar a encriptação do banco de dados.");

        encriptografar_db
            .execute([])
            .expect("Falha ao encriptografar o banco de dados.");

        let banco_de_dados = BancoDeDados {
            nome,
            cliente: Arc::new(Mutex::new(conn)),
        };

        println!("Banco de dados '{}' criado com sucesso.", caminho.display());
        banco_de_dados
    }
}
