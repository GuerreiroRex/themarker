use lazy_static::lazy_static;
use std::sync::{Arc, Mutex};

use crate::enums::{Criptografia, Modelo};
use crate::meudb::BancoDeDados;
use duckdb::params;
use serde::{Deserialize, Serialize};

lazy_static! {
    pub static ref PROJETOS: Arc<Mutex<Arc<FrameProjetos>>> =
        Arc::new(Mutex::new(FrameProjetos::start()));
}

pub struct FrameProjetos {
    banco_de_dados: Arc<BancoDeDados>,
}

#[tauri::command]
pub fn api_projeto_criar(nome: String, aberto: bool, criptografia: bool) {
    let projetos = PROJETOS.lock().unwrap();
    let frame_projetos = projetos.clone();

    let modelo = match aberto {
        true => Modelo::Aberto,
        false => Modelo::Fechado,
    };

    let criptografia = match criptografia {
        true => Criptografia::Ativa,
        false => Criptografia::Inativa,
    };

    frame_projetos.criar(nome, modelo, criptografia);
}

#[tauri::command]
pub fn api_projeto_ler(id: String) -> Option<Projeto> {
    let projetos = PROJETOS.lock().unwrap();
    let frame_projetos = projetos.clone();

    let resultado = frame_projetos.ler(id);

    resultado
}

#[tauri::command]
pub fn api_projeto_atualizar(id: String, novo_nome: String) {
    let projetos = PROJETOS.lock().unwrap();
    let frame_projetos = projetos.clone();

    frame_projetos.atualizar(id, novo_nome);
}


#[tauri::command]
pub fn api_projeto_apagar(id: String) {
    let projetos = PROJETOS.lock().unwrap();
    let frame_projetos = projetos.clone();

    frame_projetos.apagar(id);
}

#[tauri::command]
pub fn api_projeto_ler_todos() -> Vec<Projeto> {

    let projetos = PROJETOS.lock().unwrap();
    let frame_projetos = projetos.clone();

    let resultado = frame_projetos.ler_todos();

    resultado
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Projeto {
    id: String,
    nome: String,
    modelo: String,
    criptografia: bool,
}

impl FrameProjetos {
    fn start() -> Arc<FrameProjetos> {
        let gerente = Arc::new(FrameProjetos {
            banco_de_dados: Arc::new(futures::executor::block_on(BancoDeDados::novo(
                String::from("sistema"),
            ))),
        });

        {
            let conn = gerente.banco_de_dados.cliente.lock().unwrap();

            let comando = "
                CREATE TABLE IF NOT EXISTS base.projetos (
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

    //create (do CRUD)
    pub fn criar(&self, nome: String, modelo: Modelo, criptografia: Criptografia) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut check_stmt = conn
            .prepare("SELECT COUNT(*) FROM base.projetos WHERE nome = ?;")
            .expect("Failed to prepare existence check query");

        let count: u64 = check_stmt
            .query_row(params![nome], |row| row.get(0))
            .expect("Failed to execute existence check");

        if count == 0 {
            let mut insert_stmt = conn
                .prepare("INSERT INTO base.projetos VALUES (uuid(), ?, ?, ?);")
                .expect("Failed to prepare insert statement");

            let result = insert_stmt.execute(params![nome, modelo.valor(), criptografia.valor()]);
            println!("Insertion result: {:?}", result);
        }
    }

    // read
    pub fn ler(&self, id: String) -> Option<Projeto> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut comando = conn
            .prepare("SELECT id, nome, modelo, criptografia FROM base.projetos WHERE id = ?;")
            .expect("Falha ao criar leitura.");

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
    fn atualizar(&self, id: String, novo_nome: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        let mut comando = conn
            .prepare("UPDATE base.projetos SET nome = ? WHERE id = ?;")
            .expect("Falha ao criar atualização.");
        let _ = comando.execute(params![novo_nome, id]);
    }

    //delete
    fn apagar(&self, id: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        let mut comando = conn
            .prepare("DELETE FROM base.projetos WHERE id = ?;")
            .expect("Falha ao criar deleção.");
        let _ = comando.execute(params![id]);
    }

    // read all
    fn ler_todos(&self) -> Vec<Projeto> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut comando = conn
            .prepare("SELECT id, nome, modelo, criptografia FROM base.projetos;")
            .expect("Falha ao criar leitura.");

        let mut resultado = comando.query(params![]).expect("Falha ao consultar.");

        let mut projetos: Vec<Projeto> = Vec::new();

        while let Some(row) = resultado.next().expect("Falha ao obter próxima linha.") {
            let id: String = row.get(0).expect("Falha ao obter id.");
            let nome: String = row.get(1).expect("Falha ao obter nome.");
            let modelo: String = row.get(2).expect("Falha ao obter modelo.");
            let criptografia: bool = row.get(3).expect("Falha ao obter criptografia.");

            let proj = Projeto {
                id: id,
                nome: nome,
                modelo: modelo,
                criptografia: criptografia,
            };

            projetos.push(proj);
        }

        projetos
    }
}
