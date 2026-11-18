import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";
import "./components/ui/Select/select.css";
import { updateMetaThemeColor } from "./lib/theme";
import { env } from "./lib/env";

updateMetaThemeColor();

async function init() {
  const isMockAll = env.useMocks;
  const mockServices = env.mockServices;
  const isPartialMock = !isMockAll && mockServices.length > 0;

  // Print active mode and mocked services once in development console group
  if (import.meta.env.DEV) {
    console.group("[CodeBridge env]");
    console.log("Mode:", isMockAll ? "mock (all services)" : "real backend");
    console.log(
      "Mocked services:",
      isMockAll ? "ALL" : mockServices.length > 0 ? mockServices.join(", ") : "none"
    );
    console.log("Gateway URL:", env.gatewayUrl);
    console.log("GitHub Mode:", env.githubMode);
    console.groupEnd();
  }

  if (isMockAll) {
    const { handleDevRoleBootstrap } = await import("./mocks/devSession");
    handleDevRoleBootstrap();

    const { worker } = await import("./mocks/browser");
    const { registerMockControls } = await import("./mocks/controls");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
    registerMockControls();
  } else if (isPartialMock) {
    const { worker } = await import("./mocks/browser");
    const { getHandlersForServices } = await import("./mocks/handlers");
    const activeHandlers = getHandlersForServices(mockServices);
    worker.resetHandlers(...activeHandlers);
    await worker.start({
      onUnhandledRequest: "bypass",
    });
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
