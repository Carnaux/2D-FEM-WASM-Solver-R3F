import "./styles/App.css";
import {
  Grid,
  OrbitControls,
  Environment,
  useGLTF,
  Stage,
  AccumulativeShadows,
  RandomizedLight,
  Center,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ToneMapping,
} from "@react-three/postprocessing";
import { SuspensionArm } from "./components/SuspensionArm";

import * as WASM from "./wasm/fem-solver";
import { useEffect, useState } from "react";

function App() {
  const [wasmModule, setWasmModule] = useState<any>(null);
  useGLTF.preload("/models/front_upper_susp-arm.glb");

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
    FEMSolver.Solve();
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

  useEffect(() => {
    if (!wasmModule) {
      loadWasmModule();
    }
  }, [wasmModule]);

  return (
    <>
      {wasmModule && (
        <Canvas flat shadows camera={{ position: [10, 10, 10], fov: 25 }}>
          <fog attach="fog" args={["black", 15, 40]} />
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            cellSize={0.6}
            cellThickness={0.6}
            sectionSize={3.3}
            sectionThickness={1.5}
            fadeDistance={31}
          />
          <OrbitControls
            makeDefault
            enableRotate
            enablePan={false}
            maxDistance={30}
            minDistance={5}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 4}
          />
          <EffectComposer>
            <Bloom luminanceThreshold={2} mipmapBlur />
            <ToneMapping />
          </EffectComposer>
          <Environment background preset="sunset" blur={0.85} />

          <group>
            <SuspensionArm
              name={"susArm"}
              position={[0, 0.5, 0]}
              scale={[0.05, 0.05, 0.05]}
            />

            <AccumulativeShadows
              temporal
              frames={80}
              toneMapped={true}
              alphaTest={0.75}
              opacity={1}
              scale={10}
            >
              <RandomizedLight
                intensity={Math.PI}
                amount={8}
                radius={4}
                ambient={0.5}
                position={[5, 5, -10]}
                bias={0.001}
              />
            </AccumulativeShadows>
          </group>
        </Canvas>
      )}
    </>
  );
}

export default App;
