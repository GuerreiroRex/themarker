mod rotas;

use actix_web::Error;
use rotas::{echo, get_user, health, index};

use std::thread::{self};

use actix_web::{web, App, HttpServer};
use std::net::TcpListener;

pub enum MODELO {
    FECHADO,
    ABERTO,
}

pub struct Servidor {
    modelo: MODELO,
    porta: u16,
    url: String,
}

impl Servidor {
    pub fn novo(modelo: MODELO, porta: u16) -> Self {
        let mut servidor = Self {
            modelo: modelo,
            porta: porta,
            url: String::new(),
        };

        servidor.url = servidor.criar_url();
        servidor
    }

    pub fn criar_url(&self) -> String {
        let porta = self.porta;

        let modelo = match self.modelo {
            MODELO::FECHADO => "127.0.0.1",
            MODELO::ABERTO => "0.0.0.0",
        };

        let url = format!("{}:{}", modelo, porta);
        url
    }

    pub fn iniciar(&mut self) -> Result<(), Error> {
        let bind_addr = self.url.as_str();
        let listener = TcpListener::bind(bind_addr)?;

        let bind = listener.local_addr()?;
        self.porta = bind.port();

        let server = HttpServer::new(|| {
            App::new()
                .route("/", web::get().to(index))
                .route("/health", web::get().to(health))
                .route("/user/{id}", web::get().to(get_user))
                .route("/echo", web::post().to(echo))
        })
        .listen(listener)?
        .run();

        let _join = thread::spawn(move || actix_web::rt::System::new().block_on(server));

        Ok(())
    }
}
