use crate::meudb::BancoDeDados;
use duckdb::params;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

use std::fs;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

lazy_static! {
    pub static ref IMAGENS: Arc<Mutex<Option<Arc<FrameImagens>>>> = Arc::new(Mutex::new(None));
}


pub struct FrameImagens {
    banco_de_dados: Arc<BancoDeDados>,
}

#[tauri::command]
pub fn api_imagem_start(nome: String) {
    println!("Iniciando FrameImagens com base: {}", nome);

    let frame_imagens = FrameImagens::start(nome);
    let mut guard = IMAGENS.lock().unwrap();
    *guard = Some(frame_imagens);
}
#[tauri::command]
pub fn api_imagem_close() {
    let imagens = IMAGENS.lock().unwrap();
    println!("Fechando FrameImagens");
    match imagens.clone() {
        Some(frame_imagens) => frame_imagens.fechar(),
        None => {}
    }
}
#[tauri::command]
pub fn api_imagem_criar(caminho: String, base64: String) -> Result<String, String> {
    let imagens = IMAGENS.lock().unwrap();
    match imagens.clone() {
        Some(frame_imagens) => frame_imagens.criar(caminho, base64),
        None => Err("Sistema de imagens não inicializado".to_string())
    }
}

#[tauri::command]
pub fn api_imagem_ler(id: String) -> Option<Imagem> {
    let imagens = IMAGENS.lock().unwrap();
    match imagens.clone() {
        Some(frame_imagens) => frame_imagens.ler(id),
        None => None
    }
}

#[tauri::command]
pub fn api_imagem_atualizar(id: String, novo_caminho: String, novo_base64: String) {
    let imagens = IMAGENS.lock().unwrap();
    if let Some(frame_imagens) = imagens.clone() {
        frame_imagens.atualizar(id, novo_caminho, novo_base64);
    }
    // Silenciosamente ignora se for None
}

#[tauri::command]
pub fn api_imagem_apagar(id: String) {
    let imagens = IMAGENS.lock().unwrap();
    if let Some(frame_imagens) = imagens.clone() {
        frame_imagens.apagar(id);
    }
    // Silenciosamente ignora se for None
}

#[tauri::command]
pub fn api_imagem_ler_todas(pagina: usize) -> Vec<Imagem> {
    let imagens = IMAGENS.lock().unwrap();
    match imagens.clone() {
        Some(frame_imagens) => frame_imagens.ler_todas(pagina),
        None => Vec::new()
    }
}

#[tauri::command]
pub fn api_imagem_contar_total() -> usize {
    let imagens = IMAGENS.lock().unwrap();
    match imagens.clone() {
        Some(frame_imagens) => frame_imagens.contar_total(),
        None => 0
    }
}

#[tauri::command]
pub async fn read_file_as_base64(file_path: String) -> Result<String, String> {
    let file_data = fs::read(&file_path)
        .map_err(|e| format!("Erro ao ler arquivo: {}", e))?;
    
    let base64_string = BASE64.encode(&file_data);
    Ok(base64_string)
}

// Nova função para criar thumbnail simplificada (sem dependência da crate image)
#[tauri::command]
pub async fn create_image_thumbnail(file_path: String) -> Result<String, String> {
    let base64_data = read_file_as_base64(file_path).await?;
    
    // Para uma implementação simples, retornamos os primeiros 2000 caracteres
    // como uma "thumbnail" simplificada. Em produção, você pode usar a crate image
    // para criar thumbnails reais.
    let thumbnail = if base64_data.len() > 2000 {
        base64_data[..2000].to_string()
    } else {
        base64_data.clone()
    };
    
    Ok(thumbnail)
}

#[tauri::command]
pub async fn process_multiple_images(file_paths: Vec<String>) -> Result<Vec<ImageProcessingResult>, String> {
    let mut results = Vec::new();
    
    for file_path in file_paths {
        match read_file_as_base64(file_path.clone()).await {
            Ok(base64_data) => {
                // Criar thumbnail simplificada
                let thumbnail = create_image_thumbnail(file_path.clone()).await.unwrap_or_default();
                
                results.push(ImageProcessingResult {
                    file_path: file_path.clone(),
                    base64: base64_data,
                    thumbnail,
                });
            }
            Err(e) => {
                eprintln!("Erro ao processar {}: {}", file_path, e);
                results.push(ImageProcessingResult {
                    file_path: file_path.clone(),
                    base64: String::new(),
                    thumbnail: String::new(),
                });
            }
        }
    }
    
    Ok(results)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Imagem {
    id: String,
    caminho: String,
    base64: String,
    thumbnail: Option<String>, // Alterado para Option para compatibilidade
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImageProcessingResult {
    file_path: String,
    base64: String,
    thumbnail: String,
}

impl FrameImagens {
    fn start(base: String) -> Arc<FrameImagens> {
        let gerente: Arc<FrameImagens> = Arc::new(FrameImagens {
            banco_de_dados: Arc::new(futures::executor::block_on(BancoDeDados::novo(
                base,
            ))),
        });

        println!("Inicializando banco de dados de imagens e aplicando migrações se necessário.");

        {
            let conn = gerente.banco_de_dados.cliente.lock().unwrap();
            
            // Criar tabela se não existir (versão inicial sem thumbnail)
            let comando = "
                CREATE TABLE IF NOT EXISTS base.imagens (
                    id String, 
                    caminho String, 
                    base64 String
                );";

            let _ = conn.execute(comando, params![]);

            // Verificar se a coluna thumbnail existe e adicionar se necessário
            let mut migrar_stmt = conn
                .prepare("SELECT COUNT(*) FROM pragma_table_info('base.imagens') WHERE name = 'thumbnail';")
                .expect("Falha ao preparar verificação de migração");

            let count: u64 = migrar_stmt
                .query_row(params![], |row| row.get(0))
                .expect("Falha ao verificar migração");

            if count == 0 {
                println!("Adicionando coluna thumbnail à tabela...");
                let comando_migracao = "ALTER TABLE base.imagens ADD COLUMN thumbnail String;";
                let _ = conn.execute(comando_migracao, params![]);
                println!("Migração concluída: coluna thumbnail adicionada.");
            }
        }

        gerente
    }

    // Create - agora retorna Result
    pub fn criar(&self, caminho: String, base64: String) -> Result<String, String> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let mut check_stmt = conn
            .prepare("SELECT COUNT(*) FROM base.imagens WHERE caminho = ?;")
            .expect("Falha ao preparar verificação de existência");

        let count: u64 = check_stmt
            .query_row(params![caminho], |row| row.get(0))
            .expect("Falha ao executar verificação de existência");

        if count == 0 {
            // Criar uma thumbnail simplificada
            let thumbnail = if base64.len() > 2000 {
                base64[..2000].to_string()
            } else {
                base64.clone()
            };

            let mut insert_stmt = conn
                .prepare("INSERT INTO base.imagens (id, caminho, base64, thumbnail) VALUES (uuid(), ?, ?, ?);")
                .expect("Falha ao preparar inserção");

            match insert_stmt.execute(params![caminho, base64, thumbnail]) {
                Ok(_) => Ok("Imagem criada com sucesso".to_string()),
                Err(e) => {
                    // Fallback: tentar inserir sem thumbnail se a coluna não existir
                    println!("Erro ao inserir com thumbnail, tentando sem: {}", e);
                    let mut insert_fallback = conn
                        .prepare("INSERT INTO base.imagens (id, caminho, base64) VALUES (uuid(), ?, ?);")
                        .expect("Falha ao preparar inserção fallback");
                    
                    match insert_fallback.execute(params![caminho, base64]) {
                        Ok(_) => Ok("Imagem criada com sucesso (sem thumbnail)".to_string()),
                        Err(e2) => Err(format!("Erro ao inserir imagem: {}", e2)),
                    }
                }
            }
        } else {
            Err("Imagem já existe".to_string())
        }
    }

    pub fn fechar(&self) {
        futures::executor::block_on(
            self.banco_de_dados.fechar()
        ).unwrap_or_else(|e| {
            eprintln!("Erro ao fechar banco de dados de imagens: {}", e);
        });
    }

    // Read
    pub fn ler(&self, id: String) -> Option<Imagem> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        // Primeiro tentar com thumbnail
        let query = "
            SELECT id, caminho, base64, thumbnail 
            FROM base.imagens 
            WHERE id = ?;";

        let mut comando = match conn.prepare(query) {
            Ok(stmt) => stmt,
            Err(_) => {
                // Fallback: tentar sem thumbnail
                let query_fallback = "
                    SELECT id, caminho, base64 
                    FROM base.imagens 
                    WHERE id = ?;";
                conn.prepare(query_fallback).expect("Falha ao criar leitura fallback")
            }
        };

        let mut resultado = comando.query(params![id]).expect("Falha ao consultar");

        if let Some(row) = resultado.next().ok()? {
            let id: String = row.get(0).ok()?;
            let caminho: String = row.get(1).ok()?;
            let base64: String = row.get(2).ok()?;
            
            // Tentar obter thumbnail (pode falhar se a coluna não existir)
            let thumbnail = row.get(3).ok();
            
            let img = Imagem {
                id,
                caminho,
                base64,
                thumbnail,
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
        let thumbnail = if novo_base64.len() > 2000 {
            novo_base64[..2000].to_string()
        } else {
            novo_base64.clone()
        };
        
        // Primeiro tentar com thumbnail
        let query = "
            UPDATE base.imagens 
            SET caminho = ?, base64 = ?, thumbnail = ? 
            WHERE id = ?;";

        match conn.execute(query, params![novo_caminho, novo_base64, thumbnail, id]) {
            Ok(_) => (),
            Err(_) => {
                // Fallback: atualizar sem thumbnail
                let query_fallback = "
                    UPDATE base.imagens 
                    SET caminho = ?, base64 = ? 
                    WHERE id = ?;";
                let _ = conn.execute(query_fallback, params![novo_caminho, novo_base64, id]);
            }
        }
    }

    // Delete
    fn apagar(&self, id: String) {
        let conn = self.banco_de_dados.cliente.lock().unwrap();
        let mut comando = conn
            .prepare("DELETE FROM base.imagens WHERE id = ?;")
            .expect("Falha ao criar deleção");
        let _ = comando.execute(params![id]);
    }

    // Ler todas as imagens
    fn ler_todas(&self, pagina: usize) -> Vec<Imagem> {
        let conn = self.banco_de_dados.cliente.lock().unwrap();

        let limite = 10;
        let offset = (pagina - 1) * limite;

        // Primeiro tentar com thumbnail
        let query = "
            SELECT id, caminho, base64, thumbnail 
            FROM base.imagens 
            ORDER BY id LIMIT ? OFFSET ?;";

        let mut comando = match conn.prepare(query) {
            Ok(stmt) => stmt,
            Err(e) => {
                println!("Erro ao preparar query com thumbnail, usando fallback: {}", e);
                // Fallback: tentar sem thumbnail
                let query_fallback = "
                    SELECT id, caminho, base64 
                    FROM base.imagens 
                    ORDER BY id LIMIT ? OFFSET ?;";
                conn.prepare(query_fallback).expect("Falha ao criar leitura paginada fallback")
            }
        };

        let mut resultado = comando
            .query(params![limite, offset])
            .expect("Falha ao consultar paginada");

        let mut imagens: Vec<Imagem> = Vec::new();

        while let Some(row) = resultado.next().expect("Falha ao obter próxima linha") {
            let id: String = row.get(0).expect("Falha ao obter id");
            let caminho: String = row.get(1).expect("Falha ao obter caminho");
            let base64: String = row.get(2).expect("Falha ao obter base64");
            
            // Tentar obter thumbnail (pode falhar se a coluna não existir)
            let thumbnail = row.get(3).ok();
            
            let img = Imagem {
                id,
                caminho,
                base64,
                thumbnail,
            };

            imagens.push(img);
        }

        imagens
    }

    // Contar total
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