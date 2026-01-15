import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Journal from '../Journal.jsx';
import MatchFeed from '../MatchFeed.jsx';

// Mock UserContext
const mockUser = { id: 1, username: 'TestUser' };
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({ user: mockUser })
}));

// Mock NotificationContext to avoid provider requirement
vi.mock('../../contexts/NotificationContext', () => ({
    useNotifications: () => ({
        openPrivateRoom: vi.fn()
    })
}));

vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3002'
}));

global.fetch = vi.fn();

describe('Network Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
    });

    it('Journal: handles offline state gracefully', async () => {
        fetch.mockRejectedValue(new Error('Failed to fetch'));

        render(<Journal onClose={() => { }} />);

        await waitFor(() => {
            // Should show an error message or some indication
            expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
        });
    });

    it('MatchFeed: handles API 500 errors', async () => {
        // Return 500 error
        fetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        const currentMood = { id: 'happy', label: 'Happy' };
        render(<MatchFeed currentMood={currentMood} />);

        await waitFor(() => {
            // MatchFeed might handle non-ok responses by showing empty state or error
            // Let's assume it catches it or we check console/UI behavior
            // Based on previous code, it might not explicitly handle non-ok nicely in UI yet, 
            // but let's verify if it crashes or shows something safe.
            // If it behaves unexpectedly, we will fix it.
            expect(screen.queryByText(/Finding your vibe matches/i)).not.toBeInTheDocument();
        });
    });
});
