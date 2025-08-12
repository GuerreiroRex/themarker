import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import ModalNovoProjeto from "../../componentes/modalNovoProjeto/App.jsx";
import ModalCarregarProjeto from "../../componentes/modalCarregarProjeto/App.jsx";

function Menu() {
  const [modalVisivel, setModalVisivel] = useState(null);

  return (
    <>
      {
        (modalVisivel == "novo") &&
          <ModalNovoProjeto fecharmodal = {()=>{setModalVisivel(null)}} />
      }
        {
          (modalVisivel == "carregar") &&
            <ModalCarregarProjeto fecharmodal = {()=>{setModalVisivel(null)}} />
        }
      <p className="titulo">Teste Menu</p>
      <p>Teste Menu</p>

      <button onClick={()=>{setModalVisivel("novo")}}>Novo Projeto </button>
      <button onClick={()=>{setModalVisivel("carregar")}}>Carregar Projeto </button>
      <button>Configurações </button>


    </>
  );
}

export default Menu;
