// Header.jsx
import React, { useState } from 'react';
import './Header.css';
import { useNavigate } from "react-router-dom";
import { FaSquare, FaDrawPolygon, FaMousePointer, FaSave, FaEye, FaHome, FaExpand, FaCompress } from 'react-icons/fa';

const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon',
  SELECTION: 'selection'
};

const Header = ({ mode, setMode, currentPoints, setIsDrawing, setCurrentPoints, scale, resetView }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <div className="logo-container">
              <img src="/themarker_logo.svg" alt="TheMarker Logo" className="logo" />
              <div className="logo-glow"></div>
            </div>
            <div className="app-title">
              <span className="app-title-main">THE MARKER</span>
            </div>
          </div>

          {/* Centro: seletor de modos de desenho */}
          <div className="header-center">
            <div className="mode-selector">
              <button 
                className={`mode-button ${mode === MODES.SELECTION ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.SELECTION)}
                title="Modo Seleção"
              >
                <div className="mode-button-content">
                  <FaMousePointer className="mode-icon" />
                  <span>Seleção</span>
                </div>
              </button>
              <button 
                className={`mode-button ${mode === MODES.SQUARE ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.SQUARE)}
                title="Modo Quadrado"
              >
                <div className="mode-button-content">
                  <FaSquare className="mode-icon" />
                  <span>Quadrado</span>
                </div>
              </button>
              <button 
                className={`mode-button ${mode === MODES.POLYGON ? 'active' : ''}`}
                onClick={() => handleModeChange(MODES.POLYGON)}
                title="Modo Polígono"
              >
                <div className="mode-button-content">
                  <FaDrawPolygon className="mode-icon" />
                  <span>Polígono</span>
                </div>
              </button>
            </div>
          </div>

          {/* Lado direito: ações e controles de zoom */}
          <div className="header-right">
            <div className="zoom-controls">
              <div className="zoom-display">
                <span className="zoom-label">Zoom</span>
                <span className="zoom-level">{Math.round(scale * 100)}%</span>
              </div>
              <button 
                className="zoom-button" 
                onClick={resetView}
                title="Resetar Zoom"
              >
                {scale === 1 ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
            
            <div className="action-buttons">
              <button 
                className="action-button preview-button" 
                onClick={handlePreviewMode}
                title="Modo Previsão"
              >
                <FaEye className="action-icon" />
              </button>
              <button 
                className="action-button save-button" 
                onClick={handleSave}
                title="Salvar"
              >
                <FaSave className="action-icon" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu lateral (drawer) */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="menu-title">
            <h2>Navegação</h2>
            <span className="menu-subtitle">The Marker</span>
          </div>
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
            <div className="menu-item-content">
              <FaHome className="menu-icon" />
              <span>Fechar Projeto</span>
            </div>
            <div className="menu-item-arrow">→</div>
          </button>
        </div>

        <div className="menu-footer">
          <div className="version-info">
            v1.0.0 • The Marker
          </div>
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