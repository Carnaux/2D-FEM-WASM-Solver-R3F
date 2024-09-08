import { TransformControls, useSelect } from "@react-three/drei";
import { useEffect, useState } from "react";
import { Mesh } from "three";

export const NodeComponent = (props: any) => {
  const [locallySelected, setLocallySelected] = useState(false);

  const HandleSelection = (e: any) => {
    props.setSelected(props.name);
  };

  useEffect(() => {
    if (props.selected === props.name) {
      setLocallySelected(true);
    } else {
      setLocallySelected(false);
    }
  }, [props.selected, props.name]);

  return (
    <>
      <TransformControls
        mode="translate"
        showX={locallySelected}
        showY={locallySelected}
        showZ={false}
        enabled={locallySelected}
      >
        <mesh
          scale={[0.3, 0.3, 0.3]}
          name={props.name}
          onClick={HandleSelection}
        >
          <sphereGeometry />
          <meshStandardMaterial />
        </mesh>
      </TransformControls>
    </>
  );
};
