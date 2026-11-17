import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '../../app/AppShell';
import { AppRoutes } from '../../app/router';
import * as sessionModule from '../session/session';

function renderShell(initialEntry = '/owner', role: 'owner' | 'admin' = 'admin') {
  vi.spyOn(sessionModule, 'useSession').mockReturnValue({
    status: 'authenticated',
    user: {
      id: `user-${role}`,
      email: `${role}@example.com`,
      displayName: `${role.toUpperCase()} User`,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    accessToken: 'test-token',
    expiresAt: Date.now() + 3600000,
  });

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppShell>
        <div>Page Content</div>
      </AppShell>
    </MemoryRouter>
  );
}

describe('Analytics Routing and Navigation', () => {
  it('renders Analytics link in sidebar for admin user', () => {
    renderShell('/owner', 'admin');
    const analyticsLink = screen.getByRole('link', { name: /analytics/i });
    expect(analyticsLink).toBeInTheDocument();
    expect(analyticsLink).toHaveAttribute('href', '/admin/analytics');
    expect(analyticsLink).not.toHaveAttribute('aria-current');

    vi.restoreAllMocks();
  });

  it('marks Analytics link as active with aria-current="page" on /admin/analytics', () => {
    renderShell('/admin/analytics', 'admin');
    const analyticsLink = screen.getByRole('link', { name: /analytics/i });
    expect(analyticsLink).toBeInTheDocument();
    expect(analyticsLink).toHaveAttribute('aria-current', 'page');

    vi.restoreAllMocks();
  });

  it('does not render Analytics link in sidebar for owner user', () => {
    renderShell('/owner', 'owner');
    expect(screen.queryByRole('link', { name: /analytics/i })).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('redirects non-admin from /admin/analytics', async () => {
    vi.spyOn(sessionModule, 'useSession').mockReturnValue({
      status: 'authenticated',
      user: {
        id: 'user-owner',
        email: 'owner@example.com',
        displayName: 'Owner User',
        role: 'owner',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      accessToken: 'test-token',
      expiresAt: Date.now() + 3600000,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // Non-admin should be redirected to their role route (/owner)
    expect(screen.queryByText(/Platform analytics/i)).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
