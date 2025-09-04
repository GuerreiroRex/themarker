// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod caminhos;
mod servidor;
mod inicializador;
mod enums;

fn main() {
    // let serv = servidor::iniciar(None).expect("Falha ao iniciar servidor");

    inicializador::inicializar();
    themarker_lib::run()
}
