use crate::meudb::BancoDeDados;
use duckdb::params;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

use std::fs;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

lazy_static! {
    pub static ref IMAGENS: Arc<Mutex<Arc<FrameImagens>>> =
        Arc::new(Mutex::new(FrameImagens::start()));
}

pub struct FrameImagens {
    banco_de_dados: Arc<BancoDeDados>,
}

#[tauri::command]
pub fn api_imagem_criar(caminho: String, base64: String) {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.criar(caminho, base64);
}

#[tauri::command]
pub fn api_imagem_ler(id: String) -> Option<Imagem> {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.ler(id)
}

#[tauri::command]
pub fn api_imagem_atualizar(id: String, novo_caminho: String, novo_base64: String) {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.atualizar(id, novo_caminho, novo_base64);
}

#[tauri::command]
pub fn api_imagem_apagar(id: String) {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.apagar(id);
}

#[tauri::command]
pub fn api_imagem_ler_todas(pagina: usize) -> Vec<Imagem> {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.ler_todas(pagina)
}

// Adicione também esta função para contar o total de imagens (útil para o frontend saber quantas páginas existem)
#[tauri::command]
pub fn api_imagem_contar_total() -> usize {
    let imagens = IMAGENS.lock().unwrap();
    let frame_imagens = imagens.clone();
    frame_imagens.contar_total()
}

#[tauri::command]
pub async fn read_file_as_base64(file_path: String) -> Result<String, String> {
    // Ler o arquivo
    let file_data = fs::read(&file_path)
        .map_err(|e| format!("Erro ao ler arquivo: {}", e))?;
    
    // Converter para base64
    let base64_string = BASE64.encode(&file_data);
    
    Ok(base64_string)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Imagem {
    id: String,
    caminho: String,
    base64: String,
}

impl FrameImagens {
    fn start() -> Arc<FrameImagens> {
        let gerente: Arc<FrameImagens> = Arc::new(FrameImagens {
            banco_de_dados: Arc::new(futures::executor::block_on(BancoDeDados::novo(
                String::from("projeto"),
            ))),
        });

        {
            let conn = gerente.banco_de_dados.cliente.lock().unwrap();
            let comando = "
                CREATE TABLE IF NOT EXISTS base.imagens (
                    id String, 
                    caminho String, 
                    base64 String
                );";

            let _ = conn.execute(comando, params![]);
        }

        gerente
    }

    // Create
    pub fn criar(&self, caminho: String, base64: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut check_stmt = conn
            .prepare("SELECT COUNT(*) FROM base.imagens WHERE caminho = ?;")
            .expect("Falha ao preparar verificação de existência");

        let count: u64 = check_stmt
            .query_row(params![caminho], |row| row.get(0))
            .expect("Falha ao executar verificação de existência");

        if count == 0 {
            let mut insert_stmt = conn
                .prepare("INSERT INTO base.imagens VALUES (uuid(), ?, ?);")
                .expect("Falha ao preparar inserção");

            let result = insert_stmt.execute(params![caminho, base64]);
            println!("Resultado da inserção: {:?}", result);
        }
    }

    // Read
    pub fn ler(&self, id: String) -> Option<Imagem> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut comando = conn
            .prepare("SELECT id, caminho, base64 FROM base.imagens WHERE id = ?;")
            .expect("Falha ao criar leitura");

        let mut resultado = comando.query(params![id]).expect("Falha ao consultar");

        if let Some(row) = resultado.next().ok()? {
            let id: String = row.get(0).ok()?;
            let caminho: String = row.get(1).ok()?;
            let base64: String = row.get(2).ok()?;

            let img = Imagem {
                id,
                caminho,
                base64,
            };

            return Some(img);
        } else {
            println!("Nenhuma imagem encontrada com esse id");
            return None;
        }
    }

    // Update
    fn atualizar(&self, id: String, novo_caminho: String, novo_base64: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        let mut comando = conn
            .prepare("UPDATE base.imagens SET caminho = ?, base64 = ? WHERE id = ?;")
            .expect("Falha ao criar atualização");
        let _ = comando.execute(params![novo_caminho, novo_base64, id]);
    }

    // Delete
    fn apagar(&self, id: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        let mut comando = conn
            .prepare("DELETE FROM base.imagens WHERE id = ?;")
            .expect("Falha ao criar deleção");
        let _ = comando.execute(params![id]);
    }

    // No impl FrameImagens, substitua a função ler_todas por:
    fn ler_todas(&self, pagina: usize) -> Vec<Imagem> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let limite = 10;
        let offset = (pagina - 1) * limite;

        let mut comando = conn
            .prepare("SELECT id, caminho, base64 FROM base.imagens ORDER BY id LIMIT ? OFFSET ?;")
            .expect("Falha ao criar leitura paginada");

        let mut resultado = comando
            .query(params![limite, offset])
            .expect("Falha ao consultar paginada");

        let mut imagens: Vec<Imagem> = Vec::new();

        while let Some(row) = resultado.next().expect("Falha ao obter próxima linha") {
            let id: String = row.get(0).expect("Falha ao obter id");
            let caminho: String = row.get(1).expect("Falha ao obter caminho");
            let base64: String = row.get(2).expect("Falha ao obter base64");

            let img = Imagem {
                id,
                caminho,
                base64,
            };

            imagens.push(img);
        }

        imagens
    }

    // No impl FrameImagens, adicione a função contar_total:
    fn contar_total(&self) -> usize {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut comando = conn
            .prepare("SELECT COUNT(*) FROM base.imagens;")
            .expect("Falha ao criar contagem");

        let count: u64 = comando
            .query_row(params![], |row| row.get(0))
            .expect("Falha ao contar imagens");

        count as usize
    }
}
