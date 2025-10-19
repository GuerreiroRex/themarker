import React, { useState } from 'react';
import './Header.css';
import { useNavigate } from "react-router-dom";
import { FaSquare, FaDrawPolygon, FaMousePointer, FaSave, FaEye, FaHome } from 'react-icons/fa';

// Definição dos modos de desenho disponíveis
const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon',
  SELECTION: 'selection'
};

const Header = ({
  mode,
  setMode,
  currentPoints,
  setIsDrawing,
  setCurrentPoints,
  scale,
  resetView
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Altera o modo de desenho e reseta o estado atual
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const handleCloseProject = () => {
    navigate(`/`);
  };

  const handleSave = () => {
    alert('Funcionalidade de salvar não implementada');
  };

  const handlePreviewMode = () => {
    alert('Funcionalidade de modo preview não implementada');
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Lado esquerdo: logo e menu hamburguer */}
          <div className="header-left">
            <button
              className="hamburger-button"
              onClick={() => setIsMenuOpen(true)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <img
              src="/themarker_logo.svg"
              alt="TheMarker Logo"
              className="logo"
            />
          </div>

          {/* Centro: seletor de modos de desenho */}
          <div className="header-center">
            <div className="mode-selector">
              <button
                className={`mode-button ${mode === MODES.SELECTION ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.SELECTION)}
                title="Modo Seleção"
              >
                <FaMousePointer size={18} />
              </button>
              <button
                className={`mode-button ${mode === MODES.SQUARE ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.SQUARE)}
                title="Modo Quadrado"
              >
                <FaSquare size={18} />
              </button>
              <button
                className={`mode-button ${mode === MODES.POLYGON ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.POLYGON)}
                title="Modo Polígono"
              >
                <FaDrawPolygon size={18} />
              </button>
            </div>
          </div>

          {/* Lado direito: ações e controles de zoom */}
          <div className="header-right">
            <div className="action-buttons">
              <button
                className="action-button preview-button"
                onClick={handlePreviewMode}
                title="Modo Previsão"
              >
                <FaEye size={16} />
              </button>
              <button
                className="action-button save-button"
                onClick={handleSave}
                title="Salvar"
              >
                <FaSave size={16} />
              </button>
            </div>
            <div className="zoom-controls">
              <span className="zoom-level">Zoom: {Math.round(scale * 100)}%</span>
              <button
                className="zoom-button"
                onClick={resetView}
              >
                Resetar Zoom
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu lateral (drawer) */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h2>Menu</h2>
          <button
            className="close-menu-button"
            onClick={() => setIsMenuOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="menu-content">
          <button
            className="menu-item close-project-button"
            onClick={handleCloseProject}
          >
            <FaHome style={{ marginRight: '8px' }} />
            Fechar Projeto
          </button>
        </div>
      </div>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Header;