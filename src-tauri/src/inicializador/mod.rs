use crate::enums::Modelo;
use crate::servidor::{Servidor};

pub fn inicializar() {
    println!("Iniciando servidor");
    
    // let _ = Servidor::novo("sistema".to_string(), Modelo::Aberto);
    let _ = Servidor::novo("sistema".to_string(), Modelo::Fechado);
    
}
