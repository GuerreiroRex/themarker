use async_duckdb::{Client, ClientBuilder};
use chrono::Utc;
use duckdb::params;
use std::sync::Arc;

pub struct MeuDb {
    pub cliente: Arc<Client>,
}

impl MeuDb {
    pub async fn novo() -> MeuDb {
        let client = ClientBuilder::new()
            .path(":memory:") // banco em memória
            .open()
            .await
            .expect("failed to open async duckdb client");

        let meudb = MeuDb {
            cliente: Arc::new(client),
        };
        meudb
    }

    pub async fn executar(&self, sql: &'static str, parametros: Vec<&str>) {
        // let paramst: Vec<&dyn duckdb::ToSql> = parametros.iter().map(|p| p as &dyn duckdb::ToSql).collect();
        let con = self
            .cliente
            .conn(|conexao| {
                conexao.execute(
                    "INSERT INTO person (name, data) VALUES (?, ?)",
                    params!["me.name", "me.data"],
                )
            })
            .await
            .expect("Não foi possível executar a Query.");
    }

    /*
        let con = self
            .cliente
            .conn(|conexao| conexao.execute(sql))
            .await
            .expect("Não foi possível executar a Query.");
    } */

    // pub async fn executar(&self, comando: &'static str) {
    //     self.cliente
    //         .conn(|conn| {
    //             conn.execute(comando, [])?;
    //             Ok::<(), duckdb::Error>(())
    //         })
    //         .await
    //         .expect("Falha na execução do comando.");
    // }

    // 1. Cria a tabela users
    // pub async fn criar_tabela(&self) {
    //     self.executar(
    //         "CREATE TABLE IF NOT EXISTS users (
    //             id INTEGER,
    //             name TEXT NOT NULL
    //         );",
    //         params![1i64, "João"],
    //     )
    //     .await;

    //     ()
    // }

    // /// 2. Insere 5 registros de exemplo
    // pub async fn inserir_exemplos(&self) {
    //     let nomes = vec!["Alice", "Bob", "Carol", "David", "Eve"];
    //     for nome in nomes {
    //         let nome = nome.to_string();
    //         self.cliente
    //             .conn(move |conn| {
    //                 conn.execute("INSERT INTO users (id, name) VALUES (0, ?1)", [&nome])?;
    //                 Ok::<(), duckdb::Error>(())
    //             })
    //             .await
    //             .expect("Falha ao inserir registro");
    //     }
    // }

    // /// 3. Lê todos os registros da tabela
    // pub async fn ler_todos(&self) -> Vec<User> {
    //     self.cliente
    //         .conn(|conn| {
    //             let mut stmt = conn.prepare("SELECT id, name FROM users")?;
    //             let rows = stmt
    //                 .query_map([], |row| {
    //                     Ok(User {
    //                         id: row.get(0)?,
    //                         name: row.get(1)?,
    //                     })
    //                 })?
    //                 .collect::<duckdb::Result<Vec<User>>>()?;
    //             Ok::<_, duckdb::Error>(rows)
    //         })
    //         .await
    //         .unwrap_or_default()
    // }
}
