import ReactDOM from "react-dom/client";
import { Home } from "./components/Home";
import "./styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <>
    <Home />
  </>
);
