use lazy_static::lazy_static;
use std::sync::{Arc, Mutex};

use serde::{Serialize, Deserialize};
use crate::enums::{Criptografia, Modelo};
use crate::meudb::BancoDeDados;
use duckdb::params;

lazy_static! {
    pub static ref PROJETOS: Arc<Mutex<Arc<Projetos>>> = Arc::new(Mutex::new(Projetos::start()));
}

pub struct Projetos {
    banco_de_dados: Arc<BancoDeDados>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Projeto {
    id: String,
    nome: String,
    modelo: String,
    criptografia: bool
}

impl Projetos {
    fn start() -> Arc<Projetos> {
        let gerente = Arc::new(
            Projetos {
                banco_de_dados: Arc::new(futures::executor::block_on(BancoDeDados::novo(
                    String::from("sistema"),
                ))),
            }
        );

        {
            let conn = gerente.banco_de_dados.cliente.lock().unwrap();

            let comando = "
                CREATE TABLE projetos (
                    id String, 
                    nome String, 
                    modelo String, 
                    criptografia bool
                );
            ";

            let _ = conn.execute(comando, params![]);
        }

        gerente
    }

    //create
    pub fn criar(&self, nome: String, modelo: Modelo, criptografia: Criptografia) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        
        let mut comando = conn.prepare("INSERT INTO projetos VALUES (uuid(), ?, ?, ?);").expect("Falha ao criar inserção.");

        let _ = comando.execute(params![nome, modelo.valor(), criptografia.valor()]);
    }

    // read
    pub fn ler(&self, id: String) -> Option<Projeto> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut comando = conn.prepare("SELECT id, nome, modelo, criptografia FROM projetos WHERE id = ?;").expect("Falha ao criar leitura.");

        let mut resultado = comando.query(params![id]).expect("Falha ao consultar.");

        if let Some(row) = resultado.next().ok()? {
            let id: String = row.get(0).ok()?;
            let nome: String = row.get(1).ok()?;
            let modelo: String = row.get(2).ok()?;
            let criptografia: bool = row.get(3).ok()?;

            let proj = Projeto {
                id: id,
                nome: nome,
                modelo: modelo,
                criptografia: criptografia,
            };

            return Some(proj);
        } else {
            println!("Nenhum item encontrado com esse id.");
            return None;
        }
    }

    //update
    fn _atualizar(&self) {}

    //delete
    fn _apagar(&self) {}
}
