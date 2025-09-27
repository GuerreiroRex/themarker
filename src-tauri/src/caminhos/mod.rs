use directories_next::ProjectDirs;
use std::fs::create_dir_all;
use std::path::PathBuf;

pub fn criar_pasta(nome_pasta: &str) -> PathBuf {
    let caminho_pasta =
        ProjectDirs::from("com", "themarker", nome_pasta).expect("Não foi possível encontrar.");
    let caminho_pasta = caminho_pasta.data_dir();

    create_dir_all(&caminho_pasta).expect("Erro ao criar o diretório.");
    caminho_pasta.to_path_buf()
}

/*
pub fn criar_pasta_data() -> PathBuf {
    let caminho_projeto =
        ProjectDirs::from("com", "themarker", "projetos").expect("Não foi possível encontrar.");
    let caminho_projeto = caminho_projeto.data_dir().join(nome_arquivo);

    create_dir_all(&caminho_projeto).expect("Erro ao criar o diretório.");

    // println!("Caminho do projeto: {}", caminho_projeto.display());
    caminho_projeto.to_path_buf()
}
 */

pub fn criar_arquivo_data(nome_arquivo: &str) -> PathBuf {
    let caminho_pasta =
        ProjectDirs::from("com", "themarker", "projetos").expect("Não foi possível encontrar.");

    let caminho_pasta = caminho_pasta.data_dir();

    create_dir_all(&caminho_pasta).expect("Erro ao criar o diretório.");
    let caminho_pasta = caminho_pasta.join(nome_arquivo);

    //caminho_pasta.to_path_buf()
    caminho_pasta
}
