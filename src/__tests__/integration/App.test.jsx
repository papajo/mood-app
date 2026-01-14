import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { UserProvider } from '../../contexts/UserContext';

// Mock API
global.fetch = vi.fn();

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

        // Mock mood fetch (no mood yet)
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => null,
        });

        render(
            <UserProvider>
                <App />
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
            json: async () => null,
        });

        render(
            <UserProvider>
                <App />
            </UserProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/How's the energy/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should switch between tabs', async () => {
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

        const { user } = await import('@testing-library/user-event');
        const userEvent = user.setup();

        render(
            <UserProvider>
                <App />
            </UserProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Feed/i)).toBeInTheDocument();
        });

        // Click on Journal tab
        const journalTab = screen.getByText(/Journal/i);
        await userEvent.click(journalTab);

        // Should show journal content
        await waitFor(() => {
            expect(screen.getByText(/Daily Reflection/i)).toBeInTheDocument();
        });
    });
});
