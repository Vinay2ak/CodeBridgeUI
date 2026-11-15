import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";
import { updateMetaThemeColor } from "./lib/theme";

updateMetaThemeColor();

async function init() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
    const { handleDevRoleBootstrap } = await import("./mocks/devSession");
    handleDevRoleBootstrap();

    const { worker } = await import("./mocks/browser");
    const { registerMockControls } = await import("./mocks/controls");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
    registerMockControls();
  }

  const rootElement = document.getElementById("root");
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

init();
