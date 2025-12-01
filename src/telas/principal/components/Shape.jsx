import React, { useState, useRef } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

const Shape = ({
  shape,
  onShapeDragMove,
  onPointDragMove,
  onAddPointOnLine,
  onContextMenu,
  onPointDragStart,
  onPointDragEnd,
  scale = 1,
  stagePos
}) => {
  const [hovered, setHovered] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // refs para armazenar estado do arrasto
  const originalPointsRef = useRef([]);
  const dragInitialWorldRef = useRef(null);
  const stageRef = useRef(null);

  // Calcular pontos médios apenas para polígonos ou quadrados convertidos (5+ pontos)
  const shouldShowMidPoints = shape.type !== 'square' || shape.points.length > 4;

  const flatPoints = shape.points.flatMap(p => [p.x, p.y]);
  const centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
  const centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
  const pointRadius = 6 / scale;
  const midPointRadius = 4 / scale;

  // Determinar cores baseadas no tipo e estado
  const getShapeColor = () => {
    if (isDragging) return '#ffc74b';
    if (hovered) return '#ffc74b';
    return shape.type === 'square' ? 'blue' : 'red';
  };

  const getPointColor = (index) => {
    if (hoveredPoint === index) return '#ff4444';
    return shape.type === 'square' && shape.points.length === 4 ? 'green' : 'blue';
  };

  /**
   * Início do arrasto da figura inteira.
   * -> Usa coordenadas "world" (considerando scale e posição do stage)
   * -> Guarda os pontos originais e a posição inicial do ponteiro em world.
   * -> Usa listeners no window para garantir que mouseup/mousemove sejam capturados
   *    mesmo que o cursor saia do canvas.
   */
  const handleDragStart = (e) => {
    // evita que o stage comece a arrastar
    if (e && e.evt) e.evt.cancelBubble = true;
    if (e) e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    stageRef.current = stage;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // converte pointer em coordenadas do "mundo" (onde estão os pontos)
    const startWorld = {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY()
    };

    // guarda estado inicial
    originalPointsRef.current = shape.points.map(p => ({ ...p }));
    dragInitialWorldRef.current = startWorld;

    setIsDragging(true);
    onPointDragStart && onPointDragStart();

    // listeners globais para garantir captura do movimento/fim do arrasto
    window.addEventListener('mousemove', handleWindowDragMove);
    window.addEventListener('mouseup', handleWindowDragEnd);
    // também ouvir touch (opcional, melhora suporte mobile)
    window.addEventListener('touchmove', handleWindowDragMove, { passive: false });
    window.addEventListener('touchend', handleWindowDragEnd);
  };

  /**
   * Movimentação do mouse durante o arrasto — calcula delta em world
   * baseado na diferença entre a posição atual do ponteiro em world e a
   * posição inicial armazenada. Atualiza sempre usando os pontos originais
   * + delta (evita acumulação de erro).
   */
  const handleWindowDragMove = (evt) => {
    // quando chamado por touch events, prevenir scroll padrão
    if (evt && evt.type === 'touchmove') {
      evt.preventDefault && evt.preventDefault();
    }

    const stage = stageRef.current;
    if (!stage || !dragInitialWorldRef.current) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const currentWorld = {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY()
    };

    const dx = currentWorld.x - dragInitialWorldRef.current.x;
    const dy = currentWorld.y - dragInitialWorldRef.current.y;

    const newPoints = originalPointsRef.current.map(p => ({
      x: p.x + dx,
      y: p.y + dy
    }));

    // notifica o pai com pontos atualizados (em coordenadas world)
    onShapeDragMove && onShapeDragMove(shape.id, newPoints);
  };

  /**
   * Final do arrasto: remove listeners e sinaliza fim ao pai.
   */
  const handleWindowDragEnd = () => {
    setIsDragging(false);
    if (stageRef.current) {
      // limpa refs
      stageRef.current = null;
      dragInitialWorldRef.current = null;
      originalPointsRef.current = [];
    }

    // remove listeners
    window.removeEventListener('mousemove', handleWindowDragMove);
    window.removeEventListener('mouseup', handleWindowDragEnd);
    window.removeEventListener('touchmove', handleWindowDragMove);
    window.removeEventListener('touchend', handleWindowDragEnd);

    onPointDragEnd && onPointDragEnd();
  };

  const handleRightClick = (e) => {
    if (e && e.evt) e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage && stage.getPointerPosition();
    if (pointer && onContextMenu) {
      onContextMenu(shape.id, null, pointer.x, pointer.y);
    }
  };

  const handlePointRightClick = (e, pointIndex) => {
    if (e && e.evt) e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage && stage.getPointerPosition();
    if (pointer && onContextMenu) {
      onContextMenu(shape.id, pointIndex, pointer.x, pointer.y);
    }
  };

  const handleMouseEnter = (e) => {
    setHovered(true);
    const stage = e.target.getStage();
    if (stage && stage.container()) {
      stage.container().style.cursor = 'move';
    }
  };

  const handleMouseLeave = (e) => {
    if (!isDragging) {
      setHovered(false);
      setHoveredPoint(null);
      const stage = e.target.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'default';
      }
    }
  };

  const handlePointMouseEnter = (e, pointIndex) => {
    setHoveredPoint(pointIndex);
    const stage = e.target.getStage();
    if (stage && stage.container()) {
      stage.container().style.cursor = 'pointer';
    }
  };

  const handlePointMouseLeave = (e) => {
    if (!isDragging) {
      setHoveredPoint(null);
      const stage = e.target.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'default';
      }
    }
  };

  return (
    <Group>
      {/* Área de captura do arrasto (invisível) */}
      <Line
        points={flatPoints}
        fill={isDragging ? "rgba(100, 150, 255, 0.5)" : "rgba(100, 150, 255, 0.3)"}
        stroke="transparent"
        strokeWidth={20 / scale}
        closed={true}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleRightClick}
        perfectDrawEnabled={false}
        listening={true}
      />

      {/* Contorno visível - cor diferente para quadrados vs polígonos */}
      <Line
        points={flatPoints}
        stroke={getShapeColor()}
        strokeWidth={isDragging ? 3 / scale : 2 / scale}
        closed={true}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Tooltip com info da forma */}
      {hovered && !isDragging && (
        <Text
          x={centerX - 50 / scale}
          y={centerY - 20 / scale}
          text={`${shape.name}${shape.type === 'square' && shape.points.length === 4 ? ' (Quadrado)' : ' (Polígono)'}\nArraste para mover`}
          fontSize={12 / scale}
          fill="black"
          padding={5 / scale}
          align="center"
          listening={false}
        />
      )}

      {/* Pontos de controle (vértices) */}
      {shape.points.map((point, index) => (
        <Circle
          key={index}
          x={point.x}
          y={point.y}
          radius={pointRadius}
          fill={getPointColor(index)}
          draggable
          onDragStart={(e) => {
            if (e && e.evt) e.evt.cancelBubble = true;
            e.cancelBubble = true;
            onPointDragStart && onPointDragStart();
          }}
          onDragMove={(e) => {
            if (e && e.evt) e.evt.cancelBubble = true;
            e.cancelBubble = true;
            const pos = e.target.position();
            // pos já está em coordenadas world (posição do círculo)
            onPointDragMove && onPointDragMove(shape.id, index, { x: pos.x, y: pos.y });
          }}
          onDragEnd={(e) => {
            if (e && e.evt) e.evt.cancelBubble = true;
            e.cancelBubble = true;
            const pos = e.target.position();
            onPointDragMove && onPointDragMove(shape.id, index, { x: pos.x, y: pos.y });
            onPointDragEnd && onPointDragEnd();
          }}
          onMouseEnter={(e) => handlePointMouseEnter(e, index)}
          onMouseLeave={handlePointMouseLeave}
          onContextMenu={(e) => handlePointRightClick(e, index)}
          onMouseDown={(e) => { if (e && e.evt) e.evt.cancelBubble = true; e.cancelBubble = true; }}
        />
      ))}

      {/* Pontos médios das arestas - APENAS para polígonos ou quadrados com + de 4 pontos */}
      {shouldShowMidPoints && shape.points.map((point, index) => {
        const nextPoint = shape.points[(index + 1) % shape.points.length];
        const midPoint = { x: (point.x + nextPoint.x) / 2, y: (point.y + nextPoint.y) / 2 };
        return (
          <Circle
            key={`mid-${index}`}
            x={midPoint.x}
            y={midPoint.y}
            radius={midPointRadius}
            fill="orange"
            onClick={(e) => {
              e.cancelBubble = true;
              onAddPointOnLine && onAddPointOnLine(shape.id, index, midPoint);
            }}
            onTouchEnd={(e) => {
              e.cancelBubble = true;
              onAddPointOnLine && onAddPointOnLine(shape.id, index, midPoint);
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage && stage.container()) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage && stage.container() && !isDragging) {
                stage.container().style.cursor = 'default';
              }
            }}
            onMouseDown={(e) => { e.cancelBubble = true; }}
          />
        );
      })}
    </Group>
  );
};

export default Shape;