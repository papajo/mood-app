import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import VibeRoom from '../VibeRoom.jsx';

// Mock Socket.io
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket)
}));

// Mock user context
const mockUser = { id: 123, username: 'TestUser', avatar: 'https://example.com/avatar.jpg' };
vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({ user: mockUser })
}));

// Mock API
vi.mock('../../config/api', () => ({
  API_URL: 'http://localhost:3001',
  SOCKET_URL: 'http://localhost:3001'
}));

global.fetch = vi.fn();

describe('VibeRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });
  });

  it('connects to socket and joins room on mount', async () => {
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join_room', {
        roomId: 'happy',
        userId: 123
      });
    });
  });

  it('sends a message when form is submitted', async () => {
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const input = screen.getByPlaceholderText(/Message #Happy/);
    fireEvent.change(input, { target: { value: 'Hello World' } });

    const sendBtn = screen.getByRole('button', { name: '' }); // Send icon button usually has no aria-label text if not specified, but we can find by type submit
    fireEvent.click(sendBtn);

    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.objectContaining({
      roomId: 'happy',
      text: 'Hello World',
      userId: 123,
      user: 'TestUser'
    }));
  });

  it('emits typing indicators', async () => {
    vi.useFakeTimers();
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    const input = screen.getByPlaceholderText(/Message #Happy/);
    fireEvent.change(input, { target: { value: 'Typing...' } });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing_start', expect.objectContaining({
      roomId: 'happy',
      userId: 123
    }));

    // Wait for debounce/timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('typing_stop', expect.objectContaining({
      roomId: 'happy',
      userId: 123
    }));

    vi.useRealTimers();
  });

  it('displays received messages from socket', async () => {
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    // Simulate receiving a message
    const message = {
      id: 999,
      roomId: 'happy',
      userId: 456,
      user: 'OtherUser',
      text: 'Incoming message',
      time: '10:00 AM'
    };

    // Wait for initial fetch to complete and loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      // Or check that the empty message list or a known element is present
      // Since list is empty, maybe check for 'is typing' container or just the absence of loader
    });

    // Find the 'receive_message' handler and call it
    const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'receive_message');
    expect(onCall).toBeDefined();

    const handler = onCall[1];
    act(() => {
      handler(message);
    });

    await waitFor(() => {
      expect(screen.getByText('Incoming message')).toBeInTheDocument();
      expect(screen.getByText('OtherUser')).toBeInTheDocument();
    });
  });
  it('prevents sending empty messages', async () => {
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    // Should not emit send_message
    expect(mockSocket.emit).not.toHaveBeenCalledWith('send_message', expect.anything());
  });

  it('prevents sending messages over character limit', async () => {
    const mockMood = { id: 'happy', label: 'Happy', emoji: '😊' };
    render(<VibeRoom currentMood={mockMood} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Message #Happy/);
    const longMessage = 'a'.repeat(501);
    fireEvent.change(input, { target: { value: longMessage } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    // Might show error or just not send
    expect(mockSocket.emit).not.toHaveBeenCalledWith('send_message', expect.anything());
    // Ideally check for error toast if UI supports it
  });
});
