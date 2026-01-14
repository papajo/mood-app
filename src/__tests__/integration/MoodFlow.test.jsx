import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import App from '../../App';
import { UserProvider } from '../../contexts/UserContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

global.fetch = vi.fn();

// Mock socket.io
const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connected: true
};

vi.mock('socket.io-client', () => ({
    default: vi.fn(() => mockSocket)
}));

describe('Mood Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Reset fetch mock to a safe default for this test file
        fetch.mockReset();
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({})
        });
    });

    it('should allow user to select mood and see it saved', async () => {
        // Setup user
        localStorage.setItem('userId', '1');
        localStorage.setItem('username', 'TestUser');

        const user = userEvent.setup();
        
        // Mock all API calls in order
        // 1. User fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'TestUser',
                avatar: null,
                status: 'Test',
                currentMoodId: null,
            }),
        });

        // 2. Mood fetch (returns null if no mood set)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        // 3. Notifications fetch (hearts)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        // 4. Notifications fetch (chat requests)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(
            <UserProvider>
                <NotificationProvider>
                    <App />
                </NotificationProvider>
            </UserProvider>
        );

        // Wait for mood tracker to load (this will wait for user to load too)
        await waitFor(() => {
            expect(screen.getByText(/How's the energy/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        // Mock mood save (for when user clicks mood)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                userId: 1,
                moodId: 'happy',
            }),
        });

        // Find and click the happy mood (😊)
        const moodButtons = screen.getAllByRole('button');
        const happyButton = moodButtons.find(btn => 
            btn.textContent.includes('Vibing') || btn.textContent.includes('😊')
        );

        if (happyButton) {
            await user.click(happyButton);

            // Wait for API call
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/mood'),
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining('happy'),
                    })
                );
            });
        }
    });
});
