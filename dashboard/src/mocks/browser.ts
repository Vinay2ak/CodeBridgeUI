import { setupWorker } from 'msw/browser';
import { handlers, serviceHandlers } from './handlers';

export { serviceHandlers };

export async function startWorker(mockServices?: string[]): Promise<void> {
  let activeHandlers = handlers;
  if (mockServices && mockServices.length > 0) {
    activeHandlers = mockServices.flatMap(
      (svc) => serviceHandlers[svc.trim()] || []
    );
  }

  const worker = setupWorker(...activeHandlers);
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
}
