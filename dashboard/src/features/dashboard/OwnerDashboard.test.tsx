import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OwnerDashboard from './OwnerDashboard';
import { ToastProvider } from '../../components/ui/Toast';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{ui}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Owner Dashboard Component Rendering', () => {
  it('renders OwnerDashboard with Project Overview, Post Project button, Active Projects metrics and Platform Analytics', async () => {
    renderWithProviders(<OwnerDashboard />);

    // Step 1: Check Project Overview header and post button
    expect(screen.getByText('Project Overview')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /post a project/i })
    ).toBeInTheDocument();

    // Step 2: Verify Active Projects & Escrow metrics are rendered
    expect(screen.getByText('Active projects')).toBeInTheDocument();
    expect(screen.getByText('Escrow held')).toBeInTheDocument();

    // Step 3: Verify Platform Analytics is rendered on the overview page
    expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    expect(screen.getByText('Platform metrics from Grafana.')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /time range/i })).toBeInTheDocument();
  });

  it('renders Settings view when hash is #settings', async () => {
    window.location.hash = '#settings';
    renderWithProviders(<OwnerDashboard />);
    expect(screen.getAllByText('Settings & Preferences').length).toBeGreaterThanOrEqual(1);
    window.location.hash = '';
  });

  it('renders Projects view when hash is #projects', async () => {
    window.location.hash = '#projects';
    renderWithProviders(<OwnerDashboard />);
    expect(screen.getAllByRole('heading', { name: 'Projects' }).length).toBeGreaterThanOrEqual(1);
    window.location.hash = '';
  });
});
