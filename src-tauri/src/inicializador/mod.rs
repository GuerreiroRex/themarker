use crate::enums::{Criptografia, Modelo};
//use crate::servidor::{Servidor};
use crate::db_projetos::PROJETOS;

pub fn inicializar() {
    println!("Iniciando servidor");

    // let _ = Servidor::novo("sistema".to_string(), Modelo::Aberto);
    //let _ = Servidor::novo("sistema".to_string(), Modelo::Fechado);

    let proj = PROJETOS.lock().unwrap();
    {
        proj.criar("EXEMPLO".to_string(), Modelo::Fechado, Criptografia::Inativa);
    }
}
