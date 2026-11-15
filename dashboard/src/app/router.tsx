import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { AuthGuard, FreelancerRedirect, FullScreenSkeleton } from './guards';
import { ErrorBoundary } from './ErrorBoundary';
import { NotFound } from './NotFound';

const OwnerDashboard = lazy(() => import('../features/dashboard/OwnerDashboard'));

export const AppRoutes: React.FC = () => {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<FullScreenSkeleton />}>
          <Routes>
            <Route
              path="/"
              element={
                <ErrorBoundary fallbackTitle="Owner Dashboard Error">
                  <OwnerDashboard />
                </ErrorBoundary>
              }
            />
            <Route
              path="/owner"
              element={
                <ErrorBoundary fallbackTitle="Owner Dashboard Error">
                  <OwnerDashboard />
                </ErrorBoundary>
              }
            />
            {/* Legacy admin route redirects to owner */}
            <Route path="/admin" element={<Navigate to="/owner" replace />} />
            {/* Freelancer route redirects to Freelancer Workspace on port 5177 */}
            <Route path="/freelancer" element={<FreelancerRedirect />} />
            <Route
              path="*"
              element={
                <ErrorBoundary fallbackTitle="Page Error">
                  <NotFound />
                </ErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
};

export default AppRoutes;
