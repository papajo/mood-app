import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import App from '../../App';
import { UserProvider } from '../../contexts/UserContext';

global.fetch = vi.fn();

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

describe('Chat Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should allow user to send message in chat room', async () => {
        localStorage.setItem('userId', '1');
        localStorage.setItem('username', 'TestUser');

        // Mock user fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                username: 'TestUser',
                avatar: null,
                status: 'Test',
                currentMoodId: 'happy',
            }),
        });

        // Mock mood fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'happy' }),
        });

        // Mock messages fetch
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const user = userEvent.setup();
        render(
            <UserProvider>
                <App />
            </UserProvider>
        );

        // Wait for app to load
        await waitFor(() => {
            expect(screen.getByText(/Rooms/i)).toBeInTheDocument();
        });

        // Click Rooms tab
        const roomsTab = screen.getByText(/Rooms/i);
        await user.click(roomsTab);

        // Wait for chat interface
        await waitFor(() => {
            const input = screen.getByPlaceholderText(/Message/i);
            expect(input).toBeInTheDocument();
        });

        // Type and send message
        const input = screen.getByPlaceholderText(/Message/i);
        await user.type(input, 'Hello, world!');
        
        const sendButton = screen.getByRole('button', { name: /send/i }) || 
                          screen.getByLabelText(/send/i) ||
                          input.closest('form')?.querySelector('button[type="submit"]');
        
        if (sendButton) {
            await user.click(sendButton);
            
            // Verify socket emit was called
            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith(
                    'send_message',
                    expect.objectContaining({
                        text: 'Hello, world!',
                    })
                );
            });
        }
    });
});
