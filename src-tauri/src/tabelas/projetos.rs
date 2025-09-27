use crate::meudb::BancoDeDados;

use actix_web::web;
use chrono::Local;
use duckdb::{params, Params};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize, Debug)]
pub struct Projetos {
    pub id: String,
    pub nome: String,
    pub data_criacao: String,
    pub aberto: bool,
    pub criptografado: bool,
}

impl Projetos {
    pub async fn create_table(meudb: &web::Data<Arc<BancoDeDados>>) {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("CREATE TABLE IF NOT EXISTS projetos (id STRING, nome STRING, data_criacao STRING, aberto BOOL, criptografado BOOL)")
            .expect("Erro criando a query.");
        comando.execute(params![]).expect("Falha ao executar a query.");
    }

    pub async fn create(meudb: &web::Data<Arc<BancoDeDados>>, nome: String) {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("INSERT INTO projetos (id, nome, data_criacao, aberto, criptografado) VALUES (uuidv7(), ?, ?, ?, ?);")
            .expect("Erro criando a query.");
        comando.execute(params![nome]).expect("Falha ao executar a query.");
    }

    pub async fn read(meudb: web::Data<Arc<BancoDeDados>>, id: String) -> Option<Projetos> {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("SELECT id, nome, data_criacao FROM projetos;")
            .expect("Falha ao criar a query.");

        let resposta = comando
            .query_row(params![id], |row| {
                Ok(Self {
                    id: row.get(0)?,
                    nome: row.get(1)?,
                    data_criacao: row.get(2)?,
                    aberto: row.get(3)?,
                    criptografado: row.get(4)?,
                })
            })
            .expect("Falha na query.");

        Some(resposta)
    }

    pub async fn read_all(meudb: &web::Data<Arc<BancoDeDados>>) -> Vec<Projetos> {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("SELECT id, nome, data_criacao FROM projetos;")
            .expect("Falha ao criar a query.");

        let resposta = comando
            .query_map(params![], |row| {
                Ok(Self {
                    id: row.get(0)?,
                    nome: row.get(1)?,
                    data_criacao: row.get(2)?,
                    aberto: row.get(3)?,
                    criptografado: row.get(4)?,
                })
            })
            .expect("Falha na query.");

        let lista = resposta
            .collect::<Result<Vec<Projetos>, _>>()
            .expect("Falha na lista.");
        lista
    }

    pub async fn update(meudb: &web::Data<Arc<BancoDeDados>>, id: String, novo_nome: String) {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("UPDATE projetos SET nome = ? WHERE id = ?;")
            .expect("Erro criando a query.");
        comando.execute(params![novo_nome, id]).expect("Falha ao executar a query.");
    }

    pub async fn delete(meudb: &web::Data<Arc<BancoDeDados>>, id: String) {
        let client = meudb.cliente.lock().unwrap();

        let mut comando = client
            .prepare("DELETE FROM projetos WHERE id = ?;")
            .expect("Falha ao criar a query.");
        comando.execute(params![id]).expect("Falha ao executar a query.");
    }
}
