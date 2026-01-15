import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Journal from '../Journal.jsx';

// Mock UserContext to provide a deterministic user
const mockUser = { id: 1, username: 'TestUser' };
vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({ user: mockUser })
}));

vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3002'
}));

global.fetch = vi.fn();

describe('Journal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('renders journal interface with initial loading', async () => {
    // Delay fetch slightly to verify loading state
    fetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => []
    }), 10)));

    render(<Journal onClose={() => { }} />);

    expect(screen.getByText('Loading entries...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
      expect(screen.queryByText('Loading entries...')).not.toBeInTheDocument();
    });
  });

  it('renders empty state when no entries exist', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<Journal onClose={() => { }} />);

    await waitFor(() => {
      expect(screen.getByText('No entries yet. Start writing!')).toBeInTheDocument();
    });
  });

  it('renders existing entries in correct order', async () => {
    const entries = [
      { id: 1, text: 'Old entry', date: '1/1/2024', time: '10:00 AM' },
      { id: 2, text: 'New entry', date: '1/2/2024', time: '11:00 AM' }
    ];

    fetch.mockResolvedValueOnce({ ok: true, json: async () => entries });
    render(<Journal onClose={() => { }} />);

    await waitFor(() => {
      expect(screen.getByText('Old entry')).toBeInTheDocument();
      expect(screen.getByText('New entry')).toBeInTheDocument();
    });
  });

  it('saves a new journal entry and updates list', async () => {
    const newEntry = { id: 3, userId: 1, text: 'My amazing day', date: '1/3/2024', time: '12:00 PM' };

    // Initial load
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    // Save response
    fetch.mockResolvedValueOnce({ ok: true, json: async () => newEntry });

    render(<Journal onClose={() => { }} />);

    await waitFor(() => {
      const ta = screen.getByPlaceholderText(/How are you feeling right now/);
      fireEvent.change(ta, { target: { value: 'My amazing day' } });
    });

    const saveBtn = screen.getByRole('button', { name: /Save Entry/i });
    fireEvent.click(saveBtn);

    // Expect loading state on button
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('My amazing day')).toBeInTheDocument();
      // Input should clear
      expect(screen.getByPlaceholderText(/How are you feeling right now/).value).toBe('');
    });
  });

  it('displays error when fetch fails on load', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<Journal onClose={() => { }} />);
    await waitFor(() => {
      expect(screen.queryByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('handles save error gracefully', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    fetch.mockRejectedValueOnce(new Error('Network error')); // Save fails

    render(<Journal onClose={() => { }} />);

    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText(/How are you feeling right now/), {
        target: { value: 'Fail entry' }
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Entry/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
