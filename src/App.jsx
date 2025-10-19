import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Menu from "./telas/menu/App.jsx";
import Config from "./telas/configuracoes/App.jsx";
import Principal from "./telas/principal/App.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/settings" element={<Config />} />
        <Route path="/principal/:id" element={<Principal />} />
      </Routes>
    </Router>
  );
}

export default App;
