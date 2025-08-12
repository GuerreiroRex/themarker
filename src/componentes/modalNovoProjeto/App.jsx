import { useState } from "react";

import "./style.css";

function ModalNovoProjeto({ fecharmodal }) {

  return <>
    <div id="modalNovoProjeto">
      <button onClick={ fecharmodal }> Fechar </button>
      <p>Teste 123</p>
    </div> }
  </>
}

export default ModalNovoProjeto;
