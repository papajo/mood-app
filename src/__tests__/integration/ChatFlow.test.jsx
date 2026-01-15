import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import VibeRoom from '../../components/VibeRoom';

global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({})
});

// Mock socket.io
const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
    default: vi.fn(() => mockSocket),
}));

// Mock API config
vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3002',
    SOCKET_URL: 'http://localhost:3002'
}));

// Mock user context (VibeRoom requires a user)
const mockUser = { id: 1, username: 'TestUser', avatar: null };
vi.mock('../../contexts/UserContext', async () => {
    const actual = await vi.importActual('../../contexts/UserContext');
    return {
        ...actual,
        useUser: () => ({ user: mockUser, loading: false, error: null }),
        UserProvider: ({ children }) => children
    };
});

describe('Chat Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Ensure fetch always returns a promise unless overridden by mockResolvedValueOnce
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({})
        });
    });

    it('should allow user to send message in chat room', async () => {
        // Mock messages history fetch
        fetch.mockImplementation(async (input) => {
            const url = String(input);
            if (url.includes('/api/messages/')) return { ok: true, json: async () => [] };
            if (url.includes('/api/users/')) return { ok: true, json: async () => ({ avatar: null }) };
            return { ok: true, json: async () => [] };
        });

        const user = userEvent.setup();
        render(<VibeRoom currentMood={{ id: 'happy', label: 'Vibing', emoji: '😊' }} />);

        await waitFor(() => {
            expect(mockSocket.emit).toHaveBeenCalledWith('join_room', { roomId: 'happy', userId: 1 });
        });

        const input = await screen.findByRole('textbox');

        // Type and send message
        await user.type(input, 'Hello, world!');
        
        // Find send button - it's a submit button in the form
        const form = input.closest('form');
        const sendButton = form?.querySelector('button[type="submit"]');
        
        expect(sendButton).toBeTruthy();
        expect(sendButton.disabled).toBe(false);

        await user.click(sendButton);

        // Verify socket emit was called (VibeRoom emits typing_stop first; match send_message loosely)
        await waitFor(() => {
            const sendCalls = mockSocket.emit.mock.calls.filter(call => call[0] === 'send_message');
            expect(sendCalls.length).toBeGreaterThan(0);
            expect(sendCalls[0][1]).toEqual(expect.objectContaining({
                roomId: 'happy',
                userId: 1,
                user: 'TestUser',
                text: 'Hello, world!'
            }));
        }, { timeout: 2000 });
    });
});
