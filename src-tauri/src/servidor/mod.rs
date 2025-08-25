use std::io;
use std::thread::{self, JoinHandle};

use actix_web::{dev::ServerHandle, web, App, HttpResponse, HttpServer, Responder};

/// Controlador do servidor: guarda o handle e a thread.
pub struct Servidor {
    handle: ServerHandle,
    thread: Option<JoinHandle<io::Result<()>>>,
}

impl Servidor {
    /// Para o servidor de forma síncrona (consome self).
    /// Se `graceful` for true, aguarda parada graciosa.
    pub fn parar(mut self, graceful: bool) -> io::Result<()> {
        // Solicita parada ao server (future) e block_on usando um System temporário.
        actix_web::rt::System::new().block_on(self.handle.stop(graceful));

        // Junta a thread que executa o servidor para garantir término.
        if let Some(join) = self.thread.take() {
            match join.join() {
                Ok(Ok(())) => Ok(()),
                Ok(Err(e)) => Err(e),
                Err(_) => Err(io::Error::new(io::ErrorKind::Other, "thread join failed")),
            }
        } else {
            Ok(())
        }
    }
}

fn criar_url(base: Option<String>, porta: Option<String>) -> String {
    let url = format!("{}:{}", base.unwrap_or_else(|| "127.0.0.1".into()), porta.unwrap_or_else(|| "8080".into()));
    url
}

/// Inicia o servidor em background numa thread (sincronamente).
/// `bind_addr` ex: "127.0.0.1:8080"
pub fn iniciar(bind_addr: Option<String>) -> io::Result<Servidor> {
    let a = bind_addr.unwrap_or_else(|| criar_url(None, None));
    let bind_addr = a.as_str();

    println!("Iniciando servidor em http://{}", bind_addr);

    // cria o Server future (bind pode falhar)
    let server = HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health))
            .route("/user/{id}", web::get().to(get_user))
            .route("/echo", web::post().to(echo))
    })
    .bind(bind_addr)? // retorna Err se bind falhar
    .run();

    let handle = server.handle();
    let bind = bind_addr.to_string();

    // Spawn em thread dedicada: executa o Future do server na System local
    let join = thread::spawn(move || {
        println!("Actix server thread: starting server at http://{}", bind);
        actix_web::rt::System::new().block_on(server)
    });

    println!("Servidor iniciado em background em http://{}", bind_addr);

    Ok(Servidor {
        handle,
        thread: Some(join),
    })
}

/* ------- Handlers ------- */

async fn index() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("Olá — rota /")
}

async fn health() -> impl Responder {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("OK")
}

/// Path param: Actix já decodifica percent-encoding para UTF-8.
/// Ex: /user/João (se o cliente enviar percent-encoded)
async fn get_user(path: web::Path<String>) -> impl Responder {
    let id = path.into_inner();
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body(format!("Usuário: {}", id))
}

/// Recebe bytes, valida UTF-8 explicitamente e responde com o mesmo texto.
/// Retorna 400 se o corpo não for UTF-8 válido.
async fn echo(body: web::Bytes) -> impl Responder {
    match String::from_utf8(body.to_vec()) {
        Ok(s) => HttpResponse::Ok()
                    .content_type("text/plain; charset=utf-8")
                    .body(s),
        Err(_) => HttpResponse::BadRequest()
                    .content_type("text/plain; charset=utf-8")
                    .body("Invalid UTF-8 in request body"),

    }
}