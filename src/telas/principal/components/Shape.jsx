import React, { useState, useRef } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

// Definição dos modos de interação disponíveis
const MODES = {
  SELECT: 'select',
  SQUARE: 'square',
  POLYGON: 'polygon',
  DELETE: 'delete'
};

const Shape = ({
  shape,
  onShapeDragMove,
  onPointDragMove,
  onAddPointOnLine,
  onDeleteShape,
  onShapeHover,
  onShapeHoverEnd,
  scale = 1,
  mode,
  isHovered,
  onPointDragStart,
  onPointDragEnd
}) => {
  const [hovered, setHovered] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Converte pontos do formato objeto para array plano [x1, y1, x2, y2, ...]
  const flatPoints = shape.points.flatMap(p => [p.x, p.y]);

  // Calcula o centro da forma para posicionamento de texto
  const centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
  const centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;

  // Define tamanhos dos pontos baseados no zoom atual
  const pointRadius = 6 / scale;
  const midPointRadius = 4 / scale;

  // Manipula o início do arrasto da forma
  const handleMouseDown = (e) => {
    e.cancelBubble = true; // Previne a propagação do evento

    if (mode === MODES.DELETE) {
      onDeleteShape && onDeleteShape(shape.id);
      return;
    }

    if (mode === MODES.SELECT || mode === MODES.SQUARE || mode === MODES.POLYGON) {
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Ajusta a posição do ponteiro considerando zoom e pan
      const adjustedPointerPos = {
        x: (pointerPos.x - stage.x()) / scale,
        y: (pointerPos.y - stage.y()) / scale
      };

      // Calcula o offset entre o clique e o centro da forma
      dragOffset.current = { 
        x: adjustedPointerPos.x - centerX, 
        y: adjustedPointerPos.y - centerY 
      };
      isDragging.current = true;

      // Registra listeners para movimento e soltura do mouse
      stage.on('mousemove', handleMouseMove);
      stage.on('mouseup', handleMouseUp);
    }
  };

  // Manipula o movimento durante o arrasto da forma
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const adjustedPointerPos = {
      x: (pointerPos.x - stage.x()) / scale,
      y: (pointerPos.y - stage.y()) / scale
    };

    // Calcula nova posição do centro
    const newCenterX = adjustedPointerPos.x - dragOffset.current.x;
    const newCenterY = adjustedPointerPos.y - dragOffset.current.y;

    // Calcula o deslocamento
    const dx = newCenterX - centerX;
    const dy = newCenterY - centerY;

    onShapeDragMove && onShapeDragMove(shape.id, dx, dy);
  };

  // Finaliza o arrasto da forma
  const handleMouseUp = (e) => {
    isDragging.current = false;
    const stage = e.target.getStage();
    stage.off('mousemove');
    stage.off('mouseup');
  };

  // Manipula o hover sobre a forma
  const handleMouseEnter = (e) => {
    setHovered(true);
    onShapeHover && onShapeHover(shape.id);
    
    if (mode === MODES.DELETE) {
      e.target.getStage().container().style.cursor = 'not-allowed';
    }
  };

  // Manipula a saída do hover
  const handleMouseLeave = (e) => {
    setHovered(false);
    onShapeHoverEnd && onShapeHoverEnd();
    
    if (mode === MODES.DELETE) {
      e.target.getStage().container().style.cursor = 'default';
    }
  };

  // Define a cor da borda baseada no estado atual
  const getStrokeColor = () => {
    if (mode === MODES.DELETE && isHovered) return '#ff4444';
    if (isHovered) return '#ffc74b';
    return 'red';
  };

  // Define a cor do preenchimento baseada no estado atual
  const getFillColor = () => {
    if (mode === MODES.DELETE && isHovered) return 'rgba(255, 68, 68, 0.5)';
    return 'rgba(100, 150, 255, 0.3)';
  };

  return (
    <Group>
      {/* Área de arrasto invisível que captura eventos do mouse */}
      <Line
        points={flatPoints}
        fill={getFillColor()}
        stroke="transparent"
        strokeWidth={15 / scale}
        closed={true}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        perfectDrawEnabled={false}
        listening={true}
      />

      {/* Contorno visível da forma */}
      <Line
        points={flatPoints}
        stroke={getStrokeColor()}
        strokeWidth={mode === MODES.DELETE && isHovered ? 3 / scale : 2 / scale}
        closed={true}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Tooltip que mostra informações da forma */}
      {hovered && (
        <Text
          x={centerX - 50 / scale}
          y={centerY - 20 / scale}
          text={`${shape.name}\nID: ${shape.id}`}
          fontSize={12 / scale}
          fill="black"
          padding={5 / scale}
          align="center"
          listening={false}
        />
      )}

      {/* Indicador de delete quando no modo de exclusão */}
      {mode === MODES.DELETE && isHovered && (
        <Text
          x={centerX - 30 / scale}
          y={centerY + 20 / scale}
          text="Clique para apagar"
          fontSize={10 / scale}
          fill="#ff4444"
          align="center"
          listening={false}
        />
      )}

      {/* Pontos de controle nos vértices da forma */}
      {mode !== MODES.DELETE && shape.points.map((point, index) => (
        <Circle
          key={index}
          x={point.x}
          y={point.y}
          radius={pointRadius}
          fill="blue"
          draggable
          onDragStart={(e) => {
            e.cancelBubble = true;
            onPointDragStart && onPointDragStart();
          }}
          onDragMove={(e) => {
            e.cancelBubble = true;
            const pos = e.target.position();
            onPointDragMove && onPointDragMove(shape.id, index, { x: pos.x, y: pos.y });
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            const pos = e.target.position();
            onPointDragMove && onPointDragMove(shape.id, index, { x: pos.x, y: pos.y });
            onPointDragEnd && onPointDragEnd();
          }}
          onMouseDown={(e) => {
            e.cancelBubble = true;
          }}
        />
      ))}

      {/* Pontos do meio das arestas para adicionar novos vértices */}
      {mode !== MODES.DELETE && shape.points.map((point, index) => {
        const nextPoint = shape.points[(index + 1) % shape.points.length];
        const midPoint = { 
          x: (point.x + nextPoint.x) / 2, 
          y: (point.y + nextPoint.y) / 2 
        };
        
        return (
          <Circle
            key={`mid-${index}`}
            x={midPoint.x}
            y={midPoint.y}
            radius={midPointRadius}
            fill="green"
            onClick={(e) => {
              e.cancelBubble = true;
              onAddPointOnLine && onAddPointOnLine(shape.id, index, midPoint);
            }}
            onMouseDown={(e) => { e.cancelBubble = true; }}
          />
        );
      })}
    </Group>
  );
};

export default Shape;