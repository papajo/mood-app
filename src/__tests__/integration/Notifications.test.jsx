import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../../contexts/NotificationContext';
import NotificationPanel from '../../components/NotificationPanel';
import { UserProvider, useUser } from '../../contexts/UserContext';

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
    connected: true
};

vi.mock('socket.io-client', () => ({
    default: vi.fn(() => mockSocket)
}));

// Test component that uses notifications
function TestComponent() {
    const { notifications, chatRequests, clearAllNotifications, acceptChatRequest, rejectChatRequest, fetchHeartNotifications, fetchChatRequests } = useNotifications();
    const { user } = useUser();
    
    // Trigger fetches on mount
    React.useEffect(() => {
        if (user) {
            fetchHeartNotifications(user.id);
            fetchChatRequests(user.id);
        }
    }, [user, fetchHeartNotifications, fetchChatRequests]);
    
    return (
        <div>
            <div data-testid="hearts-count">{notifications.length}</div>
            <div data-testid="requests-count">{chatRequests.length}</div>
            <button onClick={() => clearAllNotifications(user?.id)}>Clear All</button>
            {chatRequests.map(req => (
                <div key={req.id}>
                    <button onClick={() => acceptChatRequest(req.id, user?.id)}>Accept</button>
                    <button onClick={() => rejectChatRequest(req.id, user?.id)}>Reject</button>
                </div>
            ))}
        </div>
    );
}

describe('Notification Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        fetch.mockClear();
    });

    describe('Heart Notifications', () => {
        it('should fetch and display heart notifications', async () => {
            const mockNotifications = [
                {
                    id: 1,
                    senderId: 2,
                    senderUsername: 'TestSender',
                    senderAvatar: 'avatar.jpg',
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockNotifications
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            // Wait for notifications to load - need to trigger fetch
            await waitFor(() => {
                expect(fetch).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Wait for state update
            await waitFor(() => {
                const countElement = screen.getByTestId('hearts-count');
                expect(countElement).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        it('should filter out notifications older than 24 hours', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 2); // 2 days ago

            const mockNotifications = [
                {
                    id: 1,
                    senderId: 2,
                    senderUsername: 'OldSender',
                    senderAvatar: 'avatar.jpg',
                    isRead: false,
                    createdAt: oldDate.toISOString()
                },
                {
                    id: 2,
                    senderId: 3,
                    senderUsername: 'RecentSender',
                    senderAvatar: 'avatar.jpg',
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockNotifications
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            // Should only show recent notification
            await waitFor(() => {
                const count = screen.getByTestId('hearts-count').textContent;
                expect(parseInt(count)).toBeLessThanOrEqual(1);
            });
        });

        it('should clear all heart notifications', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        id: 1,
                        senderId: 2,
                        senderUsername: 'TestSender',
                        senderAvatar: 'avatar.jpg',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    }
                ]
            });

            // Mock DELETE endpoint
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('hearts-count')).toHaveTextContent('1');
            });

            const clearButton = screen.getByText('Clear All');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3001/api/hearts/1',
                    expect.objectContaining({ method: 'DELETE' })
                );
            });
        });
    });

    describe('Chat Requests', () => {
        it('should fetch and display chat requests', async () => {
            const mockRequests = [
                {
                    id: 1,
                    requesterId: 2,
                    requesterUsername: 'TestRequester',
                    requesterAvatar: 'avatar.jpg',
                    createdAt: new Date().toISOString()
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRequests
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('requests-count')).toHaveTextContent('1');
            });
        });

        it('should accept a chat request', async () => {
            const mockRequests = [
                {
                    id: 1,
                    requesterId: 2,
                    requesterUsername: 'TestRequester',
                    requesterAvatar: 'avatar.jpg',
                    createdAt: new Date().toISOString()
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRequests
            });

            // Mock accept response
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, roomId: 123 })
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('requests-count')).toHaveTextContent('1');
            });

            const acceptButton = screen.getByText('Accept');
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3001/api/private-chat/respond',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({
                            requestId: 1,
                            userId: 1,
                            response: 'accept'
                        })
                    })
                );
            });
        });

        it('should reject a chat request', async () => {
            const mockRequests = [
                {
                    id: 1,
                    requesterId: 2,
                    requesterUsername: 'TestRequester',
                    requesterAvatar: 'avatar.jpg',
                    createdAt: new Date().toISOString()
                }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockRequests
            });

            // Mock reject response
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            render(
                <UserProvider>
                    <NotificationProvider>
                        <TestComponent />
                    </NotificationProvider>
                </UserProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('requests-count')).toHaveTextContent('1');
            });

            const rejectButton = screen.getByText('Reject');
            fireEvent.click(rejectButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(
                    'http://localhost:3001/api/private-chat/respond',
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({
                            requestId: 1,
                            userId: 1,
                            response: 'reject'
                        })
                    })
                );
            });
        });
    });
});
