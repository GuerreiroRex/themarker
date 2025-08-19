import { useState } from "react";
import { Group, Circle, Text } from "react-konva";

function Ponto() {
    const [pos, setPos] = useState({ x: 0, y: 0 })


    return (
        <>
            <Group
                x={pos.x}
                y={pos.y}
                draggable
                onDragMove={
                    (e) => {
                        const {x, y} = e.target.position();
                        setPos({x, y});
                    }
                }
            >
                <Circle
                    width={100}
                    height={100}
                    // fillEnabled={false}
                    fill="rgba(0, 0, 0, 0)"
                    stroke="#ffc74b"
                    strokeWidth={4}
                />
                <Text text="junto"></Text>

            </Group>

        </>
    )
}

export default Ponto;