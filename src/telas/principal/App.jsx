// App.js
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import Shape from './components/Shape';
import CurrentShape from './components/CurrentShape';
import Header from './components/Header';
import './App.css';

// Definição dos modos de desenho disponíveis
const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon'
};

const App = () => {
  // Estado para controlar o modo de desenho atual
  const [mode, setMode] = useState(MODES.SQUARE);
  // Estado para armazenar todas as formas desenhadas
  const [shapes, setShapes] = useState([]);
  // Estado para os pontos da forma que está sendo desenhada atualmente
  const [currentPoints, setCurrentPoints] = useState([]);
  // Estado para controlar se está no modo de desenho
  const [isDrawing, setIsDrawing] = useState(false);
  // Estado para a posição atual do mouse
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  // Estado para o nível de zoom/scale
  const [scale, setScale] = useState(1);
  // Estado para a posição do stage (pan)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  // Estado para controlar se um ponto está sendo arrastado
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);

  // Refs para acessar o stage e container diretamente
  const stageRef = useRef();
  const containerRef = useRef();

  // Estado para o tamanho do stage, ajustado dinamicamente
  const [stageSize, setStageSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight - 80 
  });

  // Estado para armazenar a imagem do gato carregada
  const [catImage, setCatImage] = useState(null);

  // Efeito para carregar a imagem do gato (executa uma vez)
  useEffect(() => {
    const img = new window.Image();
    img.src = '/gato.jpg'; // coloque gato.jpg em public/ ou altere para import se preferir
    img.onload = () => setCatImage(img);
    img.onerror = (err) => {
      // opcional: log de erro se a imagem não carregar
      console.error('Erro ao carregar /gato.jpg', err);
    };

    return () => {
      // limpa referência (opcional)
      // setCatImage(null);
    };
  }, []);

  // Efeito para atualizar o tamanho do stage quando a janela é redimensionada
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

  // Efeito para rastrear a posição do mouse no stage
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

  // Função para renderizar o grid de fundo (memoizada para performance)
  const renderGrid = useCallback(() => {
    const gridSize = 50;
    const gridLines = [];
    
    // Calcula a área visível atual considerando zoom e pan
    const visibleWidth = stageSize.width / scale;
    const visibleHeight = stageSize.height / scale;
    const visibleWorldCenterX = -stagePos.x / scale;
    const visibleWorldCenterY = -stagePos.y / scale;
    
    // Expande a área visível para 2x em cada direção para grid contínuo
    const visibleWorldLeft = visibleWorldCenterX - (2 * visibleWidth);
    const visibleWorldTop = visibleWorldCenterY - (2 * visibleHeight);
    const visibleWorldRight = visibleWorldCenterX + (2 * visibleWidth);
    const visibleWorldBottom = visibleWorldCenterY + (2 * visibleHeight);

    // Calcula os limites do grid baseado na área visível expandida
    const startX = Math.floor(visibleWorldLeft / gridSize) * gridSize;
    const endX = Math.ceil(visibleWorldRight / gridSize) * gridSize;
    const startY = Math.floor(visibleWorldTop / gridSize) * gridSize;
    const endY = Math.ceil(visibleWorldBottom / gridSize) * gridSize;

    // Linhas verticais do grid
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

    // Linhas horizontais do grid
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

  // Manipula o zoom com a roda do mouse
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scale;
    const newScale = e.evt.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    
    // Limita o zoom entre 1% e 10000%
    const clampedScale = Math.min(Math.max(newScale, 0.01), 100);

    // Calcula a posição do mouse relativa ao mundo
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    // Calcula nova posição para manter o zoom no ponto do mouse
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setScale(clampedScale);
    setStagePos(newPos);
  };

  // Manipula cliques no stage para desenhar formas
  const handleStageClick = (e) => {
    // Ignora cliques se estiver arrastando um ponto
    if (isDraggingPoint) return;
    
    // Só processa cliques diretos no stage ou quando não está desenhando
    if (e.target !== e.target.getStage() && !isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Ajusta a posição considerando zoom e pan
    const adjustedPos = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale
    };

    // Lógica para modo QUADRADO
    if (mode === MODES.SQUARE) {
      if (currentPoints.length === 0) {
        // Primeiro clique: inicia o desenho
        setCurrentPoints([adjustedPos]);
        setIsDrawing(true);
      } else {
        // Segundo clique: completa o quadrado
        const start = currentPoints[0];
        const end = adjustedPos;
        
        // Calcula os 4 pontos do quadrado
        const squarePoints = [
          { x: start.x, y: start.y },
          { x: end.x, y: start.y },
          { x: end.x, y: end.y },
          { x: start.x, y: end.y }
        ];

        // Adiciona o quadrado à lista de formas
        setShapes(prevShapes => [...prevShapes, {
          type: 'square',
          points: squarePoints,
          id: `shape-${Date.now()}`,
          name: `Quadrado ${prevShapes.filter(s => s.type === 'square').length + 1}`
        }]);
        
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } 
    // Lógica para modo POLÍGONO
    else {
      if (currentPoints.length === 0) {
        // Primeiro clique: inicia o polígono
        setCurrentPoints([adjustedPos]);
        setIsDrawing(true);
      } else {
        const firstPoint = currentPoints[0];
        const distance = Math.sqrt(
          Math.pow(adjustedPos.x - firstPoint.x, 2) + 
          Math.pow(adjustedPos.y - firstPoint.y, 2)
        );

        // Verifica se clicou perto do primeiro ponto para fechar o polígono
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
          // Adiciona novo ponto ao polígono
          setCurrentPoints([...currentPoints, adjustedPos]);
        }
      }
    }
  };

  // Move uma forma inteira
  const handleShapeDragMove = (shapeId, dx, dy) => {
    setShapes(prevShapes => prevShapes.map(shape => 
      shape.id === shapeId 
        ? { 
            ...shape, 
            points: shape.points.map(p => ({ 
              x: p.x + dx, 
              y: p.y + dy 
            })) 
          } 
        : shape
    ));
  };

  // Move um ponto individual de uma forma
  const handlePointDragMove = (shapeId, pointIndex, newPos) => {
    setShapes(prevShapes => prevShapes.map(shape => 
      shape.id === shapeId 
        ? { 
            ...shape, 
            points: shape.points.map((p, i) => 
              i === pointIndex 
                ? { x: newPos.x, y: newPos.y } 
                : p
            ) 
          } 
        : shape
    ));
  };

  // Adiciona um novo ponto em uma linha existente
  const addPointOnLine = (shapeId, lineIndex, pos) => {
    setShapes(prevShapes => prevShapes.map(shape => 
      shape.id === shapeId 
        ? { 
            ...shape, 
            points: [
              ...shape.points.slice(0, lineIndex + 1),
              pos,
              ...shape.points.slice(lineIndex + 1)
            ] 
          } 
        : shape
    ));
  };

  // Reseta a visualização (zoom e posição)
  const resetView = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  // Atualiza a posição do stage após arrastar
  const handleStageDragEnd = (e) => {
    setStagePos(e.target.position());
  };

  // Manipuladores para início e fim do arrasto de pontos
  const handlePointDragStart = () => setIsDraggingPoint(true);
  const handlePointDragEnd = () => setIsDraggingPoint(false);

  // Stage memoizado para evitar re-render desnecessários
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
    >
      {/* Layer do grid (não interativo) */}
      <Layer listening={false}>
        {renderGrid()}
      </Layer>
      
      {/* Layer principal com formas e a imagem do gato */}
      <Layer>
        {/* imagem posicionada nas coordenadas do mundo 0,0 */}
        {catImage && (
          <KonvaImage
            image={catImage}
            x={0}
            y={0}
            listening={false} // não intercepta eventos
            perfectDrawEnabled={false}
          />
        )}

        {/* Renderiza todas as formas existentes */}
        {shapes.map(shape => (
          <Shape
            key={shape.id}
            shape={shape}
            onShapeDragMove={handleShapeDragMove}
            onPointDragMove={handlePointDragMove}
            onAddPointOnLine={addPointOnLine}
            onPointDragStart={handlePointDragStart}
            onPointDragEnd={handlePointDragEnd}
            scale={scale}
          />
        ))}
        
        {/* Renderiza a forma que está sendo desenhada atualmente */}
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
    mousePos, isDrawing, handleStageClick, handleWheel, renderGrid, 
    handleStageDragEnd, catImage
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
      />
      
      <div className="app-content">
        <div className="stage-container" ref={containerRef}>
          {stageElement}
        </div>
      </div>
    </div>
  );
};

export default App;
