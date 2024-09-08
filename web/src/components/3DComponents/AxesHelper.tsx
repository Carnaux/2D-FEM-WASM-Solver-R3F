import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { Color, MeshStandardMaterial, Vector3 } from "three";

export const AxesHelper = () => {
  return (
    <>
      {/* <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 3]} />
        <meshBasicMaterial color={new Color(255, 0, 0)} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.01, 0.01, 3]} />
        <meshBasicMaterial color={new Color(0, 255, 0)} />
      </mesh> */}
      <Line
        points={[new Vector3(0, 0, 0), new Vector3(2, 0, 0)]}
        color={new Color(255, 0, 0)}
      />
      <Line
        points={[new Vector3(0, 0, 0), new Vector3(0, 2, 0)]}
        color={new Color(0, 255, 0)}
      />
    </>
  );
};
