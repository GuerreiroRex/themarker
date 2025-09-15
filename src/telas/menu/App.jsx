import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
// import { fetch } from '@tauri-apps/plugin-http';
import { fetch } from '@tauri-apps/plugin-http';

const response = await fetch('http://10.102.37.150:63822/', {
  method: 'GET',
});

console.log(response.json());




import ModalNovoProjeto from "../../componentes/modalNovoProjeto/App.jsx";
import ModalCarregarProjeto from "../../componentes/modalCarregarProjeto/App.jsx";

function Menu() {
  const [modalVisivel, setModalVisivel] = useState(null);

  const [servidor, setServidor] = useState("");
  const [listaProjetos, setListaProjetos] = useState("");

  useEffect(() => {
    invoke("conseguir_servidor", { nome: "sistema" })
      .then((resposta) => setServidor(resposta))
      .catch((erro) => console.error("Erro ao chamar backend:", erro));
  }, []);

  // useEffect(
  //   async () => {
  //     const response = await fetch(`http://${servidor}/`, {
  //       method: 'GET',
  //     });

  //     setListaProjetos(response.status);

  //   }, [servidor]
  // );

  return (
    <>
      {
        (modalVisivel == "novo") &&
        <ModalNovoProjeto fecharmodal={() => { setModalVisivel(null) }} />
      }
      {
        (modalVisivel == "carregar") &&
        <ModalCarregarProjeto fecharmodal={() => { setModalVisivel(null) }} />
      }
      <p className="titulo">Teste Menu</p>
      <p>Teste Menu</p>

      <button onClick={() => { setModalVisivel("novo") }}>Novo Projeto </button>
      <button onClick={() => { setModalVisivel("carregar") }}>Carregar Projeto </button>
      <button>Configurações </button>

      <div>
        <h1>Servidor atual:</h1>
        <p>{`http://${servidor}/` || "Carregando..."}</p>
      </div>

      <p>{listaProjetos || "Carregando 2..."}</p>


    </>
  );
}

export default Menu;
