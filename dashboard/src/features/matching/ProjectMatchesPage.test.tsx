import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectMatchesPage } from './ProjectMatchesPage';

describe('ProjectMatchesPage', () => {
  it('renders project matches page skeleton and toolbar', async () => {
    render(
      <MemoryRouter initialEntries={['/owner/projects/proj-1']}>
        <Routes>
          <Route path="/owner/projects/:projectId" element={<ProjectMatchesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Back to Projects')).toBeDefined();
    expect(screen.getByText('Recommended Developers')).toBeDefined();
    expect(screen.getByText('Fits budget')).toBeDefined();
    expect(screen.getByText('Available now')).toBeDefined();
  });
});
