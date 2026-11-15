import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  it('renders OwnerDashboard with Talent Directory, Post Project button and Active Projects', async () => {
    renderWithProviders(<OwnerDashboard />);

    // Step 1: Check Talent Directory is prominently rendered
    expect(
      screen.getByText(/Discover Vetted Freelancers & Developers/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post a project/i })).toBeInTheDocument();

    // Step 2: Switch to Active Projects & Escrow Pipeline tab
    const projectsTab = screen.getByRole('button', {
      name: /Active Projects & Escrow Pipeline/i,
    });
    fireEvent.click(projectsTab);

    // Verify Active Projects & Escrow metrics are rendered
    expect(screen.getByText('Active projects')).toBeInTheDocument();
    expect(screen.getByText('Escrow held')).toBeInTheDocument();
    expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
  });
});
