import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [chatRequests, setChatRequests] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Recalculate unread count based on current state
    const recalculateUnreadCount = useCallback((hearts, requests) => {
        const unreadHearts = hearts.filter(n => !n.isRead).length;
        const unreadRequests = requests.length;
        setUnreadCount(unreadHearts + unreadRequests);
    }, []);

    // Fetch heart notifications
    const fetchHeartNotifications = useCallback(async (userId) => {
        if (!userId) return;
        
        try {
            const response = await fetch(`${API_URL}/api/hearts/${userId}`);
            if (response.ok) {
                const data = await response.json();
                // Only show recent notifications (last 24 hours)
                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recentNotifications = data.filter(n => 
                    new Date(n.createdAt).getTime() > oneDayAgo
                );
                setNotifications(recentNotifications);
                
                // Recalculate unread count with current chat requests
                setChatRequests(prev => {
                    recalculateUnreadCount(recentNotifications, prev);
                    return prev;
                });
            }
        } catch (err) {
            console.error('Failed to fetch heart notifications:', err);
        }
    }, [recalculateUnreadCount]);

    // Fetch chat requests
    const fetchChatRequests = useCallback(async (userId) => {
        if (!userId) return;
        
        try {
            const response = await fetch(`${API_URL}/api/private-chat/requests/${userId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched chat requests:', data);
                // Only show recent requests (last 24 hours)
                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recentRequests = data.filter(r => {
                    if (!r.createdAt) return false;
                    const requestTime = new Date(r.createdAt).getTime();
                    const isValid = !isNaN(requestTime);
                    if (!isValid) {
                        console.warn('Invalid createdAt for request:', r);
                    }
                    return isValid && requestTime > oneDayAgo;
                });
                console.log('Filtered recent chat requests:', recentRequests.length, 'out of', data.length);
                // Merge with existing requests to avoid losing socket notifications
                setChatRequests(prev => {
                    const merged = [...recentRequests];
                    // Add any requests from prev that aren't in recentRequests (from socket notifications)
                    prev.forEach(req => {
                        if (!merged.some(r => r.id === req.id)) {
                            merged.push(req);
                        }
                    });
                    // Sort by createdAt descending
                    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    
                    // Recalculate unread count with merged requests
                    setNotifications(currentHearts => {
                        recalculateUnreadCount(currentHearts, merged);
                        return currentHearts;
                    });
                    
                    return merged;
                });
            } else {
                console.error('Failed to fetch chat requests:', response.status, response.statusText);
            }
        } catch (err) {
            console.error('Failed to fetch chat requests:', err);
        }
    }, [recalculateUnreadCount]);

    // Mark hearts as read
    const markHeartsAsRead = useCallback(async (userId) => {
        if (!userId) return;
        
        try {
            const response = await fetch(`${API_URL}/api/hearts/${userId}/read`, {
                method: 'PATCH'
            });
            
            if (response.ok) {
                // Update local state
                setNotifications(prev => {
                    const updated = prev.map(n => ({ ...n, isRead: true }));
                    const unreadCount = updated.filter(n => !n.isRead).length;
                    setUnreadCount(prevCount => prevCount - (prev.filter(n => !n.isRead).length));
                    return updated;
                });
            }
        } catch (err) {
            console.error('Failed to mark hearts as read:', err);
        }
    }, []);

    // Accept chat request
    const acceptChatRequest = useCallback(async (requestId, userId) => {
        console.log('Accepting chat request:', { requestId, userId });
        
        try {
            const response = await fetch(`${API_URL}/api/private-chat/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requestId, 
                    userId, 
                    response: 'accept' 
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Chat request accepted:', result);
                
                // Remove from pending requests and update unread count
                setChatRequests(prev => {
                    const updated = prev.filter(req => req.id !== requestId);
                    const removedCount = prev.length - updated.length;
                    setUnreadCount(count => Math.max(0, count - removedCount));
                    return updated;
                });
                
                // Show success feedback and navigate to chat
                if (result.roomId) {
                    console.log('Private chat room ready:', result.roomId);
                    alert(`Chat request accepted! Private chat room #${result.roomId} created. You can now start chatting.`);
                    // TODO: Navigate to private chat room when private chat UI is implemented
                } else {
                    alert('Chat request accepted!');
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to accept chat request');
            }
        } catch (err) {
            console.error('Failed to accept chat request:', err);
            alert(`Error accepting chat request: ${err.message || 'Unknown error'}`);
        }
    }, []);

    // Reject chat request
    const rejectChatRequest = useCallback(async (requestId, userId) => {
        try {
            const response = await fetch(`${API_URL}/api/private-chat/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requestId, 
                    userId, 
                    response: 'reject' 
                })
            });

            if (response.ok) {
                // Remove from pending requests and update unread count
                setChatRequests(prev => {
                    const updated = prev.filter(req => req.id !== requestId);
                    const removedCount = prev.length - updated.length;
                    setUnreadCount(count => Math.max(0, count - removedCount));
                    return updated;
                });
                console.log('Chat request rejected successfully');
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to reject chat request');
            }
        } catch (err) {
            console.error('Failed to reject chat request:', err);
            alert(`Error rejecting chat request: ${err.message || 'Unknown error'}`);
        }
    }, []);

    // Add real-time notification
    const addNotification = useCallback((notification) => {
        if (notification.type === 'heart') {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        } else if (notification.type === 'private_chat_request') {
            // Convert socket notification to chat request format
            const chatRequest = {
                id: notification.requestId,
                requesterId: notification.requesterId,
                requesterUsername: notification.requesterUsername,
                requesterAvatar: notification.requesterAvatar || null,
                createdAt: notification.createdAt || new Date().toISOString()
            };
            setChatRequests(prev => {
                // Check if request already exists to avoid duplicates
                const exists = prev.some(req => req.id === chatRequest.id);
                if (exists) {
                    console.log('Chat request already exists, skipping duplicate');
                    return prev;
                }
                console.log('Adding new chat request to state:', chatRequest);
                const updated = [chatRequest, ...prev];
                // Update unread count based on new state
                setNotifications(currentHearts => {
                    recalculateUnreadCount(currentHearts, updated);
                    return currentHearts;
                });
                return updated;
            });
        } else if (notification.type === 'private_chat_accepted') {
            // Handle chat acceptance notification
            console.log('Chat accepted notification received:', notification);
            if (notification.roomId) {
                // Show notification that chat room was created
                alert(`Private chat room #${notification.roomId} created! You can now start chatting.`);
                // TODO: Navigate to private chat room when UI is implemented
            }
        } else if (notification.type === 'private_chat_rejected') {
            // Handle chat rejection notification
            console.log('Chat rejected notification received:', notification);
        }
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(async (userId) => {
        if (!userId) {
            // If no userId provided, just clear local state
            setNotifications([]);
            setChatRequests([]);
            setUnreadCount(0);
            return;
        }
        
        try {
            // Delete all heart notifications for user
            const heartsResponse = await fetch(`${API_URL}/api/hearts/${userId}`, {
                method: 'DELETE'
            });
            
            // Delete all pending chat requests for user
            const requestsResponse = await fetch(`${API_URL}/api/private-chat/requests/${userId}`, {
                method: 'DELETE'
            });
            
            if (heartsResponse.ok || requestsResponse.ok) {
                // Clear local state
                setNotifications([]);
                setChatRequests([]);
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Failed to clear notifications:', err);
            // Still clear local state even if API call fails
            setNotifications([]);
            setChatRequests([]);
            setUnreadCount(0);
        }
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                chatRequests,
                unreadCount,
                fetchHeartNotifications,
                fetchChatRequests,
                markHeartsAsRead,
                acceptChatRequest,
                rejectChatRequest,
                addNotification,
                clearAllNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;