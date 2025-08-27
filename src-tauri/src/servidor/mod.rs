mod extras;
mod rotas;

use actix_web::Error;
use rotas::{echo, get_user, health, index};

use std::io;
use std::thread::{self, JoinHandle};

use actix_web::{dev::ServerHandle, web, App, HttpServer};
use std::net::TcpListener;

pub enum MODELO {
    FECHADO,
    ABERTO,
}

pub struct Servidor {
    handle: Option<ServerHandle>,
    thread: Option<JoinHandle<io::Result<()>>>,

    modelo: MODELO,
    porta: Option<&'static str>,
}

impl Servidor {
    pub fn novo(modelo: MODELO, porta: &'static str) -> Self {
        Self {
            handle: None,
            thread: None,
            modelo: modelo,
            porta: Some(porta),
        }
    }

    pub fn criar_url(&self) -> String {
        let porta = self.porta.unwrap_or_else(|| "0".into());

        let modelo = match self.modelo {
            MODELO::FECHADO => "127.0.0.1",
            MODELO::ABERTO => "0.0.0.0",
        };

        let url = format!("{}:{}", modelo, porta);
        url
    }

    pub fn iniciar(&mut self) -> Result<(), Error> {
        let bind_addr = self.criar_url();
        let bind_addr = bind_addr.as_str();

        let listener = TcpListener::bind(bind_addr)?;
        let bind = listener.local_addr()?;

        //println!("Iniciando servidor em http://{}", bind_addr);

        let server = HttpServer::new(|| {
            App::new()
                .route("/", web::get().to(index))
                .route("/health", web::get().to(health))
                .route("/user/{id}", web::get().to(get_user))
                .route("/echo", web::post().to(echo))
        })
        .listen(listener)?
        .run();

        self.handle = Some(server.handle());

        let join = thread::spawn(move || {
            //println!("Actix server thread: starting server at http://{}", bind);
            actix_web::rt::System::new().block_on(server)
        });

        self.thread = Some(join);

        Ok(())
    }
}
