use crate::meudb::BancoDeDados;
use crate::tabelas::Projetos;

use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;

pub async fn ler_projeto(
    path: web::Path<String>,
    meudata: web::Data<Arc<BancoDeDados>>,
) -> impl Responder {
    let id = path.into_inner().to_string();

    let resultado = Projetos::read(&meudata, id).await;
    let resposta = resultado.unwrap();

    let jason = serde_json::to_string(&resposta).expect("Não conseguiu serializar.");

    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(jason)
}

pub async fn ler_projetos(meudata: web::Data<Arc<BancoDeDados>>) -> impl Responder {
    let projetos = Projetos::read_all(&meudata).await;

    match serde_json::to_string(&projetos) {
        Ok(jason) => HttpResponse::Ok()
            .content_type("application/json; charset=utf-8")
            .body(jason),
        Err(_) => HttpResponse::InternalServerError().body("Falha ao serializar resposta"),
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Projeto {
    nome: String,
}

pub async fn criar_projeto(
    meudata: web::Data<Arc<BancoDeDados>>,
    recebido: web::Json<Projeto>,
) -> impl Responder {
    let resposta = recebido.into_inner();
    let nome = resposta.nome;

    futures::executor::block_on(Projetos::create(&meudata, nome));

    HttpResponse::Ok()
        .content_type("application/json; charset=utf-8")
        .body("OK")
}

// pub async fn atualizar_projeto(
//     meudata: web::Data<Arc<BancoDeDados>>,
//     recebido: web::Json<Projeto>,
// ) -> impl Responder {
//     let resposta = recebido.into_inner();
//     let nome = resposta.nome;

//     futures::executor::block_on(Projetos::update(&meudata, nome));

//     HttpResponse::Ok()
//         .content_type("application/json; charset=utf-8")
//         .body("OK")
// }

// pub async fn apagar_projeto(
//     meudata: web::Data<Arc<BancoDeDados>>,
//     recebido: web::Json<Projeto>,
// ) -> impl Responder {
//     let resposta = recebido.into_inner();
//     let nome = resposta.nome;

//     futures::executor::block_on(Projetos::delete(&meudata, nome));

//     HttpResponse::Ok()
//         .content_type("application/json; charset=utf-8")
//         .body("OK")
// }
