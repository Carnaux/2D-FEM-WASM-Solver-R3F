import { ACTION_TRIGGERS } from "../store/ActionTriggers";
import { useStore } from "../store/Store";
import { ControllerProps } from "../types";
import { NodeInfo } from "./NodeInfo";

import "../styles/Controller.scss";
import { Outliner } from "./Outliner";

export const Controller = ({
  selected,
  setSelected,
  nodes3d,
  setNodes3d,
}: ControllerProps) => {
  const triggerAction = useStore((store) => store.triggerAction);

  return (
    <div className="controllerContainer">
      <div className="outlinerContainer">
        <Outliner
          selected={selected}
          setSelected={setSelected}
          nodes3d={nodes3d}
          setNodes3d={setNodes3d}
        />
      </div>
      <div className="infoContainer">
        {selected[selected.length - 1].type === "node" && (
          <NodeInfo selected={selected[selected.length - 1]} />
        )}
      </div>
      <div className="buttonsContainer">
        <button
          className="addButton"
          onClick={(e) => {
            triggerAction(ACTION_TRIGGERS.ADD_NODE, "app");
          }}
        >
          Add Node
        </button>
        <button className="addButton">Add Element</button>
      </div>
    </div>
  );
};
