use crate::caminhos::criar_arquivo_data;
// use async_duckdb::{Client, ClientBuilder};
use std::sync::{Arc, Mutex};
use duckdb::{Connection};

pub struct BancoDeDados {
    pub nome: String,
    pub cliente: Arc<Mutex<Connection>>,
}

impl BancoDeDados {
    pub async fn novo(nome: String) -> BancoDeDados {
        let conn = Connection::open_in_memory().expect("Falha ao criar o banco de dados.");
        /*
        let caminho = criar_arquivo_data(format!("{}.db", nome.as_str()).as_str());
        println!("Arquivo criado em: {}", caminho.display());

        let chave = "minha senhas";

        let client = ClientBuilder::new()
            .path(":memory:")
            .open()
            .await
            .expect("failed to open async duckdb client");

        client
            .conn(move |clientconn| {
                clientconn.execute_batch(
                    format!(
                        "ATTACH '{}' AS encrypted_db (ENCRYPTION_KEY '{}');",
                        caminho.display(),
                        chave
                    )
                    .as_str(),
                )
            })
            .await
            .expect("Failed to attach encrypted database");

        let banco_de_dados = BancoDeDados {
            nome,
            cliente: Arc::new(client),
        };
        banco_de_dados
         */

        let banco_de_dados = BancoDeDados {
            nome,
            cliente: Arc::new( Mutex::new(conn) ),
        };
        banco_de_dados
    }

}
