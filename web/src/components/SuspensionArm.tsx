import { useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Color, Float32BufferAttribute, Material, Mesh } from "three";

export const SuspensionArm = (props: any) => {
  const modelRef = useRef(null);
  const { scene, materials } = useGLTF("/models/front_upper_susp-arm.glb");

  useLayoutEffect(() => {
    scene.traverse(
      (obj: any) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true)
    );
    ((scene.children[0] as Mesh).material as Material).vertexColors = true;
    ((scene.children[0] as Mesh).material as Material).needsUpdate = true;

    const geometry = (scene.children[0] as Mesh).geometry;
    // geometry.toNonIndexed();
    const colors = [];

    let max: number | undefined;
    let min: number | undefined;
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const z = geometry.attributes.position.getZ(i);

      if (max) {
        if (z > max) {
          max = z;
        }
      } else {
        max = z;
      }

      if (min) {
        if (z < min) {
          min = z;
        }
      } else {
        min = z;
      }
    }

    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const z = geometry.attributes.position.getZ(i);
      const color = new Color();
      color.setHSL((z - min!) / (max! - min!), 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  });

  return <primitive ref={modelRef} object={scene} {...props} />;
};
