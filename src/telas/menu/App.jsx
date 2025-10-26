// App.jsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FaFolderOpen, FaCloudUploadAlt, FaCog, FaRocket } from "react-icons/fa";
import "./App.css";
import ModalEntrarProjeto from "../../componentes/modalEntrarProjeto/App.jsx";
import ModalHospedarProjeto from "../../componentes/modalHospedarProjeto/App.jsx";

function Menu() {
  const [modalVisivel, setModalVisivel] = useState(null);

  useEffect(() => {
    let mounted = true;
    invoke("api_projeto_ler_todos")
      .then((res) => {
        if (!mounted) return;
      })
      .catch((err) => {
        console.error("Erro ao carregar projetos:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="menu-container">
      {/* Logo Section */}
      <div className="logo-section">
        <div className="logo-container">
          <img src="themarker_logo.svg" alt="The Marker Logo" className="logo" />
          <div className="logo-glow"></div>
        </div>
        <h1 className="app-title">
          <span className="app-title-main">THE MARKER</span>
          <span className="app-title-sub">Ferramenta de Marcação de Imagem</span>
        </h1>
      </div>

      {/* Botões Section */}
      <div className="botoes-section">
        <div className="botoes-container">
          <button 
            className="botao-menu primary" 
            onClick={() => setModalVisivel("novo")}
          >
            <div className="botao-content">
              <FaFolderOpen className="icone-botao" />
              <span>Acessar Projeto</span>
            </div>
            <FaRocket className="botao-arrow" />
          </button>

          <button 
            className="botao-menu secondary" 
            onClick={() => setModalVisivel("carregar")}
          >
            <div className="botao-content">
              <FaCloudUploadAlt className="icone-botao" />
              <span>Hospedar Projeto</span>
            </div>
            <FaRocket className="botao-arrow" />
          </button>

          <button className="botao-menu tertiary">
            <div className="botao-content">
              <FaCog className="icone-botao" />
              <span>Configurações</span>
            </div>
            <FaRocket className="botao-arrow" />
          </button>
        </div>
      </div>

      {/* Modais */}
      {modalVisivel === "novo" && (
        <ModalEntrarProjeto fecharmodal={() => setModalVisivel(null)} />
      )}
      {modalVisivel === "carregar" && (
        <ModalHospedarProjeto fecharmodal={() => setModalVisivel(null)} />
      )}
    </div>
  );
}

export default Menu;