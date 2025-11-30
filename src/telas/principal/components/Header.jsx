// Header.jsx
import React, { useState, useEffect } from 'react';
import './Header.css';
import { useNavigate } from "react-router-dom";
import { FaSquare, FaDrawPolygon, FaMousePointer, FaSave, FaEye, FaHome, FaExpand, FaCompress, FaImage, FaTrash } from 'react-icons/fa';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

const MODES = {
  SELECTION: 'selection',
  SQUARE: 'square',
  POLYGON: 'polygon',
};

const Header = ({ mode, setMode, currentPoints, setIsDrawing, setCurrentPoints, scale, resetView, onImageSelect }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const imagesPerPage = 10;

  // Function to create image via API
  const createImage = async (caminho, base64, thumbnail = '') => {
    try {
      await invoke('api_imagem_criar', {
        caminho: caminho,
        base64: base64
      });
      return true;
    } catch (error) {
      console.error('Erro ao criar imagem:', error);
      return false;
    }
  };

  // Function to load images for current page
  const loadImages = async (page = 1) => {
    try {
      const imagesData = await invoke('api_imagem_ler_todas', {
        pagina: page
      });
      setImages(imagesData || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      setImages([]);
    }
  };

  // Function to get total image count
  const getTotalImagesCount = async () => {
    try {
      const count = await invoke('api_imagem_contar_total');
      setTotalImages(count || 0);
    } catch (error) {
      console.error('Erro ao contar imagens:', error);
      setTotalImages(0);
    }
  };

  // Load images when page changes
  useEffect(() => {
    loadImages(currentPage);
    getTotalImagesCount();
  }, [isMenuOpen]);

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle image deletion
  const handleDeleteImage = async (id) => {
    try {
      await invoke('api_imagem_apagar', { id: id });
      // Reload current page after deletion
      loadImages(currentPage);
      getTotalImagesCount();
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      alert('Erro ao deletar imagem');
    }
  };

  // Handle image selection
  const handleImageClick = (image) => {
    if (onImageSelect) {
      onImageSelect(image);
    }
    setIsMenuOpen(false); // Fecha o menu após selecionar
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const handleCloseProject = async () => {
      navigate(`/`);
  };

  const handleSave = () => {
    alert('Funcionalidade de salvar não implementada');
  };

  const handlePreviewMode = () => {
    alert('Funcionalidade de modo preview não implementada');
  };

  // Enhanced function to add image
  const handleAddImage = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'webp']
        }]
      });
      
      if (selected) {
        const selectedFiles = Array.isArray(selected) ? selected : [selected];
        console.log('Arquivos selecionados:', selectedFiles);
        
        try {
          // Use the Rust command to process multiple images
          const processedImages = await invoke('process_multiple_images', {
            filePaths: selectedFiles
          });
          
          console.log('Imagens processadas pelo backend:', processedImages);
          
          // Store each processed image in the database
          let successCount = 0;
          for (const imageResult of processedImages) {
            const success = await createImage(
              imageResult.file_path, 
              imageResult.base64, 
              imageResult.thumbnail
            );
            if (success) {
              successCount++;
              console.log(`Imagem ${imageResult.file_path} criada com sucesso`);
            }
          }
          
          // Reload images after adding new ones
          loadImages(currentPage);
          getTotalImagesCount();
          alert(`${successCount} imagem(ns) adicionada(s) com sucesso!`);
          
        } catch (processingError) {
          console.error('Erro ao processar imagens no backend:', processingError);
          alert('Erro ao processar imagens no backend');
        }
      }
    } catch (error) {
      console.error('Erro ao abrir diálogo de imagem:', error);
      alert('Erro ao selecionar imagens');
    } finally {
      setIsMenuOpen(false);
    }
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalImages / imagesPerPage);

  // Function to get file name from path
  const getFileName = (path) => {
    return path ? path.split(/[\\/]/).pop() : 'Imagem';
  };

  // Function to get thumbnail source
  const getThumbnailSrc = (image) => {
    // Primeiro tenta usar a thumbnail, depois fallback para base64 completo
    if (image.thumbnail) {
      return `data:image/png;base64,${image.thumbnail}`;
    } else if (image.base64) {
      // Se não há thumbnail, usa os primeiros caracteres do base64 como fallback
      const shortBase64 = image.base64.length > 2000 ? image.base64.substring(0, 2000) : image.base64;
      return `data:image/png;base64,${shortBase64}`;
    }
    return null;
  };

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Left side: logo and hamburger menu */}
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

          {/* Center: drawing mode selector */}
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

          {/* Right side: actions and zoom controls */}
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

      {/* Side menu (drawer) */}
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

          {/* Add Image Button */}
          <button 
            className="menu-item add-image-button" 
            onClick={handleAddImage}
          >
            <div className="menu-item-content">
              <FaImage className="menu-icon" />
              <span>Adicionar Imagem</span>
            </div>
            <div className="menu-item-arrow">→</div>
          </button>

          {/* Images List */}
          <div className="images-section">
            <h3 className="images-title">Imagens ({totalImages})</h3>
            <div className="images-list">
              {images.length === 0 ? (
                <p className="no-images">Nenhuma imagem cadastrada</p>
              ) : (
                images.map((image) => {
                  const thumbnailSrc = getThumbnailSrc(image);
                  return (
                    <div 
                      key={image.id} 
                      className="image-item clickable"
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="image-preview">
                        {thumbnailSrc ? (
                          <img 
                            src={thumbnailSrc}
                            alt="Preview"
                            className="thumbnail-image"
                            onError={(e) => {
                              // Fallback para placeholder se a imagem falhar
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="thumbnail-placeholder">
                          <FaImage />
                        </div>
                      </div>
                      <div className="image-info">
                        <span className="image-name">
                          {getFileName(image.caminho)}
                        </span>
                        <span className="image-id">ID: {image.id?.substring(0, 8) || 'N/A'}...</span>
                      </div>
                      <button 
                        className="delete-image-button"
                        onClick={(e) => {
                          e.stopPropagation(); // Impede que o clique propague para o image-item
                          handleDeleteImage(image.id);
                        }}
                        title="Deletar imagem"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <Stack spacing={2}>
                  <Pagination 
                    count={totalPages} 
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="small"
                  />
                </Stack>
                <div className="pagination-info">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="menu-footer">
          <div className="version-info">
            v1.0.0 • The Marker
          </div>
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
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