import { useState } from "react";
import App from "../App";
import { Intro } from "./Intro";
import { Controller } from "./Controller";
import { dummySelection, NodeObject, Selection } from "../types";

export const Home = () => {
  const [introVisible, setIntroVisible] = useState(true);
  const [selected, setSelected] = useState<Selection[]>([dummySelection]);
  const [outlineHover, setOutlineHover] = useState([]);
  const [nodes3d, setNodes3d] = useState<NodeObject[]>([]);

  return (
    <>
      {introVisible && <Intro setIntroVisible={setIntroVisible} />}
      {!introVisible && (
        <Controller
          selected={selected}
          setSelected={setSelected}
          nodes3d={nodes3d}
          setNodes3d={setNodes3d}
        />
      )}
      <App
        selected={selected}
        setSelected={setSelected}
        outlineHover={outlineHover}
        setOutlineHover={setOutlineHover}
        nodes3d={nodes3d}
        setNodes3d={setNodes3d}
      />
    </>
  );
};
