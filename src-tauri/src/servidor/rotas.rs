use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;

use super::meudb::MeuDb;
use crate::tabelas::Projetos;

/*
pub async fn index(meudata: web::Data<Arc<MeuDb>>) -> impl Responder {
    let pessoas = meudata.ler_todos().await;
    let resultado = pessoas
        .iter()
        .map(|p| p.name.as_str())
        .collect::<Vec<_>>()
        .join(", ");

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("Olá — rota / (db: {})", resultado))
}
*/

pub async fn index(meudata: web::Data<Arc<MeuDb>>) -> impl Responder {
    
    Projetos::criar_tabela(&meudata).await;

    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto1").await;
    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto2").await;
    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto3").await;

    let lista = Projetos::ler_todos( &meudata ).await;
    let abc: Vec<&str> = lista.iter().map(|p| p.nome.as_str()).collect::<Vec<_>>();
    let resposta = abc.join(", ");

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("Olá — rota / (db: {})", resposta))
}

/* 
pub async fn index() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("Olá — rota /")
}
*/

pub async fn health() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("OK")
}

pub async fn get_user(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("Usuário: {}", id))
}

/// Recebe bytes, valida UTF-8 explicitamente e responde com o mesmo texto.
/// Retorna 400 se o corpo não for UTF-8 válido.
pub async fn echo(body: web::Bytes) -> impl Responder {
    match String::from_utf8(body.to_vec()) {
        Ok(s) => HttpResponse::Ok()
            .content_type("text/plain; charset=utf-8")
            .body(s),
        Err(_) => HttpResponse::BadRequest()
            .content_type("text/plain; charset=utf-8")
            .body("Invalid UTF-8 in request body"),
    }
}
