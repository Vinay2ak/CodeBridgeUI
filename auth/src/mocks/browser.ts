import { setupWorker, type SetupWorker } from "msw/browser";
import { identityHandlers } from "./handlers/identity";
import { talentHandlers } from "./handlers/talent";
import { githubHandlers } from "./handlers/github";
import { VITE_USE_MOCKS, VITE_MOCK_SERVICES } from "../lib/env";

const HANDLERS_BY_SERVICE: Record<string, any[]> = {
  identity: identityHandlers,
  talent: talentHandlers,
  github: githubHandlers,
};

export function getActiveHandlers(): any[] {
  if (VITE_USE_MOCKS) {
    return [
      ...identityHandlers,
      ...talentHandlers,
      ...githubHandlers,
    ];
  }

  const handlers: any[] = [];
  for (const svc of VITE_MOCK_SERVICES) {
    const matched = HANDLERS_BY_SERVICE[svc.toLowerCase()];
    if (matched) {
      handlers.push(...matched);
    }
  }
  return handlers;
}

export let worker: SetupWorker | null = null;

export async function startMocks(): Promise<void> {
  const handlers = getActiveHandlers();
  if (handlers.length === 0) {
    return;
  }

  try {
    worker = setupWorker(...handlers);
    await worker.start({
      quiet: true,
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });
  } catch (err) {
    console.warn("[MSW] Could not start service worker:", err);
  }
}
