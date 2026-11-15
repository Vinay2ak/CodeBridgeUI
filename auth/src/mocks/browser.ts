import { setupWorker } from "msw/browser";
import { identityHandlers } from "./handlers/identity";
import { talentHandlers } from "./handlers/talent";
import { githubHandlers } from "./handlers/github";

export const worker = setupWorker(
  ...identityHandlers,
  ...talentHandlers,
  ...githubHandlers
);

export async function startMocks(): Promise<void> {
  try {
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
