import React, { useState } from "react";
import "./style.css";

function modalEntrarProjeto({ fecharmodal }) {
  const [url, setUrl] = useState("");
  const [porta, setPorta] = useState("");
  const [erro, setErro] = useState("");

  const handleEntrar = (e) => {
    e.preventDefault();
    // Simulação de tentativa de conexão
    setErro("Servidor não encontrado");
  };

  return (
    <div id="modalEntrarProjeto" className="modal">
      <div className="modal-content">
        <button type="button" className="close-btn" onClick={fecharmodal}>
          Fechar
        </button>

        <h3>Conectar a Servidor</h3>

        <form onSubmit={handleEntrar} className="criar-form">
          <input
            type="text"
            placeholder="URL do servidor"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            type="text"
            placeholder="Porta"
            value={porta}
            onChange={(e) => setPorta(e.target.value)}
          />
          <button type="submit">ENTRAR</button>
        </form>

        {erro && (
          <div style={{ 
            color: 'var(--danger)', 
            marginTop: '12px', 
            padding: '8px',
            background: 'rgba(255,107,107,0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {erro}
          </div>
        )}
      </div>
    </div>
  );
}

export default modalEntrarProjeto;