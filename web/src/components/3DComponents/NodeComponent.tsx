import { TransformControls, useSelect } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { ACTION_TRIGGERS } from "../../store/ActionTriggers";
import { useStore } from "../../store/Store";

export const NodeComponent = ({
  name,
  selected,
  setSelected,
  outlineHover,
  setOutlineHover,
}: any) => {
  const addAction = useStore((store) => store.addAction);
  const [locallySelected, setLocallySelected] = useState(false);
  const nodeRef = useRef<Mesh>(null);

  const HandleSelection = (e: any) => {
    if (selected.length < 3) {
      // TODO - Multiple selection
      const newSelection = [...selected, { name: name, type: "node" }];
      setSelected([{ name: name, type: "node" }]);
      setLocallySelected(true);
    }
  };

  const HandleHover = (e: any, type: string) => {
    if (type === "in") {
      setOutlineHover([...outlineHover, nodeRef]);
    }
    if (type === "out" && !locallySelected) {
      const newOutlineHover = outlineHover.filter(
        (item: any) => item.current.name !== name
      );
      setOutlineHover(newOutlineHover);
    }
  };

  useEffect(() => {
    selected.forEach((item: any) => {
      console.log("item", item);
      if (item.name == name) {
        console.log("Setting locally selected");
        setLocallySelected(true);
      } else {
        console.log("Setting locally DEselected");
        setLocallySelected(false);
        const newOutlineHover = outlineHover.filter(
          (item: any) => item.current.name !== name
        );
        setOutlineHover(newOutlineHover);
      }
    });
  }, [selected, name, outlineHover, setOutlineHover]);

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
          scale={[0.2, 0.2, 0.2]}
          name={name}
          onClick={HandleSelection}
          ref={nodeRef}
          onPointerEnter={(e) => HandleHover(e, "in")}
          onPointerLeave={(e) => HandleHover(e, "out")}
        >
          <sphereGeometry />
          <meshStandardMaterial />
        </mesh>
      </TransformControls>
    </>
  );
};
