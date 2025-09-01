use crate::servidor::{Servidor, MODELO};
use duckdb::{Connection, Result};
use crate::caminhos::criar_projetos;

pub struct MeuDB {
    nome: String,
    caminho: String,
    servidor: Servidor,
}

impl MeuDB {
    pub fn novo(nome: &str, modelo: MODELO, porta: u16) -> Self {

        Self {
            nome: nome.to_string(),
            caminho: criar_projetos(nome).to_string_lossy().to_string(),
            servidor: Servidor::novo(modelo, porta),
        }
    }
}