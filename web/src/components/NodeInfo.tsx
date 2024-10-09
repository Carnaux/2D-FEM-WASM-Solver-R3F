import { useEffect, useRef, useState } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import { useStore } from "../store/Store";
import { ACTION_TRIGGERS } from "../store/ActionTriggers";

import "../styles/NodeInfo.scss";
import { convertValue } from "../utils/convertValue";
export const NodeInfo = ({ selected }: any) => {
  const addAction = useStore((store) => store.addAction);
  const [posState, setPosState] = useState<Vector3>(
    new Vector3(selected.pos.x, selected.pos.y, selected.pos.z)
  );

  useEffect(() => {
    addAction({
      trigger: ACTION_TRIGGERS.UPDATE_POS_OUTLINER,
      target: "NodeInfo",
      cb: (e: any) => {
        setPosState(e);
      },
    });
  }, [setPosState]);

  useEffect(() => {
    setPosState(new Vector3(selected.pos.x, selected.pos.y, selected.pos.z));
  }, [selected]);

  return (
    <div className="nodeInfoContainer">
      <div className="header">
        <p className="type">&#10687;</p>
        <p className="name">{selected.name}</p>
      </div>
      <div className="positionInputContainer">
        <p>Position</p>
        <div className="positionInput">
          <div className="inputAndLabel">
            <p>X</p>
            <input value={convertValue(posState.x.toFixed(4))} />
          </div>
          <div className="inputAndLabel">
            <p>Y</p>
            <input value={convertValue(posState.y.toFixed(4))} />
          </div>
        </div>
      </div>
      <div className="loadInputContainer">
        <p>Loads</p>
        <div className="loadInput">
          <div className="inputAndLabel">
            <p>X</p>
            <input value={0} />
          </div>
          <div className="inputAndLabel">
            <p>Y</p>
            <input value={0} />
          </div>
        </div>
      </div>
      <div className="lockInputContainer">
        <p>Static</p>
        <div className="lockInput">
          <div className="inputAndLabel">
            <p>X</p>
            <input type="checkbox" />
          </div>
          <div className="inputAndLabel">
            <p>Y</p>
            <input type="checkbox" />
          </div>
        </div>
      </div>
    </div>
  );
};
