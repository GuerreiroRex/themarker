import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { fetch } from '@tauri-apps/plugin-http';


import "./style.css";


// Componente do Item da Galeria
const ItemGaleria = ({ item }) => {
  return (
    <div style={estilos.item}>
      <h3 style={estilos.titulo}>{item.nome}</h3>
      {/* Adicione mais campos aqui se necessário */}
    </div>
  );
};

// Componente da Galeria
const GaleriaVertical = ({ itens }) => {
  // Converte a string JSON para objeto JavaScript, se necessário
  const dados = typeof itens === 'string' ? JSON.parse(itens) : itens;

  return (
    <div style={estilos.galeria}>
      {dados.map((item, index) => (
        <ItemGaleria key={index} item={item} />
      ))}
    </div>
  );
};

// Estilos
const estilos = {
  galeria: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  item: {
    width: '100%',
    minHeight: '80px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    marginBottom: '15px',
    padding: '20px',
    boxSizing: 'border-box',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center'
  },
  titulo: {
    margin: 0,
    color: '#333',
    fontSize: '18px'
  }
};

function ModalEntrarProjeto({ fecharmodal }) {
  const navegar = useNavigate();

  const servidor = sessionStorage.getItem("servidor");
  const [listaProjetos, setListaProjetos] = useState([]);

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

  return <>
    <div id="modalNovoProjeto">
      <button onClick={fecharmodal}> Fechar </button>

      <p>{JSON.stringify(listaProjetos)}</p>
      <GaleriaVertical itens={listaProjetos} />


      <button onClick={() => { navegar('/principal') }}> Abrir </button>
    </div>
  </>
}

export default ModalEntrarProjeto;
