use crate::enums::Modelo;
use crate::meudb::BancoDeDados;
use crate::rotas;

use actix_web::{web, App, HttpServer};
use std::collections::HashMap;
use std::net::TcpListener;
use std::sync::Arc;

use std::thread;

use lazy_static::lazy_static;
use std::sync::Mutex;

lazy_static! {
    pub static ref SERVIDORES: Mutex<HashMap<String, Arc<Servidor>>> = Mutex::new(HashMap::new());
}
pub struct Servidor {
    modelo: Modelo,
    ip: String,
    porta: u16,
    db: web::Data<Arc<BancoDeDados>>,
}

impl Servidor {
    pub fn novo(nome: String, modelo: Modelo) -> Arc<Self> {
        let meu_db = Arc::new(futures::executor::block_on(BancoDeDados::novo(
            nome.clone(),
        )));

        let db_data = web::Data::new(meu_db);

        let mut servidor = Self {
            modelo,
            ip: String::new(),
            porta: 0,
            db: db_data,
        };

        match servidor.iniciar() {
            Ok((ip, porta)) => {
                servidor.ip = ip;
                servidor.porta = porta;
            }
            Err(e) => eprintln!("Incapaz de criar a porta: {}", e),
        }

        println!("Servidor Modelo: {}", servidor.modelo.base_url());
        println!("Servidor aberto em: http://{}", servidor.mostrar_url());

        Arc::new(servidor)
    }

    fn criar_url(&self) -> String {
        format!("{}:{}", self.modelo.base_url(), self.porta)
    }

    pub fn mostrar_url(&self) -> String {
        format!("{}:{}", self.ip, self.porta)
    }

    pub fn iniciar(&self) -> std::io::Result<(String, u16)> {
        let meuurl = self.criar_url();
        let bind_addr = meuurl.as_str();

        let listener: TcpListener = TcpListener::bind(&bind_addr)?;

        let local_addr = listener.local_addr()?;
        let assigned_port = local_addr.port();
        // let assigned_ip = local_ip().unwrap().to_string();
        let assigned_ip = local_addr.ip().to_string();

        let meudata = self.db.clone();

        let server = HttpServer::new(move || {
            App::new()
                .app_data(meudata.clone())
                .route("/", web::get().to(rotas::index))
                .route("/projetos", web::get().to(rotas::ler_projetos))
                .route("/projetos/criar", web::post().to(rotas::criar_projeto))
                .route("/projetos/ler", web::get().to(rotas::ler_projeto))
            // .route("/projetos/atualizar", web::put().to(rotas::atualizar_projeto))
            // .route("/projetos/apagar", web::delete().to(rotas::apagar_projeto))
        })
        .listen(listener)?
        .run();

        let _join = thread::spawn(move || actix_web::rt::System::new().block_on(server));

        Ok((assigned_ip, assigned_port))
    }
}
