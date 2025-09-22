use crate::meudb::BancoDeDados;

use actix_web::web;
use chrono::Local;
use duckdb::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Serialize, Deserialize, Debug)]
pub struct Projetos {
    pub id: String,
    pub nome: String,
    pub data_criacao: String,
}

impl Projetos {
    pub async fn create_table(meudb: &web::Data<Arc<BancoDeDados>>) {
        meudb
            .cliente
            .conn(move |conexao| {
                conexao.execute(
                    "CREATE TABLE IF NOT EXISTS projetos (id STRING, nome STRING, data_criacao STRING)",
                    [],
                )
            })
            .await
            .expect("Não foi possível executar a Query.");
    }

    pub async fn create(meudb: &web::Data<Arc<BancoDeDados>>, nome: &'static str) {
        let data_criacao = Local::now().to_rfc3339();

        let _con = meudb
            .cliente
            .conn(move |conexao| {
                conexao.execute(
                    "INSERT INTO projetos (id, nome, data_criacao) VALUES (uuidv7(), ?, ?);",
                    params![nome, data_criacao],
                )
            })
            .await
            .expect("Não foi possível executar a Query.");
    }

    pub async fn read(meudb: web::Data<Arc<BancoDeDados>>, id: String) -> Option<Projetos> {
        let projeto = meudb
            .cliente
            .conn(move |conexao| {
                conexao.query_row(
                    "SELECT id, nome, data_criacao FROM projetos WHERE id = ?;",
                    params![id],
                    |row| {
                        Ok(Self {
                            id: row.get(0)?,
                            nome: row.get(1)?,
                            data_criacao: row.get(2)?,
                        })
                    },
                )
            })
            .await;

        let resultado: Option<Projetos> = match projeto {
            Ok(valor) => Some(valor),
            Err(error) => {
                println!("Erro ao fazer query: {}", error);
                None
            }
        };

        resultado
    }

    pub async fn read_all(meudb: &web::Data<Arc<BancoDeDados>>) -> Vec<Projetos> {
        let lista = meudb
            .cliente
            .conn(|conn| {
                let mut stmt = conn.prepare("SELECT id, nome, data_criacao FROM projetos;")?;
                let rows = stmt.query_map(params![], |row| {
                    Ok(Self {
                        id: row.get(0)?,
                        nome: row.get(1)?,
                        data_criacao: row.get(2)?,
                    })
                })?;
                rows.collect::<Result<Vec<Self>, duckdb::Error>>()
            })
            .await;

        lista.unwrap_or_else(|error| {
            println!("Erro ao fazer query: {}", error);
            Vec::new()
        })
    }

    pub async fn update(
        meudb: &web::Data<Arc<BancoDeDados>>,
        id: String,
        novo_nome: String,
    ) -> Result<(), async_duckdb::Error> {
        meudb
            .cliente
            .conn(move |conexao| {
                conexao.execute(
                    "UPDATE projetos SET nome = ? WHERE id = ?;",
                    params![novo_nome, id],
                )
            })
            .await
            .map(|_| ())
    }

    pub async fn delete(
        meudb: &web::Data<Arc<BancoDeDados>>,
        id: String,
    ) -> Result<(), async_duckdb::Error> {
        meudb
            .cliente
            .conn(move |conexao| conexao.execute("DELETE FROM projetos WHERE id = ?;", params![id]))
            .await
            .map(|_| ())
    }
}
