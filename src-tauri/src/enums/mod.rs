pub enum Modelo {
    Fechado,
    Aberto,
}

impl Modelo {
    pub fn base_url(&self) -> &'static str {
        match self {
            Modelo::Aberto => "0.0.0.0",
            Modelo::Fechado => "127.0.0.1",
        }
    }
}
