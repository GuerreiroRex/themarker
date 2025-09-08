use async_duckdb::{Client, ClientBuilder};
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::runtime::Runtime;
use anyhow::Result;

/// Container com runtime e client para reutilização.
struct GlobalDb {
    rt: Arc<Runtime>,
    client: Arc<Client>,
}

// inicializa uma instância global e reutilizável.
// a criação do runtime + client acontece uma vez, no primeiro acesso.
static GLOBAL_DB: Lazy<GlobalDb> = Lazy::new(|| {
    // constrói um runtime multi-thread e mantém ele vivo na static
    let rt = Arc::new(
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .worker_threads(4) // ajustar conforme necessidade
            .build()
            .expect("failed to build tokio runtime"),
    );

    // usa block_on para criar o client no contexto do runtime
    let client = {
        let rt2 = rt.clone();
        rt2.block_on(async {
            ClientBuilder::new()
                // .path("/path/to/db.duckdb") // descomente/ajuste se quiser arquivo
                .open()
                .await
                .expect("failed to open async-duckdb client")
        })
    };

    GlobalDb {
        rt,
        client: Arc::new(client),
    }
});

/// Exemplo de função síncrona para executar uma query que retorna todas as linhas/colunas como String.
pub fn query_sync(sql: &str) -> Result<Vec<Vec<String>>> {
    // acessa o client/runtime global e executa a operação de forma síncrona (block_on)
    let db = &*GLOBAL_DB;

    // block_on sobre a Future retornada por client.conn(...)
    db.rt.block_on(async {
        let rows: Vec<Vec<String>> = db
            .client
            .conn(|conn| {
                conn.query_map(sql, [], |row| {
                    let mut cols = Vec::new();
                    for i in 0..row.column_count() {
                        let v: Option<String> = row.get(i);
                        cols.push(v.unwrap_or_default());
                    }
                    Ok(cols)
                })
            })
            .await?;
        Ok(rows)
    })
}
