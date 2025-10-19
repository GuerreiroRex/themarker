import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon'
};

const CurrentShape = ({ mode, currentPoints, mousePos, isDrawing, scale = 1, stagePos }) => {
  // Não renderiza nada se não estiver no modo de desenho
  if (!isDrawing) return null;

  // Ajusta a posição do mouse considerando zoom e pan do stage
  const adjustedMousePos = {
    x: (mousePos.x - stagePos.x) / scale,
    y: (mousePos.y - stagePos.y) / scale
  };

  // Renderização para modo QUADRADO (apenas 1 ponto definido)
  if (mode === MODES.SQUARE && currentPoints.length === 1) {
    const start = currentPoints[0];
    
    // Calcula os 4 pontos do quadrado baseado no ponto inicial e posição atual do mouse
    const points = [
      start.x, start.y,                    // Canto superior esquerdo
      adjustedMousePos.x, start.y,         // Canto superior direito
      adjustedMousePos.x, adjustedMousePos.y, // Canto inferior direito
      start.x, adjustedMousePos.y          // Canto inferior esquerdo
    ];
    
    return (
      <Group>
        {/* Linha do quadrado em preview */}
        <Line 
          points={points} 
          fill="rgba(100, 150, 255, 0.3)"  // Preenchimento semi-transparente
          stroke="red"                      // Borda vermelha
          strokeWidth={2 / scale}           // Espessura ajustada pelo zoom
          closed={true}                     // Fecha a forma automaticamente
          listening={false}                 // Não captura eventos de mouse
        />
        {/* Ponto atual seguindo o mouse */}
        <Circle
          x={adjustedMousePos.x}
          y={adjustedMousePos.y}
          radius={6 / scale}
          fill="blue"
          listening={false}
        />
      </Group>
    );
  }

  // Renderização para modo POLÍGONO (pelo menos 1 ponto definido)
  if (mode === MODES.POLYGON && currentPoints.length > 0) {
    // Cria array de pontos incluindo a posição atual do mouse
    const previewPoints = [...currentPoints, adjustedMousePos];
    const flatPoints = previewPoints.flatMap(p => [p.x, p.y]);
    
    // Calcula distância até o primeiro ponto para verificar se pode fechar o polígono
    const firstPoint = currentPoints[0];
    const distanceToFirst = Math.sqrt(
      Math.pow(adjustedMousePos.x - firstPoint.x, 2) + 
      Math.pow(adjustedMousePos.y - firstPoint.y, 2)
    );
    
    // Define se o polígono pode ser fechado (perto do primeiro ponto com pelo menos 3 pontos)
    const shouldClose = distanceToFirst < 15 / scale && currentPoints.length >= 3;
    
    return (
      <Group>
        {/* Área preenchida quando o polígono pode ser fechado */}
        {shouldClose && (
          <Line
            points={currentPoints.flatMap(p => [p.x, p.y])}
            fill="rgba(100, 150, 255, 0.3)"
            stroke="red"
            strokeWidth={2 / scale}
            closed={true}
            listening={false}
          />
        )}
        
        {/* Linhas do polígono em preview */}
        <Line
          points={flatPoints}
          stroke="red"
          strokeWidth={2 / scale}
          closed={shouldClose}  // Fecha apenas se estiver perto do primeiro ponto
          listening={false}
        />
        
        {/* Linha tracejada conectando ao primeiro ponto quando perto */}
        {shouldClose && (
          <Line
            points={[adjustedMousePos.x, adjustedMousePos.y, firstPoint.x, firstPoint.y]}
            stroke="red"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}  // Padrão de traço ajustado pelo zoom
            listening={false}
          />
        )}
        
        {/* Renderiza todos os pontos já definidos do polígono */}
        {currentPoints.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={6 / scale}
            fill="blue"
            listening={false}
          />
        ))}
        
        {/* Ponto atual seguindo o mouse */}
        <Circle
          x={adjustedMousePos.x}
          y={adjustedMousePos.y}
          radius={6 / scale}
          fill="blue"
          listening={false}
        />
        
        {/* Texto instrucional quando pode fechar o polígono */}
        {shouldClose && (
          <Text
            x={adjustedMousePos.x + 10 / scale}
            y={adjustedMousePos.y - 20 / scale}
            text="Clique para fechar"
            fontSize={12 / scale}
            fill="red"
            listening={false}
          />
        )}
      </Group>
    );
  }

  return null;
};

export default CurrentShape;