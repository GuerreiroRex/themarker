use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;

use super::meudb::MeuDb;
use crate::servidor::DICIONARIO;
use crate::tabelas::Projetos;
use serde_json::{json, Value};

pub async fn index() -> impl Responder {
    let dicionario = DICIONARIO.lock().unwrap();
    let chaves: Vec<&String> = dicionario.keys().collect();
    

    let lista: Vec<Value> = chaves
        .into_iter()
        .map(|nome| json!({ "nome": nome }))
        .collect();

    let resposta = serde_json::to_string(&lista).unwrap();

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(resposta)
}

/*
pub async fn index(meudata: web::Data<Arc<MeuDb>>) -> impl Responder {

    Projetos::criar_tabela(&meudata).await;

    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto1").await;
    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto2").await;
    let projeto = Projetos::inserir_valor(&meudata, "novo_projeto3").await;

    let lista = Projetos::ler_todos( &meudata ).await;
    let abc: Vec<&str> = lista.iter().map(|p| p.id.as_str()).collect::<Vec<_>>();
    let resposta = abc.join(", ");

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("Olá — rota / (db: {})", resposta))
}
*/

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

pub async fn ler_projeto(
    path: web::Path<String>,
    meudata: web::Data<Arc<MeuDb>>,
) -> impl Responder {
    let id = path.into_inner().to_string();

    let resultado = Projetos::ler_valor(meudata, id).await;
    let resposta = resultado.unwrap();

    let jason = serde_json::to_string(&resposta).expect("Não conseguiu serializar.");

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(jason)
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

pub async fn ler_todos_projetos()  -> impl Responder {
    let dicionario = DICIONARIO.lock().unwrap();
    let chaves: Vec<&String> = dicionario.keys().collect();
    

    let lista: Vec<Value> = chaves
        .into_iter()
        .map(|nome| json!({ "nome": nome }))
        .collect();

    let resposta = serde_json::to_string(&lista).unwrap();

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(resposta)   
}