import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { Stage, Layer, Text } from "react-konva";
import Ponto from "../../componentes/pontoMarcado/App";

function Principal() {

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Ponto/>
        <Ponto/>
        <Ponto/>
        <Text text="ABC" fontSize={15}/>
      </Layer>
    </Stage>
  );
}

export default Principal;
