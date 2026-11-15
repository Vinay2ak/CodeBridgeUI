import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('Owner Dashboard Component Rendering', () => {
  it('renders OwnerDashboard with Post Project button and Settings section', () => {
    renderWithProviders(<OwnerDashboard />);
    expect(screen.getByText('Active projects')).toBeInTheDocument();
    expect(screen.getByText('Escrow held')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post a project/i })).toBeInTheDocument();
    expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
  });
});
