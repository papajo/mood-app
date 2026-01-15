import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MatchFeed from '../MatchFeed';

// Mock API
vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3002'
}));

global.fetch = vi.fn();

// Mock UserContext
const mockHookUser = { id: 1, username: 'TestUser' };
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({ user: mockHookUser })
}));

// Mock NotificationContext
vi.mock('../../contexts/NotificationContext', () => ({
    useNotifications: () => ({
        openPrivateRoom: vi.fn()
    })
}));

describe('MatchFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show prompt when no mood is selected', () => {
        render(<MatchFeed currentMood={null} />);
        expect(screen.getByText(/Select a mood to find your tribe/i)).toBeInTheDocument();
    });

    it('should show loading state when fetching matches', async () => {
        fetch.mockImplementationOnce(() => new Promise(() => { })); // Never resolves
        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);
        expect(screen.getByText(/Finding your vibe matches/i)).toBeInTheDocument();
    });

    it('should display matches and filter out current user', async () => {
        const mockMatches = [
            { id: 1, name: 'TestUser', avatar: 'me.jpg' }, // Current user (should be filtered)
            { id: 2, name: 'MatchUser', avatar: 'avatar.jpg', status: 'Chilling' }
        ];

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockMatches
        });

        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);

        await waitFor(() => {
            // Should show MatchUser
            expect(screen.getByText('MatchUser')).toBeInTheDocument();
            // Should NOT show TestUser (filtered out)
            expect(screen.queryByText('TestUser')).not.toBeInTheDocument();
        });
    });

    it('should show empty state when no matches found', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        const currentMood = { id: 'happy', label: 'Vibing' };
        render(<MatchFeed currentMood={currentMood} />);

        await waitFor(() => {
            expect(screen.getByText(/No one else is feeling this exact vibe/i)).toBeInTheDocument();
        });
    });

    it('should display "Coming Soon" features', () => {
        const currentMood = { id: 'happy', label: 'Vibing' };
        // Return empty to avoid loading state logic blocking view
        fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

        render(<MatchFeed currentMood={currentMood} />);
        expect(screen.getByText(/Spotify Integration Coming Soon/i)).toBeInTheDocument();
    });
});
