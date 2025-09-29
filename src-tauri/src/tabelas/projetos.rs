use crate::meudb::BancoDeDados;

use actix_web::web;
use duckdb::{params};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize, Debug)]
pub struct Projetos {
    pub nome: String,
    pub data_criacao: String,
    pub aberto: bool,
    pub criptografado: bool,
}

impl Projetos {
    pub async fn create_table(meudb: &web::Data<Arc<BancoDeDados>>) {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("CREATE TABLE IF NOT EXISTS base.projetos (nome STRING, data_criacao STRING, aberto BOOL, criptografado BOOL)")
            .expect("Erro criando a query.");
        comando.execute(params![]).expect("Falha ao executar a query.");
    }

    pub async fn create(meudb: &web::Data<Arc<BancoDeDados>>, nome: String) {
        Projetos::create_table(&meudb).await;

        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("INSERT INTO base.projetos (nome, data_criacao, aberto, criptografado) VALUES (?, ?, ?, ?);")
            .expect("Erro criando a query.");
        comando.execute(params![nome]).expect("Falha ao executar a query.");
    }

    pub async fn read(meudb: &web::Data<Arc<BancoDeDados>>, id: String) -> Option<Projetos> {
        Projetos::create_table(&meudb).await;

        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("SELECT nome, data_criacao, aberto, criptografado FROM base.projetos WHERE nome = ?;")
            .expect("Falha ao criar a query: SELECT nome, data_criacao, aberto, criptografado FROM base.projetos WHERE nome = ?.");

        let resposta = comando
            .query_row(params![id], |row| {
                Ok(Self {
                    nome: row.get(0)?,
                    data_criacao: row.get(1)?,
                    aberto: row.get(2)?,
                    criptografado: row.get(3)?,
                })
            })
            .expect("Falha na query.");

        Some(resposta)
    }

    pub async fn read_all(meudb: &web::Data<Arc<BancoDeDados>>) -> Vec<Projetos> {
        Projetos::create_table(&meudb).await;

        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("SELECT id, nome, data_criacao FROM base.projetos;")
            .expect("Falha ao criar a query: SELECT id, nome, data_criacao FROM base.projetos.");

        let resposta = comando
            .query_map(params![], |row| {
                Ok(Self {
                    nome: row.get(0)?,
                    data_criacao: row.get(1)?,
                    aberto: row.get(2)?,
                    criptografado: row.get(3)?,
                })
            })
            .expect("Falha na query.");

        let lista = resposta
            .collect::<Result<Vec<Projetos>, _>>()
            .expect("Falha na lista.");
        lista
    }

    // pub async fn update(meudb: &web::Data<Arc<BancoDeDados>>, id: String, novo_nome: String) {
    //     Projetos::create_table(&meudb).await;

    //     let client = meudb.cliente.lock().unwrap();

    //     let mut comando = client
    //         .prepare("UPDATE base.projetos SET nome = ? WHERE nome = ?;")
    //         .expect("Erro criando a query.");
    //     comando.execute(params![novo_nome, id]).expect("Falha ao executar a query.");
    // }

    pub async fn delete(meudb: &web::Data<Arc<BancoDeDados>>, id: String) {
        Projetos::create_table(&meudb).await;
        
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("DELETE FROM base.projetos WHERE nome = ?;")
            .expect("Falha ao criar a query: DELETE FROM base.projetos WHERE nome = ?.");
        comando.execute(params![id]).expect("Falha ao executar a query.");
    }
}
