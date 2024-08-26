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

function App() {
  useGLTF.preload("/models/front_upper_susp-arm.glb");

  return (
    <>
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
    </>
  );
}

export default App;
