import { PivotControls, TransformControls, useSelect } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Mesh, Quaternion, Vector3 } from "three";
import { ACTION_TRIGGERS } from "../../store/ActionTriggers";
import { useStore } from "../../store/Store";
import { useFrame } from "@react-three/fiber";
import { dummySelection, NodeComponentProps } from "../../types";

export const NodeComponent = ({
  name,
  selected,
  setSelected,
  outlineHover,
  setOutlineHover,
}: NodeComponentProps) => {
  const addAction = useStore((store) => store.addAction);
  const triggerAction = useStore((store) => store.triggerAction);

  const nodeRef = useRef<Mesh>(null);
  const [locallySelected, setLocallySelected] = useState<boolean>(false);
  const [positionState, setPositionState] = useState<Vector3>(new Vector3());

  // Manage selection
  const HandleSelection = () => {
    setSelected([{ name: name, type: "node", pos: positionState }]);

    setLocallySelected(true);
  };

  const HandleSelectionFromOutliner = (
    outlinerName: string,
    outlinerPos: Vector3
  ) => {
    setSelected([{ name: outlinerName, type: "node", pos: outlinerPos }]);

    setLocallySelected(true);
  };

  // Manages hover 3Doutline
  const HandleHover = (e: any, type: string) => {
    if (locallySelected) return;

    if (type === "in") {
      const findNode = outlineHover.find(
        (item: any) => item.current.name === name
      );
      if (!findNode) {
        setOutlineHover([...outlineHover, nodeRef]);
      }
    }

    if (type === "out" && !locallySelected) {
      const newOutlineHover = outlineHover.filter(
        (item: any) => item.current.name !== name
      );
      setOutlineHover(newOutlineHover);
    }
  };

  // Manage selection outside changes
  useEffect(() => {
    const findNode = selected.find((item: any) => item.name === name);

    if (findNode) {
      setLocallySelected(true);
      setOutlineHover([nodeRef]);
    } else {
      setLocallySelected(false);
    }
  }, [selected, name]);

  //Manage selection from outliner
  useEffect(() => {
    addAction({
      trigger: ACTION_TRIGGERS.OUTLINER_SELECT,
      target: `${name}`,
      cb: (e: any) => {
        HandleSelectionFromOutliner(e.name, positionState);
      },
    });
  }, [HandleSelection, name, positionState]);

  return (
    <>
      <PivotControls
        activeAxes={[true, true, false]}
        disableRotations={true}
        disableScaling={true}
        visible={locallySelected}
        onDrag={(l) => {
          const position = new Vector3();
          const scale = new Vector3();
          const quaternion = new Quaternion();
          l.decompose(position, quaternion, scale);
          setPositionState(position);
          triggerAction(
            ACTION_TRIGGERS.UPDATE_POS_OUTLINER,
            "NodeInfo",
            position
          );
        }}
      >
        <mesh
          scale={[0.3, 0.3, 0.3]}
          name={name}
          onClick={(e) => HandleSelection()}
          ref={nodeRef}
          onPointerEnter={(e) => HandleHover(e, "in")}
          onPointerLeave={(e) => HandleHover(e, "out")}
        >
          <sphereGeometry />
          <meshStandardMaterial />
        </mesh>
      </PivotControls>
    </>
  );
};
