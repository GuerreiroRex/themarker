mod projetos;


pub use projetos::*;
use actix_web::{HttpResponse, Responder};

pub async fn index() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("OK")
}
