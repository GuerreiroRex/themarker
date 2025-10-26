import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import "./style.css";

function ModalHospedarProjeto({ fecharmodal }) {
  const [projetos, setProjetos] = useState([]);
  const [novoNome, setNovoNome] = useState("");
  const [novaChave, setNovaChave] = useState("");
  const [novoAberto, setNovoAberto] = useState(true);
  const [novoCripto, setNovoCripto] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingNome, setEditingNome] = useState("");
  const [projetoAbrindo, setProjetoAbrindo] = useState(null);
  const [chaveAbertura, setChaveAbertura] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function carregar() {
      try {
        const res = await invoke("api_projeto_ler_todos");
        if (!mounted) return;
        setProjetos(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Erro ao carregar projetos:", err);
        if (mounted) setProjetos([]);
      }
    }
    carregar();
    return () => {
      mounted = false;
    };
  }, []);

  async function criarProjeto(e) {
    e.preventDefault();
    if (!novoNome.trim()) return;
    if (novoCripto && !novaChave.trim()) {
      alert("Por favor, insira uma chave para projetos com criptografia");
      return;
    }
    try {
      await invoke("api_projeto_criar", {
        nome: novoNome,
        aberto: novoAberto,
        criptografia: novoCripto,
        chave: novaChave,
      });
      setNovoNome("");
      setNovaChave("");
      setNovoCripto(false);
      setNovoAberto(true);
      await recarregar();
    } catch (err) {
      console.error("Erro ao criar projeto:", err);
    }
  }

  async function iniciarEdicao(proj) {
    setEditingId(proj.id);
    setEditingNome(proj.nome);
    setProjetoAbrindo(null); // Fecha qualquer abertura em andamento
  }

  async function salvarEdicao() {
    if (!editingNome.trim() || !editingId) return;
    try {
      await invoke("api_projeto_atualizar", {
        id: editingId,
        novo_nome: editingNome,
      });
      setEditingId(null);
      setEditingNome("");
      await recarregar();
    } catch (err) {
      console.error("Erro ao atualizar projeto:", err);
    }
  }

  async function apagarProjeto(id, nome) {
    if (!window.confirm(`Apagar projeto "${nome}"?`)) return;
    try {
      await invoke("api_projeto_apagar", { id });
      await recarregar();
    } catch (err) {
      console.error("Erro ao apagar projeto:", err);
    }
  }

  async function recarregar() {
    try {
      const res = await invoke("api_projeto_ler_todos");
      setProjetos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Erro ao recarregar projetos:", err);
      setProjetos([]);
    }
  }

  function iniciarAbertura(projeto) {
    setProjetoAbrindo(projeto);
    setChaveAbertura("");
  }

  function cancelarAbertura() {
    setProjetoAbrindo(null);
    setChaveAbertura("");
  }

  function confirmarAbertura() {
    if (!chaveAbertura.trim()) {
      alert("Por favor, insira a chave para abrir o projeto");
      return;
    }
    
    if (typeof fecharmodal === "function") fecharmodal();
    navigate(`/principal/${projetoAbrindo.id}`, { state: { chave: chaveAbertura } });
  }

  function abrirProjeto(projeto) {
    if (!projeto.criptografia) {
      if (typeof fecharmodal === "function") fecharmodal();
      navigate(`/principal/${projeto.id}`);
    } else {
      iniciarAbertura(projeto);
    }
  }

  return (
    <div id="modalCarregarProjeto" className="modal">
      <div className="modal-content">
        <button type="button" className="close-btn" onClick={fecharmodal}>
          Fechar
        </button>

        <h3>Projetos</h3>

        {/* Formulário simples para criar */}
        <form onSubmit={criarProjeto} className="criar-form">
          <input
            placeholder="Nome do projeto"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={novoAberto}
              onChange={(e) => setNovoAberto(e.target.checked)}
            />
            Aberto
          </label>
          <label>
            <input
              type="checkbox"
              checked={novoCripto}
              onChange={(e) => setNovoCripto(e.target.checked)}
            />
            Criptografia
          </label>
          {novoCripto && (
            <input
              type="password"
              placeholder="Chave de criptografia"
              value={novaChave}
              onChange={(e) => setNovaChave(e.target.value)}
            />
          )}
          <button type="submit">Criar</button>
        </form>

        <hr />

        {/* Lista */}
        {projetos.length === 0 ? (
          <p>Nenhum projeto encontrado.</p>
        ) : (
          <ul className="lista-projetos">
            {projetos.map((p) => (
              <li key={p.id} className="projeto-item">
                {/* edição inline */}
                {editingId === p.id ? (
                  <>
                    <input
                      value={editingNome}
                      onChange={(e) => setEditingNome(e.target.value)}
                    />
                    <button type="button" onClick={salvarEdicao}>
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditingNome("");
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="projeto-info">
                      <span className="proj-nome">{p.nome}</span>
                      <span className="proj-meta">
                        {p.modelo ? `— ${p.modelo}` : ""}
                        {p.criptografia ? " 🔒" : ""}
                      </span>
                      <div className="proj-actions">
                        <button type="button" onClick={() => abrirProjeto(p)}>
                          Abrir
                        </button>
                        <button type="button" onClick={() => iniciarEdicao(p)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => apagarProjeto(p.id, p.nome)}
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                    
                    {/* Seção de inserção de chave - visível apenas quando abrindo este projeto criptografado */}
                    {projetoAbrindo && projetoAbrindo.id === p.id && p.criptografia && (
                      <div className="chave-abertura-container">
                        <div className="chave-abertura">
                          <p>Este projeto está criptografado. Insira a chave para abrir:</p>
                          <input
                            type="password"
                            placeholder="Digite a chave de criptografia"
                            value={chaveAbertura}
                            onChange={(e) => setChaveAbertura(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                confirmarAbertura();
                              }
                            }}
                          />
                          <div className="chave-actions">
                            <button type="button" onClick={confirmarAbertura}>
                              Confirmar
                            </button>
                            <button type="button" onClick={cancelarAbertura}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ModalHospedarProjeto;