import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

const MODES = {
  SQUARE: 'square',
  POLYGON: 'polygon'
};

const CurrentShape = ({ mode, currentPoints, mousePos, isDrawing, scale = 1, stagePos }) => {
  if (!isDrawing) return null;

  const adjustedMousePos = {
    x: (mousePos.x - stagePos.x) / scale,
    y: (mousePos.y - stagePos.y) / scale
  };

  if (mode === MODES.SQUARE && currentPoints.length === 1) {
    const start = currentPoints[0];
    const points = [
      start.x, start.y,
      adjustedMousePos.x, start.y,
      adjustedMousePos.x, adjustedMousePos.y,
      start.x, adjustedMousePos.y
    ];
    return (
      <Group>
        <Line
          points={points}
          fill="rgba(100, 150, 255, 0.3)"
          stroke="red"
          strokeWidth={2 / scale}
          closed={true}
          listening={false}
        />
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

  if (mode === MODES.POLYGON && currentPoints.length > 0) {
    const previewPoints = [...currentPoints, adjustedMousePos];
    const flatPoints = previewPoints.flatMap(p => [p.x, p.y]);

    const firstPoint = currentPoints[0];
    const distanceToFirst = Math.sqrt(
      Math.pow(adjustedMousePos.x - firstPoint.x, 2) +
      Math.pow(adjustedMousePos.y - firstPoint.y, 2)
    );

    const shouldClose = distanceToFirst < 15 / scale && currentPoints.length >= 3;

    return (
      <Group>
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

        <Line
          points={flatPoints}
          stroke="red"
          strokeWidth={2 / scale}
          closed={shouldClose}
          listening={false}
        />

        {shouldClose && (
          <Line
            points={[adjustedMousePos.x, adjustedMousePos.y, firstPoint.x, firstPoint.y]}
            stroke="red"
            strokeWidth={2 / scale}
            dash={[5 / scale, 5 / scale]}
            listening={false}
          />
        )}

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

        <Circle
          x={adjustedMousePos.x}
          y={adjustedMousePos.y}
          radius={6 / scale}
          fill="blue"
          listening={false}
        />

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