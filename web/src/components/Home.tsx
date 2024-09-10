import { useState } from "react";
import App from "../App";
import { Intro } from "./Intro";
import { Controller } from "./Controller";
import { dummySelection, Selection } from "../types";

export const Home = () => {
  const [introVisible, setIntroVisible] = useState(true);
  const [selected, setSelected] = useState<Selection[]>([dummySelection]);
  const [outlineHover, setOutlineHover] = useState([]);

  return (
    <>
      {introVisible && <Intro setIntroVisible={setIntroVisible} />}
      {!introVisible && (
        <Controller selected={selected} setSelected={setSelected} />
      )}
      <App
        selected={selected}
        setSelected={setSelected}
        outlineHover={outlineHover}
        setOutlineHover={setOutlineHover}
      />
    </>
  );
};
