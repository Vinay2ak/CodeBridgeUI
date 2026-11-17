import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostProjectPage } from './PostProjectPage';

describe('PostProjectPage', () => {
  it('renders both cards and the submit button', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PostProjectPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Post a new project')).toBeDefined();
    expect(screen.getByText('1. Problem & Scope')).toBeDefined();
    expect(screen.getByText('2. Budget, Timeline & Verification')).toBeDefined();
    expect(screen.getByText('Submit & find developers')).toBeDefined();
  });
});
