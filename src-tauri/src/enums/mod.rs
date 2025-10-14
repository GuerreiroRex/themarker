use local_ip_address::local_ip;

pub enum Modelo {
    Fechado,
    Aberto,
}

impl Modelo {
    pub fn valor(&self) -> String {
        match self {
            Modelo::Aberto => "Aberto".to_string(),
            Modelo::Fechado => "Fechado".to_string(),
        }
    }

    pub fn base_url(&self) -> String {
        match self {
            // Modelo::Aberto => "0.0.0.0",
            Modelo::Aberto => local_ip().unwrap().to_string(),
            Modelo::Fechado => "127.0.0.1".to_string(),
        }
    }
}


pub enum Criptografia {
    Ativa,
    Inativa,
}

impl Criptografia {
    pub fn valor(&self) -> bool {
        match self {
            Criptografia::Ativa => true,
            Criptografia::Inativa => false,
        }
    }
}
