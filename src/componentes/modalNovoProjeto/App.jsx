import { useState } from "react";
import { useNavigate } from 'react-router-dom';

import "./style.css";

function ModalNovoProjeto({ fecharmodal }) {
  const navegar = useNavigate();

  return <>
    <div id="modalNovoProjeto">
      <button onClick={ fecharmodal }> Fechar </button>
      <p>Teste 123</p>
        <button onClick={ () => {navegar('/principal')} }> Abrir </button>
    </div>
  </>
}

export default ModalNovoProjeto;
