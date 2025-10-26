import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import Shape from './components/Shape';
import CurrentShape from './components/CurrentShape';
import Header from './components/Header';
import './App.css';

const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon'
};

const App = () => {
  const [mode, setMode] = useState(MODES.SQUARE);
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
  const [catImage, setCatImage] = useState(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = '/gato.jpg';
    img.onload = () => setCatImage(img);
    img.onerror = (err) => {
      console.error('Erro ao carregar /gato.jpg', err);
    };
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Fecha o menu se o clique foi fora dele
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
    // VERIFICAÇÃO ADICIONADA: Só processa clique do botão esquerdo
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
        const squarePoints = [
          { x: start.x, y: start.y },
          { x: end.x, y: start.y },
          { x: end.x, y: end.y },
          { x: start.x, y: end.y }
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

  // Manipulador de contexto para o stage - só mostra menu em área vazia
  const handleStageContextMenu = (e) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Só mostra o menu se o clique foi no stage (área vazia), não em uma figura/ponto
    if (e.target === e.target.getStage()) {
      setContextMenu({
        visible: true,
        x: pos.x,
        y: pos.y,
        shapeId: null,
        pointIndex: null
      });
    }
    // Se o clique foi em uma figura/ponto, o menu específico já foi aberto pelo componente Shape
  };

  // CORREÇÃO: Recebe diretamente os novos pontos
  const handleShapeDragMove = (shapeId, newPoints) => {
    setShapes(prevShapes => prevShapes.map(shape =>
      shape.id === shapeId
        ? { ...shape, points: newPoints }
        : shape
    ));
  };

  const handlePointDragMove = (shapeId, pointIndex, newPos) => {
    setShapes(prevShapes => prevShapes.map(shape =>
      shape.id === shapeId
        ? {
            ...shape,
            points: shape.points.map((p, i) =>
              i === pointIndex ? { x: newPos.x, y: newPos.y } : p
            )
          }
        : shape
    ));
  };

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

  // Esta função é chamada pelos componentes Shape quando o contexto é acionado neles
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
        {catImage && (
          <KonvaImage
            image={catImage}
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
    mousePos, isDrawing, catImage, renderGrid
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
              {/* Menu para pontos - opções específicas */}
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
                /* Menu para figuras (sem ponto específico) */
                <button 
                  onClick={() => handleDeleteShape(contextMenu.shapeId)}
                  className="context-menu-item delete"
                >
                  🗑️ Apagar Figura
                </button>
              ) : (
                /* Menu para área vazia */
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
          display: flex;
          flex-direction: column;
        }

        .app-content {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .stage-container {
          width: 100%;
          height: 100%;
        }

        .context-menu {
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
          color: #666;
          font-weight: bold;
          border-bottom: 1px solid #eee;
          margin-bottom: 4px;
        }

        .context-menu-item {
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          border-radius: 3px;
          margin: 2px 0;
          font-size: 14px;
        }

        .context-menu-item:hover {
          background: #f0f0f0;
        }

        .context-menu-item.delete {
          color: #e74c3c;
        }

        .context-menu-item.delete:hover {
          background: #ffeaea;
        }

        .context-menu-item.cancel {
          color: #666;
          border-top: 1px solid #eee;
          margin-top: 4px;
          padding-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default App;