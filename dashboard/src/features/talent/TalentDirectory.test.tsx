import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TalentDirectory } from './TalentDirectory';

describe('TalentDirectory Component', () => {
  it('renders talent cards, allows search and opens developer profile drawer', async () => {
    const handleSelectDev = vi.fn();
    const handlePostOpen = vi.fn();

    render(
      <TalentDirectory
        onSelectDeveloperForProject={handleSelectDev}
        onPostOpenProject={handlePostOpen}
      />
    );

    // Verify Title & Hero
    expect(
      screen.getByText(/Discover Vetted Freelancers & Developers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Post Open Project Directly/i })
    ).toBeInTheDocument();

    // Verify curated developer cards are displayed
    await waitFor(() => {
      expect(screen.getByText('Alex Chen')).toBeInTheDocument();
      expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    });

    // Test filter pills
    const backendPill = screen.getByRole('button', { name: /Backend & APIs/i });
    fireEvent.click(backendPill);
    expect(screen.getByText('Alex Chen')).toBeInTheDocument();

    // Reset to All Vetted Devs before searching
    const allPill = screen.getByRole('button', { name: /All Vetted Devs/i });
    fireEvent.click(allPill);

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search by name, skill/i);
    fireEvent.change(searchInput, { target: { value: 'Stripe' } });
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.queryByText('Elena Rostova')).not.toBeInTheDocument();

    // Open profile drawer
    const viewProfileBtns = screen.getAllByRole('button', { name: /View Profile/i });
    fireEvent.click(viewProfileBtns[0]);

    // Check that drawer is visible
    expect(screen.getByText(/Verified Specialist/i)).toBeInTheDocument();
    expect(screen.getByText(/Repo Doctor Code Quality/i)).toBeInTheDocument();

    // Click "Post Project for Alex" from drawer
    const postForDevBtn = screen.getByRole('button', {
      name: /Post Project for Alex/i,
    });
    fireEvent.click(postForDevBtn);
    expect(handleSelectDev).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alex Chen' })
    );
  });
});
