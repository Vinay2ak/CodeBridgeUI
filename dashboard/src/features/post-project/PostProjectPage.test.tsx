import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PostProjectPage } from './PostProjectPage';

describe('PostProjectPage', () => {
  it('renders both cards and the submit button', () => {
    render(
      <BrowserRouter>
        <PostProjectPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Post a new project')).toBeDefined();
    expect(screen.getByText('1. Problem & Scope')).toBeDefined();
    expect(screen.getByText('2. Budget, Timeline & Verification')).toBeDefined();
    expect(screen.getByText('Submit & find developers')).toBeDefined();
  });
});
