use crate::caminhos::criar_pasta;
use async_duckdb::{Client, ClientBuilder};
use std::sync::Arc;

pub struct BancoDeDados {
    pub nome: String,
    pub cliente: Arc<Client>,
}

impl BancoDeDados {
    pub async fn novo(nome: String) -> BancoDeDados {
        // let client = ClientBuilder::new()
        //     .path("teste.db") // banco em memória
        //     .open()
        //     .await
        //     .expect("failed to open async duckdb client");

        let chave = "k4Hj7FpX9zqLw2RyVtBn8mO1sWx3EdcN6UiJ5aM0oPthCgQv+l/I=";

        let client = ClientBuilder::new()
            .path(":memory:") // banco em memória
            .open()
            .await
            .expect("failed to open async duckdb client");

        client
            .conn(move |clientconn| {
                clientconn.execute_batch(
                    format!(
                        "ATTACH 'teste.db' AS encrypted_db (ENCRYPTION_KEY '{}');",
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
    }

    pub async fn salvar(&self) {
        let caminho = criar_pasta(self.nome.as_str());
        // let caminho_banco = caminho.join("data.duckdb");

        println!("Salvando banco de dados em: {}", caminho.display());

        self.cliente
            .conn(move |conexao| {
                conexao.execute(
                    format!("EXPORT DATABASE '{}' (FORMAT PARQUET);", caminho.display()).as_str(),
                    [],
                )
            })
            .await
            .expect("Não foi possível salvar o banco de dados.");
    }

    // pub async fn executar(&self, sql: &'static str, parametros: Vec<&str>) {
    //     // let paramst: Vec<&dyn duckdb::ToSql> = parametros.iter().map(|p| p as &dyn duckdb::ToSql).collect();
    //     self
    //         .cliente
    //         .conn(|conexao| {
    //             conexao.execute(
    //                 "INSERT INTO person (name, data) VALUES (?, ?)",
    //                 params!["me.name", "me.data"],
    //             )
    //         })
    //         .await
    //         .expect("Não foi possível executar a Query.");
    // }
}
