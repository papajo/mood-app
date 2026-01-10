import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Journal from '../Journal.jsx';

// Mock UserContext to provide a deterministic user
vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({ user: { id: 1, username: 'TestUser' } })
}));

vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3001'
}));

global.fetch = vi.fn();

describe('Journal Component - Robust Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('renders journal interface after load', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<Journal onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Daily Reflection')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/How are you feeling right now/)).toBeInTheDocument();
    });
  });

  it('displays error when fetch fails on load', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<Journal onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });
});
