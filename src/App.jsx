import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Menu from "./telas/menu/App.jsx";
import Config from "./telas/configuracoes/App.jsx";
import Principal from "./telas/principal/App.jsx";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/settings" element={<Config />} />
        <Route path="/principal" element={<Principal />} />
      </Routes>
    </Router>
  );
}

export default App;
