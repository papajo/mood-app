import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import VibeRoom from '../../components/VibeRoom';
import { UserProvider } from '../../contexts/UserContext';

// Mock API
vi.mock('../../config/api', () => ({
    API_URL: 'http://localhost:3001',
    SOCKET_URL: 'http://localhost:3001'
}));

global.fetch = vi.fn();

// Mock socket.io
const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connected: true,
    disconnect: vi.fn()
};

vi.mock('socket.io-client', () => ({
    default: vi.fn(() => mockSocket)
}));

// Mock user context
const mockUser = { id: 1, username: 'TestUser', avatar: 'avatar.jpg' };
vi.mock('../../contexts/UserContext', () => ({
    useUser: () => ({ user: mockUser }),
    UserProvider: ({ children }) => children
}));

describe('Room Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
        window.socket = mockSocket;
    });

    afterEach(() => {
        delete window.socket;
    });

    describe('Room Joining', () => {
        it('should join a room when mood is set', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
                    roomId: 'happy',
                    userId: 1
                });
            });
        });

        it('should leave previous room when mood changes', async () => {
            const mockMood1 = { id: 'happy', label: 'Happy', emoji: '😊' };
            const mockMood2 = { id: 'chill', label: 'Chill', emoji: '😌' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            const { rerender } = render(<VibeRoom currentMood={mockMood1} />);

            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
                    roomId: 'happy',
                    userId: 1
                });
            });

            vi.clearAllMocks();

            rerender(<VibeRoom currentMood={mockMood2} />);

            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', {
                    roomId: 'happy',
                    userId: 1
                });
                expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
                    roomId: 'chill',
                    userId: 1
                });
            });
        });
    });

    describe('Messaging', () => {
        it('should send a message to the room', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Message/i);
            fireEvent.change(input, { target: { value: 'Hello, room!' } });

            const sendButton = screen.getByRole('button', { name: /send/i }) || 
                              input.closest('form')?.querySelector('button[type="submit"]');
            
            if (sendButton) {
                fireEvent.click(sendButton);

                await waitFor(() => {
                    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
                        roomId: 'happy',
                        userId: 1,
                        text: 'Hello, room!',
                        user: 'TestUser'
                    });
                });
            }
        });

        it('should receive and display messages from other users', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Simulate receiving a message
            const message = {
                id: 999,
                roomId: 'happy',
                userId: 2,
                user: 'OtherUser',
                text: 'Hello from other user!',
                time: '10:00 AM',
                avatar: 'other-avatar.jpg'
            };

            // Find the receive_message handler
            const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'receive_message');
            if (onCall && onCall[1]) {
                act(() => {
                    onCall[1](message);
                });

                await waitFor(() => {
                    expect(screen.getByText('Hello from other user!')).toBeInTheDocument();
                    expect(screen.getByText('OtherUser')).toBeInTheDocument();
                });
            }
        });

        it('should prevent sending empty messages', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            const sendButton = screen.getByRole('button', { name: /send/i }) || 
                              screen.getByRole('button', { type: 'submit' });
            
            if (sendButton) {
                fireEvent.click(sendButton);

                // Should not emit send_message
                expect(mockSocket.emit).not.toHaveBeenCalledWith(
                    'send_message',
                    expect.anything()
                );
            }
        });

        it('should enforce message character limit', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Message/i);
            const longMessage = 'a'.repeat(501);
            fireEvent.change(input, { target: { value: longMessage } });

            const sendButton = screen.getByRole('button', { name: /send/i }) || 
                              input.closest('form')?.querySelector('button[type="submit"]');
            
            if (sendButton) {
                fireEvent.click(sendButton);

                // Should not send message over limit
                expect(mockSocket.emit).not.toHaveBeenCalledWith(
                    'send_message',
                    expect.objectContaining({
                        text: longMessage
                    })
                );
            }
        });
    });

    describe('Typing Indicators', () => {
        it('should emit typing_start when user starts typing', async () => {
            vi.useFakeTimers();
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Message/i);
            fireEvent.change(input, { target: { value: 'Typing...' } });

            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', {
                roomId: 'happy',
                userId: 1
            });

            vi.useRealTimers();
        });

        it('should emit typing_stop when user stops typing', async () => {
            vi.useFakeTimers();
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText(/Message/i);
            fireEvent.change(input, { target: { value: 'Typing...' } });

            act(() => {
                vi.advanceTimersByTime(300);
            });

            // Clear typing
            fireEvent.change(input, { target: { value: '' } });

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(mockSocket.emit).toHaveBeenCalledWith('typing_stop', {
                roomId: 'happy',
                userId: 1
            });

            vi.useRealTimers();
        });

        it('should display typing indicators from other users', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Simulate typing indicator from another user
            const typingData = {
                roomId: 'happy',
                userId: 2,
                username: 'OtherUser'
            };

            const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'user_typing');
            if (onCall && onCall[1]) {
                act(() => {
                    onCall[1](typingData);
                });

                await waitFor(() => {
                    expect(screen.getByText(/OtherUser.*typing/i)).toBeInTheDocument();
                });
            }
        });
    });

    describe('Room Leaving', () => {
        it('should leave room when component unmounts', async () => {
            const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
            
            fetch.mockResolvedValue({
                ok: true,
                json: async () => []
            });

            const { unmount } = render(<VibeRoom currentMood={mockMood} />);

            await waitFor(() => {
                expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
                    roomId: 'happy',
                    userId: 1
                });
            });

            unmount();

            expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', {
                roomId: 'happy',
                userId: 1
            });
        });
    });
});
