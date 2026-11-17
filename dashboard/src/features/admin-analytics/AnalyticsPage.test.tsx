import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AnalyticsPage } from './AnalyticsPage';
import * as probeModule from './probe';
import * as sessionModule from '../session/session';
import { env } from '../../lib/env';

describe('AnalyticsPage component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. renders not configured state when VITE_GRAFANA_URL is empty', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = '';

    render(<AnalyticsPage />);

    expect(screen.getByText('Admin / Analytics')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Platform metrics from Grafana.')).toBeInTheDocument();
    expect(screen.getByText('Analytics is not configured')).toBeInTheDocument();

    env.VITE_GRAFANA_URL = originalUrl;
  });

  it('2. renders unreachable state when Grafana probe fails', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = 'http://offline.local:3001/d/123/dash?orgId=1';

    vi.spyOn(probeModule, 'probeGrafana').mockResolvedValue('unreachable');

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Can't reach Grafana")).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open in grafana/i }).length).toBeGreaterThanOrEqual(1);

    env.VITE_GRAFANA_URL = originalUrl;
  });

  it('3. renders connected status and iframe when probe succeeds', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = 'http://backend.local:3001/d/analytics?orgId=1';

    vi.spyOn(probeModule, 'probeGrafana').mockResolvedValue('reachable');

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('CodeBridge platform analytics (Grafana)');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    expect(iframe).toHaveAttribute('referrerPolicy', 'no-referrer');
    expect(iframe).not.toHaveAttribute('allow');

    env.VITE_GRAFANA_URL = originalUrl;
  });

  it('4. updates time range and persists to session storage', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = 'http://backend.local:3001/d/analytics?orgId=1';

    vi.spyOn(probeModule, 'probeGrafana').mockResolvedValue('reachable');

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    const radio7d = screen.getByRole('radio', { name: '7 days' });
    fireEvent.click(radio7d);

    const saved = JSON.parse(sessionStorage.getItem('cb-analytics-prefs-v1') || '{}');
    expect(saved.range).toBe('7d');

    env.VITE_GRAFANA_URL = originalUrl;
  });

  it('5. appends var-owner_id=<user.id> when an owner user is authenticated', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = 'http://backend.local:3001/d/analytics?orgId=1';

    vi.spyOn(probeModule, 'probeGrafana').mockResolvedValue('reachable');
    vi.spyOn(sessionModule, 'useSession').mockReturnValue({
      status: 'authenticated',
      user: {
        id: 'owner-uuid-456',
        email: 'owner@example.com',
        displayName: 'Owner User',
        role: 'owner',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'token-123',
      expiresAt: Date.now() + 3600000,
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('CodeBridge platform analytics (Grafana)');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('var-owner_id=owner-uuid-456')
    );

    env.VITE_GRAFANA_URL = originalUrl;
  });

  it('6. appends var-owner_id=All when an admin user is authenticated', async () => {
    const originalUrl = env.VITE_GRAFANA_URL;
    env.VITE_GRAFANA_URL = 'http://backend.local:3001/d/analytics?orgId=1';

    vi.spyOn(probeModule, 'probeGrafana').mockResolvedValue('reachable');
    vi.spyOn(sessionModule, 'useSession').mockReturnValue({
      status: 'authenticated',
      user: {
        id: 'admin-uuid-789',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: 'admin',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
      },
      accessToken: 'token-123',
      expiresAt: Date.now() + 3600000,
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('CodeBridge platform analytics (Grafana)');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('var-owner_id=All')
    );

    env.VITE_GRAFANA_URL = originalUrl;
  });
});
