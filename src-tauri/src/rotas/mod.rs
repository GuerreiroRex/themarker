mod aprojetos;

use actix_web::{HttpResponse, Responder};
pub use aprojetos::*;

pub async fn index() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("OK")
}
