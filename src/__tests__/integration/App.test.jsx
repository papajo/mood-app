import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { UserProvider } from '../../contexts/UserContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock API
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
});

// Mock socket.io
vi.mock('socket.io-client', () => ({
    default: vi.fn(() => ({
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        disconnect: vi.fn(),
    })),
}));

describe('App Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Ensure fetch always returns a promise unless overridden by mockResolvedValueOnce
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({})
        });
    });

    it('should render app and create user on first load', async () => {
        // Mock user creation
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'TestUser123',
                avatar: null,
                status: 'Just joined!',
                currentMoodId: null,
            }),
        });

        // Mock notifications (hearts + chat requests) - App fetches these BEFORE mood fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        render(
            <UserProvider>
                <NotificationProvider>
                    <App />
                </NotificationProvider>
            </UserProvider>
        );

        // Should show loading initially
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        // Wait for user to be created
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/users'),
                expect.objectContaining({ method: 'POST' })
            );
        }, { timeout: 3000 });
    });

    it('should display mood tracker after user loads', async () => {
        // Mock existing user
        localStorage.setItem('userId', '1');
        localStorage.setItem('username', 'TestUser');

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'TestUser',
                avatar: null,
                status: 'Test status',
                currentMoodId: null,
            }),
        });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        render(
            <UserProvider>
                <NotificationProvider>
                    <App />
                </NotificationProvider>
            </UserProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/How's the energy/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should switch between tabs', async () => {
        localStorage.setItem('userId', '1');
        localStorage.setItem('username', 'TestUser');

        // Use URL-based fetch mocking to avoid brittle call ordering
        fetch.mockImplementation(async (input) => {
            const url = String(input);
            if (url.includes('/api/users/1')) {
                return {
                    ok: true,
                    json: async () => ({
                        id: 1,
                        username: 'TestUser',
                        avatar: null,
                        status: 'Test',
                        currentMoodId: null,
                    }),
                };
            }
            if (url.includes('/api/hearts/')) {
                return { ok: true, json: async () => [] };
            }
            if (url.includes('/api/private-chat/requests/')) {
                return { ok: true, json: async () => [] };
            }
            if (url.includes('/api/mood/')) {
                return { ok: true, json: async () => null };
            }
            if (url.includes('/api/journal/')) {
                return { ok: true, json: async () => [] };
            }
            // Default safe response
            return { ok: true, json: async () => [] };
        });

        const userEvent = (await import('@testing-library/user-event')).userEvent.setup();

        render(
            <UserProvider>
                <NotificationProvider>
                    <App />
                </NotificationProvider>
            </UserProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Feed/i)).toBeInTheDocument();
        });

        // Click on Journal tab
        const journalTab = await screen.findByText(/Journal/i, {}, { timeout: 5000 });
        await userEvent.click(journalTab);

        // Should show journal content
        await waitFor(() => {
            expect(screen.getByText(/Daily Reflection/i)).toBeInTheDocument();
        });
    });
});
