import { ACTION_TRIGGERS } from "../store/ActionTriggers";
import { useStore } from "../store/Store";
import "../styles/Controller.scss";
import { NodeInfo } from "./NodeInfo";
export const Controller = ({ selected, setSelected }: any) => {
  const triggerAction = useStore((store) => store.triggerAction);

  return (
    <div className="controllerContainer">
      <div className="outlinerContainer"></div>
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
