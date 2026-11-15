import React, { useEffect, lazy, Suspense } from 'react';
import { Providers } from './app/providers';
import { AppRoutes } from './app/router';
import { restoreSession, useSession } from './features/session/session';
import { env } from './lib/env';
import { startRealtime, stopRealtime, registerLiveToastHandler } from './realtime/manager';
import { useToast } from './components/ui/Toast';
import { formatEventSentence } from './realtime/formatEvent';

const DevDrawer = lazy(() =>
  import('./devtools/DevDrawer').then((m) => ({ default: m.DevDrawer }))
);

const AppContent: React.FC = () => {
  const { status, accessToken } = useSession();
  const { addToast } = useToast();

  // Register live toast handler
  useEffect(() => {
    registerLiveToastHandler((event) => {
      addToast({
        title: formatEventSentence(event),
        description: `${event.source} • just now`,
        type:
          event.type === 'service.degraded'
            ? 'warning'
            : event.type.startsWith('payment.')
            ? 'info'
            : 'info',
      });
    });
  }, [addToast]);

  // Restore session on load
  useEffect(() => {
    restoreSession().catch(() => {
      // Handled by AuthGuard
    });
  }, []);

  // Realtime lifecycle: starts once session is authenticated, stops on logout
  useEffect(() => {
    if (status === 'authenticated' && accessToken) {
      startRealtime();
    } else if (status === 'anonymous' || status === 'expired' || status === 'suspended') {
      stopRealtime();
    }
  }, [status, accessToken]);

  return (
    <>
      <AppRoutes />
      {env.VITE_DEV_TOOLS && (
        <Suspense fallback={null}>
          <DevDrawer />
        </Suspense>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
};

export default App;
