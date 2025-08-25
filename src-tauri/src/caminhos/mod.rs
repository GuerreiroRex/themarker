use std::fs;
use directories_next::ProjectDirs;
use once_cell::sync::Lazy;

pub struct Caminhos {
    pub caminho_pasta_sys: String,
    pub caminho_arquivo_sys_db: String,
}

pub static CAMINHOS: Lazy<Caminhos> = Lazy::new(obter_caminhos);

pub fn obter_caminhos() -> Caminhos {
    let caminho_projeto = ProjectDirs::from("com", "themarker", "system").expect("Não foi possível encontrar.");
    
    let caminho_pasta_sys = caminho_projeto.data_dir().to_path_buf();
    let caminho_arquivo_sys_db = caminho_pasta_sys.join("meudb.db");

    return Caminhos {
        caminho_pasta_sys: caminho_pasta_sys.to_string_lossy().to_string(),
        caminho_arquivo_sys_db: caminho_arquivo_sys_db.to_string_lossy().to_string(),
    };
}

pub fn criar_caminhos() {
    let caminhos = obter_caminhos();
    fs::create_dir_all(caminhos.caminho_pasta_sys.clone()).expect("Erro ao criar o diretório.");
}