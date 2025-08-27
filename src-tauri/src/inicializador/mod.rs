use crate::caminhos::criar_caminhos;
use crate::servidor::{Servidor, MODELO};
use std::cell::OnceCell;

pub fn inicializar() {
    let cell: OnceCell<Servidor> = OnceCell::new();
    cell.get_or_init(|| Servidor::novo(MODELO::FECHADO, "0"));

    criar_caminhos();
    // criar_db();
}
