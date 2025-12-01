import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import { useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import Shape from './components/Shape';
import CurrentShape from './components/CurrentShape';
import Header from './components/Header';
import './App.css';

import { useLocation } from "react-router-dom";

const MODES = {
  SELECTION: 'selection',
  SQUARE: 'square',
  POLYGON: 'polygon',
};

const App = ({ id }) => {
  const [mode, setMode] = useState(MODES.SELECTION);
  const [shapes, setShapes] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    shapeId: null,
    pointIndex: null
  });

  const stageRef = useRef();
  const containerRef = useRef();
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight - 80 });
  const [currentImage, setCurrentImage] = useState(null);
  const [currentImageBase64, setCurrentImageBase64] = useState(null); // Novo estado para armazenar a base64 da imagem original

  // Efeito para carregar a imagem padrão do gato
  // useEffect(() => {
  //   const img = new window.Image();
  //   img.src = '/gato.jpg';
  //   img.onload = () => {
  //     setCurrentImage(img);
  //     // Converter a imagem padrão para base64
  //     convertImageToBase64(img.src, (base64) => {
  //       setCurrentImageBase64(base64);
  //     });
  //   };
  //   img.onerror = (err) => {
  //     console.error('Erro ao carregar /gato.jpg', err);
  //   };
  // }, []);

  // Função para converter imagem em base64
  const convertImageToBase64 = (src, callback) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      callback(dataURL.split(',')[1]); // Remove o prefixo data:image/png;base64,
    };
    img.src = src;
  };

  const location = useLocation();

  // Função para lidar com a seleção de imagem do Header
  const handleImageSelect = useCallback((selectedImage) => {
    if (selectedImage && selectedImage.base64) {
      const img = new window.Image();
      img.onload = () => {
        setCurrentImage(img);
        setCurrentImageBase64(selectedImage.base64); // Armazena a base64 da imagem selecionada
        // Resetar a visualização quando uma nova imagem é carregada
        setScale(1);
        setStagePos({ x: 0, y: 0 });
        setShapes([]); // Opcional: limpar as formas ao mudar de imagem
      };
      img.src = `data:image/png;base64,${selectedImage.base64}`;
      console.log('Imagem selecionada:', selectedImage.caminho);
    }
  }, []);

  // Efeito para invocar a função Rust quando o componente monta
  useEffect(() => {
    const initializeImage = async () => {
      console.log("Inicializando imagem com ID:", id);

      try {
        if (id) {
          await invoke('api_imagem_start', { nome: id });
          console.log(`Função api_imagem_start invocada com projeto: ${id}`);
        } else {
          console.warn('ID do projeto não encontrado na URL');
        }
      } catch (error) {
        console.error('Erro ao invocar api_imagem_start:', error);
      }
    };

    console.log("Efeito de inicialização disparado para ID:", id);
    initializeImage();

  }, [location.pathname, id]);

  // Restante dos useEffects existentes...
  useEffect(() => {
    const updateStageSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateStageSize();
    window.addEventListener('resize', updateStageSize);
    return () => window.removeEventListener('resize', updateStageSize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (stageRef.current) {
        const pos = stageRef.current.getPointerPosition();
        if (pos) setMousePos(pos);
      }
    };
    const stage = stageRef.current;
    if (stage) stage.on('mousemove', handleMouseMove);
    return () => {
      if (stage) stage.off('mousemove', handleMouseMove);
    };
  }, []);

  // Função para converter o resultado do script Python em pontos e criar um polígono
  const createPolygonFromPythonResult = (result) => {
    try {
      // Converter a string do resultado em um array de números
      const pointsArray = Array.isArray(result) ? result : JSON.parse(result);

      // Converter array de números [x1, y1, x2, y2, ...] em array de objetos {x, y}
      const polygonPoints = [];
      for (let i = 0; i < pointsArray.length; i += 2) {
        if (i + 1 < pointsArray.length) {
          polygonPoints.push({
            x: pointsArray[i],
            y: pointsArray[i + 1]
          });
        }
      }

      // Criar o novo shape do tipo polígono
      const newShape = {
        type: 'polygon',
        points: polygonPoints,
        id: `python-polygon-${Date.now()}`,
        name: `Polígono Inferido`
      };

      // Adicionar à lista de shapes
      setShapes(prevShapes => [...prevShapes, newShape]);

      console.log('Polígono criado a partir do resultado Python:', newShape);
      return true;
    } catch (error) {
      console.error('Erro ao criar polígono a partir do resultado Python:', error);
      return false;
    }
  };

  const handlePreviewMode = async () => {
    if (!currentImage) {
      // alert('Nenhuma imagem carregada para executar o script Python');
      return;
    }

    // Filtrar apenas as formas do tipo quadrado
    const squares = shapes.filter(shape => shape.type === 'square');

    if (squares.length === 0) {
      // alert('Nenhum quadrado encontrado para executar o script Python');
      return;
    }

    try {
      // Usar a imagem base64 original em vez de fazer print do stage
      if (!currentImageBase64) {
        // alert('Imagem base64 não disponível');
        return;
      }

      // Salvar a imagem temporária usando a base64 original
      try {
        await invoke('salvar_imagem_temp', { imageBase64: currentImageBase64 });
      } catch (error) {
        console.error('Erro ao salvar imagem temporária:', error);
        // alert('Erro ao salvar imagem temporária: ' + error);
        return;
      }

      // Executar o script Python para cada quadrado
      for (const square of squares) {
        try {

          console.log(`Executando script para quadrado ${square.name}... {}`, square.points);
          // Pegar ponto A (index 0) e ponto C (index 2)
          const pointA = square.points[0]; 
          // const pointD = square.points[3]; 
          const pointD = square.points[2];

          // Formatar como "x1,y1,x4,y4" (A e D)
          const pointsString = `${pointA.x},${pointA.y},${pointD.x},${pointD.y}`;

          console.log(`Executando script para quadrado ${square.name}:`, pointsString);
          console.log(`Ponto A (top-left):`, pointA);
          console.log(`Ponto D (bottom-left):`, pointD);

          // Chamar a função Rust apenas com os pontos
          const result = await invoke('executar_script_python', {
            points: pointsString
          });

          console.log(`Resultado para ${square.name}:`, result);

          // Criar polígono a partir do resultado
          const success = createPolygonFromPythonResult(result);
          if (success) {
            console.log(`Polígono criado com sucesso para ${square.name}`);
          } else {
            console.error(`Falha ao criar polígono para ${square.name}`);
          }

        } catch (error) {
          console.error(`Erro ao executar script para ${square.name}:`, error);
          // alert(`Erro ao executar script para ${square.name}: ${error}`);
        }
      }

      // alert('Script Python executado para todos os quadrados! Polígonos criados a partir dos resultados.');

    } catch (error) {
      console.error('Erro geral ao executar preview:', error);
      // alert('Erro ao executar preview: ' + error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && !e.target.closest('.context-menu')) {
        setContextMenu({ visible: false, x: 0, y: 0, shapeId: null, pointIndex: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const renderGrid = useCallback(() => {
    const gridSize = 50;
    const gridLines = [];

    const visibleWidth = stageSize.width / scale;
    const visibleHeight = stageSize.height / scale;
    const visibleWorldCenterX = -stagePos.x / scale;
    const visibleWorldCenterY = -stagePos.y / scale;

    const visibleWorldLeft = visibleWorldCenterX - (2 * visibleWidth);
    const visibleWorldTop = visibleWorldCenterY - (2 * visibleHeight);
    const visibleWorldRight = visibleWorldCenterX + (2 * visibleWidth);
    const visibleWorldBottom = visibleWorldCenterY + (2 * visibleHeight);

    const startX = Math.floor(visibleWorldLeft / gridSize) * gridSize;
    const endX = Math.ceil(visibleWorldRight / gridSize) * gridSize;
    const startY = Math.floor(visibleWorldTop / gridSize) * gridSize;
    const endY = Math.ceil(visibleWorldBottom / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, visibleWorldTop, x, visibleWorldBottom]}
          stroke="#e0e0e0"
          strokeWidth={1 / Math.max(scale, 0.1)}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[visibleWorldLeft, y, visibleWorldRight, y]}
          stroke="#e0e0e0"
          strokeWidth={1 / Math.max(scale, 0.1)}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    return gridLines;
  }, [stageSize, scale, stagePos]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    const clampedScale = Math.min(Math.max(newScale, 0.01), 100);

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setScale(clampedScale);
    setStagePos(newPos);
  };

  const handleStageClick = (e) => {
    if (e.evt.button !== 0) return;

    if (isDraggingPoint) return;

    if (e.target !== e.target.getStage() && !isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const adjustedPos = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale
    };

    if (mode === MODES.SQUARE) {
      if (currentPoints.length === 0) {
        setCurrentPoints([adjustedPos]);
        setIsDrawing(true);
      } else {
        const start = currentPoints[0];
        const end = adjustedPos;

        // CORREÇÃO: Ordem correta dos pontos do quadrado
        // A (superior esquerdo), B (superior direito), C (inferior direito), D (inferior esquerdo)
        const squarePoints = [
          { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) }, // A - superior esquerdo
          { x: Math.max(start.x, end.x), y: Math.min(start.y, end.y) }, // B - superior direito  
          { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) }, // C - inferior direito
          { x: Math.min(start.x, end.x), y: Math.max(start.y, end.y) }  // D - inferior esquerdo
        ];

        setShapes(prevShapes => [...prevShapes, {
          type: 'square',
          points: squarePoints,
          id: `shape-${Date.now()}`,
          name: `Quadrado ${prevShapes.filter(s => s.type === 'square').length + 1}`
        }]);
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } else if (mode === MODES.POLYGON) {
      if (currentPoints.length === 0) {
        setCurrentPoints([adjustedPos]);
        setIsDrawing(true);
      } else {
        const firstPoint = currentPoints[0];
        const distance = Math.sqrt(
          Math.pow(adjustedPos.x - firstPoint.x, 2) +
          Math.pow(adjustedPos.y - firstPoint.y, 2)
        );

        if (distance < 15 / scale && currentPoints.length >= 3) {
          setShapes(prevShapes => [...prevShapes, {
            type: 'polygon',
            points: currentPoints,
            id: `shape-${Date.now()}`,
            name: `Polígono ${prevShapes.filter(s => s.type === 'polygon').length + 1}`
          }]);
          setCurrentPoints([]);
          setIsDrawing(false);
        } else {
          setCurrentPoints([...currentPoints, adjustedPos]);
        }
      }
    }
  };

  const handleStageContextMenu = (e) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (e.target === e.target.getStage()) {
      setContextMenu({
        visible: true,
        x: pos.x,
        y: pos.y,
        shapeId: null,
        pointIndex: null
      });
    }
  };

  const handleShapeDragMove = (shapeId, newPoints) => {
    setShapes(prevShapes => prevShapes.map(shape =>
      shape.id === shapeId
        ? { ...shape, points: newPoints }
        : shape
    ));
  };

  const handlePointDragMove = (shapeId, pointIndex, newPos) => {
    setShapes(prevShapes => prevShapes.map(shape => {
      if (shape.id !== shapeId) return shape;

      // Se for um quadrado com 4 pontos, manter a forma quadrada
      if (shape.type === 'square' && shape.points.length === 4) {
        return maintainSquareShape(shape, pointIndex, newPos);
      }

      // Para polígonos ou quadrados com mais de 4 pontos, comportamento normal
      return {
        ...shape,
        points: shape.points.map((p, i) =>
          i === pointIndex ? { x: newPos.x, y: newPos.y } : p
        )
      };
    }));
  };

  // Função para manter a forma quadrada ao mover pontos
  const maintainSquareShape = (shape, draggedPointIndex, newPos) => {
    const points = [...shape.points];

    // A = points[0], B = points[1], C = points[2], D = points[3]
    const [A, B, C, D] = points;

    switch (draggedPointIndex) {
      case 0: // Ponto A (top-left)
        points[0] = newPos;
        // B deve ter o Y de A e X de D (C)
        points[1] = { x: B.x, y: newPos.y };
        // D deve ter o X de A e Y de D (C)
        points[3] = { x: newPos.x, y: D.y };
        // C deve ter o X de B e Y de D
        points[2] = { x: B.x, y: D.y };
        break;

      case 1: // Ponto B (top-right)
        points[1] = newPos;
        // A deve ter o Y de B
        points[0] = { x: A.x, y: newPos.y };
        // C deve ter o X de B e Y de C
        points[2] = { x: newPos.x, y: C.y };
        // D deve ter o X de A e Y de C
        points[3] = { x: A.x, y: C.y };
        break;

      case 2: // Ponto C (bottom-right)
        points[2] = newPos;
        // B deve ter o X de C
        points[1] = { x: newPos.x, y: B.y };
        // D deve ter o Y de C
        points[3] = { x: D.x, y: newPos.y };
        // A deve ter o X de D e Y de B
        points[0] = { x: D.x, y: B.y };
        break;

      case 3: // Ponto D (bottom-left)
        points[3] = newPos;
        // A deve ter o X de D
        points[0] = { x: newPos.x, y: A.y };
        // C deve ter o Y de D
        points[2] = { x: C.x, y: newPos.y };
        // B deve ter o X de C e Y de A
        points[1] = { x: C.x, y: A.y };
        break;

      default:
        points[draggedPointIndex] = newPos;
        break;
    }

    return { ...shape, points };
  };

  const addPointOnLine = (shapeId, lineIndex, pos) => {
    setShapes(prevShapes => prevShapes.map(shape => {
      if (shape.id !== shapeId) return shape;

      const newPoints = [
        ...shape.points.slice(0, lineIndex + 1),
        pos,
        ...shape.points.slice(lineIndex + 1)
      ];

      // Se era um quadrado e agora tem 5+ pontos, converter para polígono
      let newType = shape.type;
      let newName = shape.name;

      if (shape.type === 'square' && newPoints.length >= 5) {
        newType = 'polygon';
        // Atualiza o nome para refletir a conversão
        const polyCount = prevShapes.filter(s => s.type === 'polygon').length + 1;
        newName = `Polígono ${polyCount}`;
      }

      return {
        ...shape,
        type: newType,
        name: newName,
        points: newPoints
      };
    }));
  };

  const handleDeleteShape = (shapeId) => {
    setShapes(prevShapes => prevShapes.filter(shape => shape.id !== shapeId));
    setContextMenu({ visible: false, x: 0, y: 0, shapeId: null, pointIndex: null });
  };

  const handleDeletePoint = (shapeId, pointIndex) => {
    setShapes(prevShapes => prevShapes.map(shape => {
      if (shape.id !== shapeId) return shape;

      const newPoints = shape.points.filter((_, index) => index !== pointIndex);

      const minPoints = shape.type === 'square' ? 4 : 3;
      if (newPoints.length < minPoints) {
        return null;
      }

      return { ...shape, points: newPoints };
    }).filter(Boolean));
    setContextMenu({ visible: false, x: 0, y: 0, shapeId: null, pointIndex: null });
  };

  const handleContextMenu = (shapeId, pointIndex = null, x, y) => {
    setContextMenu({
      visible: true,
      x: x,
      y: y,
      shapeId: shapeId,
      pointIndex: pointIndex
    });
  };

  const resetView = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleStageDragEnd = (e) => {
    setStagePos(e.target.position());
  };

  const handlePointDragStart = () => setIsDraggingPoint(true);
  const handlePointDragEnd = () => setIsDraggingPoint(false);

  // Função para gerar o COCO Dataset e salvar via dialog
  const generateAndSaveCocoDataset = async () => {
    if (!currentImage || !currentImageBase64) {
      // alert('Nenhuma imagem carregada para gerar o COCO Dataset');
      return;
    }

    // Informações básicas do COCO
    const cocoDataset = {
      info: {
        description: "Dataset gerado pelo The Marker",
        url: "",
        version: "1.0",
        year: new Date().getFullYear(),
        contributor: "The Marker",
        date_created: new Date().toISOString().split('T')[0]
      },
      licenses: [
        {
          url: "",
          id: 1,
          name: "Unknown"
        }
      ],
      images: [
        {
          id: 1,
          width: currentImage.width,
          height: currentImage.height,
          file_name: "annotated_image.jpg",
          license: 1,
          flickr_url: "",
          coco_url: "",
          date_captured: new Date().toISOString()
        }
      ],
      annotations: [],
      categories: [
        {
          id: 1,
          name: "object",
          supercategory: "none"
        }
      ]
    };

    // Converter shapes para annotations COCO
    shapes.forEach((shape, index) => {
      // Calcular bbox [x, y, width, height]
      const xs = shape.points.map(p => Math.max(0, p.x));
      const ys = shape.points.map(p => Math.max(0, p.y));
      const xmin = Math.min(...xs);
      const ymin = Math.min(...ys);
      const xmax = Math.max(...xs);
      const ymax = Math.max(...ys);

      // Garantir que as coordenadas não ultrapassem os limites da imagem
      const bbox = [
        Math.max(0, xmin),
        Math.max(0, ymin),
        Math.min(currentImage.width - xmin, xmax - xmin),
        Math.min(currentImage.height - ymin, ymax - ymin)
      ];

      // Calcular área
      const area = (xmax - xmin) * (ymax - ymin);

      // Converter pontos para segmentation COCO (formato flat array)
      const segmentation = [shape.points.flatMap(p => [
        Math.max(0, Math.min(p.x, currentImage.width)),
        Math.max(0, Math.min(p.y, currentImage.height))
      ])];

      const annotation = {
        id: index + 1,
        image_id: 1,
        category_id: 1,
        segmentation: segmentation,
        area: area,
        bbox: bbox,
        iscrowd: 0
      };

      cocoDataset.annotations.push(annotation);
    });

    const jsonString = JSON.stringify(cocoDataset, null, 2);

    try {
      // Abrir diálogo para salvar arquivo
      const filePath = await save({
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (filePath) {
        // Salvar o JSON do COCO Dataset
        await invoke('api_imagem_salvar', { caminho: filePath, conteudo: jsonString });

        // Salvar a imagem original separadamente (opcional)
        const imagePath = filePath.replace('.json', '_image.png');
        await invoke('salvar_imagem_base64', {
          caminho: imagePath,
          imageBase64: currentImageBase64
        });

        // alert('Arquivo COCO Dataset salvo com sucesso! A imagem original foi preservada.');
      }
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      // alert('Erro ao salvar arquivo: ' + error);
    }
  };

  const stageElement = useMemo(() => (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      onMouseDown={handleStageClick}
      onWheel={handleWheel}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
      ref={stageRef}
      draggable={!isDraggingPoint}
      onDragEnd={handleStageDragEnd}
      onContextMenu={handleStageContextMenu}
    >
      <Layer listening={false}>
        {renderGrid()}
      </Layer>

      <Layer>
        {currentImage && (
          <KonvaImage
            image={currentImage}
            x={0}
            y={0}
            listening={false}
            perfectDrawEnabled={false}
          />
        )}

        {shapes.map(shape => (
          <Shape
            key={shape.id}
            shape={shape}
            onShapeDragMove={handleShapeDragMove}
            onPointDragMove={handlePointDragMove}
            onAddPointOnLine={addPointOnLine}
            onContextMenu={handleContextMenu}
            onPointDragStart={handlePointDragStart}
            onPointDragEnd={handlePointDragEnd}
            scale={scale}
            stagePos={stagePos}
          />
        ))}

        <CurrentShape
          mode={mode}
          currentPoints={currentPoints}
          mousePos={mousePos}
          isDrawing={isDrawing}
          scale={scale}
          stagePos={stagePos}
        />
      </Layer>
    </Stage>
  ), [
    stageSize, scale, stagePos, isDraggingPoint, shapes, currentPoints,
    mousePos, isDrawing, currentImage, renderGrid
  ]);

  return (
    <div className="principal">
      <Header
        mode={mode}
        setMode={setMode}
        currentPoints={currentPoints}
        setIsDrawing={setIsDrawing}
        setCurrentPoints={setCurrentPoints}
        scale={scale}
        resetView={resetView}
        onImageSelect={handleImageSelect}
        onSave={generateAndSaveCocoDataset}
        onPreview={handlePreviewMode}
      />
      <div className="app-content">
        <div className="stage-container allow-right-click" ref={containerRef}>
          {stageElement}
        </div>

        {contextMenu.visible && (
          <div
            className="context-menu allow-right-click"
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 1000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-content">
              {contextMenu.pointIndex !== null ? (
                <>
                  <button
                    onClick={() => handleDeletePoint(contextMenu.shapeId, contextMenu.pointIndex)}
                    className="context-menu-item delete"
                  >
                    🗑️ Apagar Ponto
                  </button>
                  <button
                    onClick={() => handleDeleteShape(contextMenu.shapeId)}
                    className="context-menu-item delete"
                  >
                    🗑️ Apagar Figura Inteira
                  </button>
                </>
              ) : contextMenu.shapeId ? (
                <button
                  onClick={() => handleDeleteShape(contextMenu.shapeId)}
                  className="context-menu-item delete"
                >
                  🗑️ Apagar Figura
                </button>
              ) : (
                <div className="context-menu-section">
                  <div className="context-menu-title">Ações Gerais</div>
                  <button
                    onClick={resetView}
                    className="context-menu-item"
                  >
                    🔄 Resetar Visualização
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPoints([]);
                      setIsDrawing(false);
                    }}
                    className="context-menu-item"
                  >
                    ✋ Cancelar Desenho Atual
                  </button>
                </div>
              )}
              <button
                onClick={() => setContextMenu({ visible: false, x: 0, y: 0, shapeId: null, pointIndex: null })}
                className="context-menu-item cancel"
              >
                ✕ Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .principal {
          width: 100%;
          height: 100vh;
          background-color: #353535;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .app-content {
          flex: 1;
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .stage-container {
          background-color: #2a2a2a;
          border-radius: 8px;
          border: 1px solid #444;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .stage-container.allow-right-click {
          cursor: default;
        }

        .context-menu {
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          min-width: 200px;
        }

        .context-menu-content {
          display: flex;
          flex-direction: column;
          padding: 4px;
        }

        .context-menu-section {
          display: flex;
          flex-direction: column;
        }

        .context-menu-title {
          padding: 6px 12px;
          font-size: 12px;
          color: #ffc74b;
          font-weight: bold;
          border-bottom: 1px solid #444;
          margin-bottom: 4px;
        }

        .context-menu-item {
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          border-radius: 4px;
          margin: 2px 0;
          font-size: 14px;
          color: white;
          font-family: "Atimo", sans-serif;
          transition: background-color 0.2s;
        }

        .context-menu-item:hover {
          background: #444;
        }

        .context-menu-item.delete {
          color: #ff6b6b;
        }

        .context-menu-item.delete:hover {
          background: rgba(255, 107, 107, 0.1);
        }

        .context-menu-item.cancel {
          color: #888;
          border-top: 1px solid #444;
          margin-top: 4px;
          padding-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default App;