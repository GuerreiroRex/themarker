pub mod meudb;
pub mod rotas;

use crate::enums::Modelo;
use rotas::{echo, get_user, health, index};
use meudb::MeuDb;

use actix_web::{web, App, HttpServer};
use std::net::TcpListener;
use std::sync::Arc;
use std::thread;

pub struct Servidor {
    modelo: Modelo,
    porta: u16,
    db: web::Data<Arc<MeuDb>>,
}

impl Servidor {
    pub fn novo(modelo: Modelo) -> Self {
        let meu_db = Arc::new(futures::executor::block_on(MeuDb::novo()));
        let db_data = web::Data::new(meu_db.clone());

        let mut servidor = Self {
            modelo,
            porta: 0,
            db: db_data,
        };

        match servidor.iniciar() {
            Ok(p) => servidor.porta = p,
            Err(e) => eprintln!("Incapaz de criar a porta: {}", e),
        }

        println!("Servidor aberto em: {}", servidor.criar_url());
        servidor
    }

    fn criar_url(&self) -> String {
        format!("http://{}:{}", self.modelo.base_url(), self.porta)
    }

    pub fn iniciar(&self) -> std::io::Result<u16> {
        let meuurl = self.criar_url();
        let bind_addr = meuurl.as_str();
        let listener: TcpListener = TcpListener::bind(&bind_addr)?;

        let local_addr = listener.local_addr()?;
        let assigned_port = local_addr.port();

        let meudata = self.db.clone();

        let server = HttpServer::new(move || {
            App::new()
                .app_data(meudata.clone())
                .route("/", web::get().to(index))
                .route("/health", web::get().to(health))
                .route("/user/{id}", web::get().to(get_user))
                .route("/echo", web::post().to(echo))
        })
        .listen(listener)?
        .run();

        let _join = thread::spawn(move || {
            actix_web::rt::System::new().block_on(server)
        });

        Ok(assigned_port)
    }
}
