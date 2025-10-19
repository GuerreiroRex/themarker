use crate::enums::{Modelo, Criptografia};
//use crate::servidor::{Servidor};
use crate::db_projetos::PROJETOS;

pub fn inicializar() {
    println!("Iniciando servidor");
    
    // let _ = Servidor::novo("sistema".to_string(), Modelo::Aberto);
    //let _ = Servidor::novo("sistema".to_string(), Modelo::Fechado);

    
    let proj = PROJETOS.lock().unwrap();
    {
        proj.criar(
          "teste".to_string(),
            Modelo::Fechado,
            Criptografia::Inativa
        );
    }
    
}
