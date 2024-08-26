import { useState } from "react";
import App from "../App";
import { Intro } from "./Intro";
import { Controller } from "./Controller";

export const Home = () => {
  const [introVisible, setIntroVisible] = useState(true);

  return (
    <>
      {introVisible && <Intro setIntroVisible={setIntroVisible} />}
      {!introVisible && <Controller />}
      <App />
    </>
  );
};
