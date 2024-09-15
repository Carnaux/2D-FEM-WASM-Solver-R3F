import "./styles/App.scss";
import { Grid, OrbitControls, Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ToneMapping,
  Outline,
} from "@react-three/postprocessing";

import * as WASM from "./wasm/fem-solver";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NodeComponent } from "./components/3DComponents/NodeComponent";
import { AxesHelper } from "./components/3DComponents/AxesHelper";
import { AppProps, dummySelection } from "./types";
import { useStore } from "./store/Store";
import { ACTION_TRIGGERS } from "./store/ActionTriggers";

function App({
  selected,
  setSelected,
  outlineHover,
  setOutlineHover,
  nodes3d,
  setNodes3d,
}: AppProps) {
  const addAction = useStore((store) => store.addAction);
  const [wasmModule, setWasmModule] = useState<any>(null);

  // Run WASM module
  const loadWasmModule = async () => {
    console.log("Loading WASM module...");
    const module = await WASM.default();
    console.log("WASM module loaded", module);
    setWasmModule(module);

    console.log("Setting up model discretization");

    let numOfNodes = 3.0;
    let numOfElements = 3.0;

    const FEMSolver = new module.FEMSolver(numOfNodes, numOfElements);
    console.log(FEMSolver);

    const nodeData = [
      //First
      0, 0, 0, 0, 0, 0,
      //Second
      20, 0, 0, 0, 0, 0,
      //Third
      0, 20, 0, 0, 500, 0,
    ];

    const nodeUndefinedIndexes = [
      //First
      0, 0, 0, 0, 1, 1,
      //Second
      0, 0, 1, 0, 0, 1,
      //Third
      0, 0, 1, 1, 0, 0,
    ];

    const finalNodeData = nodeData.concat(nodeUndefinedIndexes);

    // Send Node data to WASM
    const nodeData32 = new Float32Array(finalNodeData.length);
    finalNodeData.forEach((data, index) => {
      nodeData32[index] = data;
    });

    let nodeDataHeapSpace = module._malloc(
      nodeData32.length * nodeData32.BYTES_PER_ELEMENT
    );
    module.HEAPF32.set(nodeData32, nodeDataHeapSpace >> 2);
    FEMSolver.SetNodeInputData(nodeDataHeapSpace, finalNodeData.length);
    module._free(nodeDataHeapSpace);

    // Send Element data to WASM
    const elementsData = [0, 1, 2e-6, 10e9, 1, 2, 2e-6, 12e9, 2, 0, 3e-6, 10e9];
    const elementData32 = new Float32Array(elementsData.length);
    elementsData.forEach((data, index) => {
      elementData32[index] = data;
    });

    let elementDataHeapSpace = module._malloc(
      elementData32.length * elementData32.BYTES_PER_ELEMENT
    );
    module.HEAPF32.set(elementData32, elementDataHeapSpace >> 2);
    FEMSolver.SetElementInputData(elementDataHeapSpace, elementsData.length);
    module._free(elementDataHeapSpace);

    FEMSolver.ProcessData();

    const heap = FEMSolver.Solve();
    const arrayData = [];
    for (let v = 0; v < nodeData.length; v++) {
      arrayData.push(module.HEAPF32[heap / Float32Array.BYTES_PER_ELEMENT + v]);
    }

    console.log("SOLUTION", arrayData);

    // Setup initial model
    // Nodes = 'coord_x', 'coord_y', 'disp_x', 'disp_y', 'load_x', 'load_y'
    // let data_nodes = [
    //   [0,  0,         0,        0, undefined, undefined],
    //   [20, 0, undefined,        0,         0, undefined],
    //   [0, 20, undefined, undefined,      500,         0],
    // ];
    // Elements = 'start', 'end', 'area', 'material'
    // let data_elements = [
    //   [0, 1, 2e-6, 10e9],
    //   [1, 2, 2e-6, 12e9],
    //   [2, 0, 3e-6, 10e9],
    // ];
  };

  // Load WASM module on first render
  useEffect(() => {
    if (!wasmModule) {
      loadWasmModule();
    }
  }, [wasmModule]);

  // Handle miss click
  const HandleMissClick = (e: any) => {
    setSelected([dummySelection]);
    setOutlineHover([]);
  };

  // Create new node reference
  useEffect(() => {
    addAction({
      trigger: ACTION_TRIGGERS.ADD_NODE,
      target: "app",
      cb: (e: any) => {
        // TODO better data management + store
        const newNodeIndex = nodes3d.length + 1;
        const name = `node${newNodeIndex}`;

        const newNode = {
          name: name,
        };

        setNodes3d([...nodes3d, newNode]);
      },
    });
  }, [
    addAction,
    nodes3d,
    selected,
    setSelected,
    outlineHover,
    setOutlineHover,
  ]);

  return (
    <>
      {wasmModule && (
        <Canvas
          flat
          shadows
          camera={{ position: [10, 10, 10], fov: 25 }}
          onPointerMissed={HandleMissClick}
          gl={{ antialias: true }}
        >
          <fog attach="fog" args={["black", 15, 60]} />
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            cellSize={0.2}
            cellThickness={0.6}
            sectionSize={1}
            sectionThickness={1.5}
            fadeDistance={31}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <OrbitControls
            makeDefault
            enableRotate
            enablePan={false}
            maxDistance={30}
            minDistance={5}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
            maxAzimuthAngle={Math.PI / 5}
            minAzimuthAngle={-Math.PI / 5}
          />
          <EffectComposer autoClear={false}>
            <Bloom luminanceThreshold={2} mipmapBlur intensity={0.1} />
            <ToneMapping />
            <Outline
              selection={outlineHover} // selection of objects that will be outlined
              selectionLayer={10} // selection layer
              edgeStrength={100} // the edge strength
              pulseSpeed={0.0} // a pulse speed. A value of zero disables the pulse effect
              visibleEdgeColor={0xffffff} // the color of visible edges
              hiddenEdgeColor={0xffffff} // the color of hidden edges
              blur={false} // whether the outline should be blurred
            />
          </EffectComposer>
          <Environment background preset="sunset" blur={0.85} />
          <AxesHelper />
          {nodes3d.map((NodeData: any, index: any) => (
            <NodeComponent
              name={NodeData.name}
              selected={selected}
              setSelected={setSelected}
              outlineHover={outlineHover}
              setOutlineHover={setOutlineHover}
              key={NodeData.name}
            />
          ))}
        </Canvas>
      )}
    </>
  );
}

export default App;
