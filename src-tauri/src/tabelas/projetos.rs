use crate::servidor::meudb::MeuDb;
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
    pub async fn criar_tabela(meudb: &web::Data<Arc<MeuDb>>) {
        let _con = meudb
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

    pub async fn inserir_valor(meudb: &web::Data<Arc<MeuDb>>, nome: &'static str) {
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

    pub async fn ler_valor(meudb: web::Data<Arc<MeuDb>>, id: String) -> Option<Projetos> {
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

    pub async fn ler_todos(meudb: &web::Data<Arc<MeuDb>>) -> Vec<Projetos> {
        let lista = meudb
            .cliente
            .conn(|conn| {
                let mut stmt = conn.prepare("SELECT id, nome FROM projetos;")?;

                let rows = stmt.query_map(params![], |row| {
                    Ok(Self {
                        id: row.get::<_, String>(0)?,
                        nome: row.get::<_, String>(1)?,
                        data_criacao: String::from(""),
                    })
                })?;

                let projetos = rows.collect::<Result<Vec<Self>, duckdb::Error>>()?;

                Ok(projetos)
            })
            .await;

        let resultado = match lista {
            Ok(valor) => valor,
            Err(error) => {
                println!("Erro ao fazer query: {}", error);
                Vec::new()
            }
        };

        resultado
    }
}
