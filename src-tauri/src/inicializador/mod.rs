use crate::servidor::{Servidor};
//use std::cell::OnceCell;

//use crate::meudb::MeuDB;
use crate::enums::Modelo;

pub fn inicializar() {
    println!("Iniciando servidor");
    let _ = Servidor::novo(Modelo::Fechado);
    //MeuDB::novo("sistema", MODELO::FECHADO, 0);
    // let cell: OnceCell<Servidor> = OnceCell::new();
    // cell.get_or_init(|| Servidor::novo(MODELO::FECHADO, 0));

    // MeuDB::novo("projetoA", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoB", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoC", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoD", MODELO::FECHADO, 0);
    // MeuDB::novo("projetoE", MODELO::FECHADO, 0);

    // criar_caminhos();
    // criar_db();
}
