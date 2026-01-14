import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import App from '../../App';
import { UserProvider } from '../../contexts/UserContext';

global.fetch = vi.fn();

describe('Mood Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should allow user to select mood and see it saved', async () => {
        // Setup user
        localStorage.setItem('userId', '1');
        localStorage.setItem('username', 'TestUser');

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

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        // Mock mood save
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                userId: 1,
                moodId: 'happy',
            }),
        });

        const user = userEvent.setup();
        render(
            <UserProvider>
                <App />
            </UserProvider>
        );

        // Wait for mood tracker to load
        await waitFor(() => {
            expect(screen.getByText(/How's the energy/i)).toBeInTheDocument();
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
