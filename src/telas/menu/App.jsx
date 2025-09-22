import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
// import { fetch } from '@tauri-apps/plugin-http';
import { fetch } from '@tauri-apps/plugin-http';



import ModalHospedarProjeto from "../../componentes/modalHospedarProjeto/App.jsx";
import ModalCarregarProjeto from "../../componentes/modalCarregarProjeto/App.jsx";

function Menu() {
  const [modalVisivel, setModalVisivel] = useState(null);

  const [servidor, setServidor] = useState(null);
  const [listaProjetos, setListaProjetos] = useState([]);

  useEffect(() => {
    invoke("conseguir_servidor", { nome: "sistema" })
      .then((resposta) => sessionStorage.setItem("servidor", resposta))
      .catch((erro) => console.error("Erro ao chamar backend:", erro));
  }, []);


  

  useEffect(
    () => {

      if (servidor) {
        console.log("Iniciado com o servidor: ", `http://${servidor}/`)

        fetch(`http://${servidor}/projetos`, {
          method: 'GET',
        }).then((resp) => {
          /* console.log(resp);
          console.log(resp.json()); */
          let abc = resp.json().then(
            (conteudo) => {
              console.log("abc: ", conteudo)
              setListaProjetos(conteudo);
              console.log(listaProjetos);
            }
          );

        })
      }


    }, [servidor]
  );

  return (
    <>
      {
        (modalVisivel == "novo") &&
        <ModalHospedarProjeto fecharmodal={() => { setModalVisivel(null) }} />
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

      <>{listaProjetos.length > 0 ?
        listaProjetos.map(
          (valor, indice) => {
            return <p key={indice}>{valor.nome}</p>
          }
        )
        : "Carregando 2..."}</>


    </>
  );
}

export default Menu;
