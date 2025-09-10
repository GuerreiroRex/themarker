use crate::servidor::meudb::MeuDb;
use actix_web::web;
use chrono::Utc;
use duckdb::params;
use std::sync::Arc;

pub struct Projetos {
    pub id: String,
    pub nome: String,
    pub data_criacao: String, //DateTime<Utc>,
}

impl Projetos {
    pub async fn criar_tabela(meudb: &web::Data<Arc<MeuDb>>) {
        let _con = meudb
            .cliente
            .conn(move |conexao| {
                conexao.execute(
                    "CREATE TABLE IF NOT EXISTS projetos (id STRING, nome STRING, data_criacao DATE)",
                    [],
                )
            })
            .await
            .expect("Não foi possível executar a Query.");
    }

    pub async fn inserir_valor(meudb: &web::Data<Arc<MeuDb>>, nome: &'static str) {
        let data_criacao = Utc::now().to_rfc3339();

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

    pub async fn ler_valor(&self, meudb: web::Data<Arc<MeuDb>>, id: &'static str) -> Projetos {
        let projeto: Self = meudb
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
            .await
            .expect("Não foi possível executar a Query.");

        projeto
    }

    pub async fn ler_todos(meudb: &web::Data<Arc<MeuDb>>) -> Vec<Projetos> {
        let lista = meudb
            .cliente
            .conn(|conn| {
                let mut stmt = conn.prepare("SELECT id, nome FROM projetos WHERE id = ?")?;

                // executa a mesma statement com um parâmetro (Alice)
                let rows = stmt.query_map(params![], |row| {
                    // mapeia cada row para um tuple (id, name)
                    Ok(Self {
                        id: row.get::<_, String>(0)?,
                        nome: row.get::<_, String>(1)?,
                        data_criacao: String::from(""),
                    })
                })?;

                let projetos = rows.collect::<Result<Vec<Self>, duckdb::Error>>()?;

                Ok(projetos)
            })
            .await
            .expect("Não foi possível executar a Query.");

        lista
    }
}
