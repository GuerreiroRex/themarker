// use async_duckdb::Client;
use crate::servidor::meudb::MeuDb;
use chrono::NaiveDate;
// use meudb::MeuDb;

// use crate::servidor::meudb;

struct Projetos {
    id: String,
    nome: String,
    data_criacao: NaiveDate,
}