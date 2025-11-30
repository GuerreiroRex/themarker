use crate::caminhos::criar_arquivo_data;
// use async_duckdb::{Client, ClientBuilder};
use duckdb::Connection;
use std::sync::{Arc, Mutex};

pub struct BancoDeDados {
    pub nome: String,
    pub cliente: Arc<Mutex<Connection>>,
    pub caminho: String,
}

impl BancoDeDados {
    pub async fn novo(nome: String) -> BancoDeDados {
        let caminho = criar_arquivo_data(format!("{}.db", nome.as_str()).as_str());
        let chave = "minha senhas";

        let conn = Connection::open_in_memory().expect("Falha ao criar o banco de dados.");

        println!(
            "ATTACH '{}' AS base (ENCRYPTION_KEY '{}');",
            caminho.display(),
            chave
        );

        let mut encriptografar_db = conn
            .prepare(
                format!(
                    "DETACH DATABASE IF EXISTS base; ATTACH IF NOT EXISTS'{}' AS base (ENCRYPTION_KEY '{}');",
                    caminho.display(),
                    chave
                )
                .as_str(),
            )
            .expect("Falha ao preparar a encriptação do banco de dados.");

        encriptografar_db
            .execute([])
            .expect("Falha ao encriptografar o banco de dados.");

        // // Listar catálogos - CÓDIGO CORRIGIDO
        // println!("\n=== DATABASES (CATALOGS) ===");
        // let mut stmt = conn.prepare("SHOW DATABASES;").unwrap();
        // let databases = stmt.query_map([], |row| row.get::<_, String>(0)).unwrap();

        // for database in databases {
        //     println!("{}", database.unwrap());
        // }

        let banco_de_dados = BancoDeDados {
            nome,
            cliente: Arc::new(Mutex::new(conn)),
            caminho: caminho.display().to_string(),
        };

        println!("Banco de dados '{}' criado com sucesso.", caminho.display());
        banco_de_dados
    }

    pub async fn fechar(&self) -> Result<(), Box<dyn std::error::Error>> {
        let cliente = self.cliente.lock().unwrap();

        // Executa o comando DETACH no banco anexado
        cliente.execute("DETACH base", [])?;

        println!("Banco de dados '{}' dettached com sucesso.", self.nome);
        Ok(())
    }
}
