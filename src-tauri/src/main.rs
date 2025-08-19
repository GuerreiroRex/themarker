// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod meudb;

use meudb::criar_db;

fn main() {
    criar_db();
    themarker_lib::run()
}
