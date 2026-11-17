import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders Analytics link in sidebar for admin user', () => {
    renderShell('/owner', 'admin');
    const analyticsLinks = screen.getAllByRole('link', { name: /analytics/i });
    expect(analyticsLinks.length).toBeGreaterThanOrEqual(1);
    expect(analyticsLinks[0]).toHaveAttribute('href', '/admin/analytics');
    expect(analyticsLinks[0]).not.toHaveAttribute('aria-current');

    vi.restoreAllMocks();
  });

  it('marks Analytics link as active with aria-current="page" on /admin/analytics', () => {
    renderShell('/admin/analytics', 'admin');
    const analyticsLinks = screen.getAllByRole('link', { name: /analytics/i });
    expect(analyticsLinks.length).toBeGreaterThanOrEqual(1);
    expect(analyticsLinks.some((l) => l.getAttribute('aria-current') === 'page')).toBe(true);

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

    // Non-admin should be redirected to their role route (/owner) and NOT see the standalone Admin / Analytics breadcrumb
    expect(screen.queryByText('Admin / Analytics')).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
