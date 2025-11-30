import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Menu from "./telas/menu/App.jsx";
import Config from "./telas/configuracoes/App.jsx";
import Principal from "./telas/principal/App.jsx";
import "./App.css";


import { useParams } from 'react-router-dom';

function App() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Permite clique direito apenas em elementos com a classe allow-right-click
      const allowRightClick = e.target.closest('.allow-right-click');

      if (!allowRightClick) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Adiciona o event listener com capture para pegar todos os eventos
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  // Wrapper component para o Principal
  const PrincipalWrapper = () => {
    const { id } = useParams(); // Obtém o ID da URL

    let chave = Date.now();

    return <Principal key={chave} id={id} />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/settings" element={<Config />} />
        {/* <Route path="/principal/:id" element={<Principal />} key={1} /> */}
         <Route path="/principal/:id" element={<PrincipalWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;