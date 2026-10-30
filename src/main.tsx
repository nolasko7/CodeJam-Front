import React from "react";
import { createRoot } from "react-dom/client";
import "@material/web/button/filled-button.js";
import "./style.css";
import { App } from "./App";
import { Presentacion } from "./presentacion/Presentacion";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {window.location.pathname.replace(/\/$/, "") === "/presentacion" ? <Presentacion /> : <App />}
  </React.StrictMode>,
);

