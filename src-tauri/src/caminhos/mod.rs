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

pub fn criar_projetos(nome_pasta: &str) -> PathBuf {
    let caminho_projeto =
        ProjectDirs::from("com", "themarker", "projetos").expect("Não foi possível encontrar.");
    let caminho_projeto = caminho_projeto.data_dir().join(nome_pasta);

    create_dir_all(&caminho_projeto).expect("Erro ao criar o diretório.");

    println!("Caminho do projeto: {}", caminho_projeto.display());
    caminho_projeto.to_path_buf()
}
