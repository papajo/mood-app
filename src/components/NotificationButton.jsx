import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import NotificationPanel from './NotificationPanel';

const NotificationButton = () => {
    const { unreadCount, addNotification, fetchChatRequests } = useNotifications();
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const socketListenersRef = useRef({});

    useEffect(() => {
        if (!user) return;
        
        // Wait for socket to be available
        if (!window.socket) {
            console.log('Socket not available yet, waiting...');
            const checkSocket = setInterval(() => {
                if (window.socket && window.socket.connected) {
                    clearInterval(checkSocket);
                    // Force re-run by updating a state or dependency
                }
            }, 100);
            
            return () => clearInterval(checkSocket);
        }
        
        if (!window.socket.connected) {
            console.log('Socket not connected, waiting for connection...');
            const handleConnect = () => {
                window.socket.off('connect', handleConnect);
            };
            window.socket.on('connect', handleConnect);
            return () => {
                if (window.socket) {
                    window.socket.off('connect', handleConnect);
                }
            };
        }

        const userId = user.id;
        
        // Clear previous listeners
        Object.values(socketListenersRef.current).forEach(({ event, handler }) => {
            if (window.socket) {
                window.socket.off(event, handler);
            }
        });
        socketListenersRef.current = {};

        // Listen for real-time notifications
        const handleHeartNotification = (data) => {
            console.log('Heart notification received:', data);
            addNotification(data);
        };

        const handleChatRequest = async (data) => {
            console.log('Chat request received via socket:', data);
            console.log('Current user ID:', user?.id);
            addNotification(data);
            // Refetch chat requests after a short delay to ensure server has processed the request
            if (user?.id) {
                setTimeout(() => {
                    console.log('Refetching chat requests for user:', user.id);
                    fetchChatRequests(user.id);
                }, 500);
            } else {
                console.warn('Cannot refetch chat requests - user ID not available');
            }
        };

        const handleChatAccepted = (data) => {
            console.log('Chat accepted received:', data);
            addNotification(data);
        };

        const handleChatRejected = (data) => {
            console.log('Chat rejected received:', data);
            addNotification(data);
        };

        // Set up user-specific event listeners
        const heartEvent = `heart_notification_${userId}`;
        const requestEvent = `private_chat_request_${userId}`;
        const acceptedEvent = `private_chat_accepted_${userId}`;
        const rejectedEvent = `private_chat_rejected_${userId}`;

        window.socket.on(heartEvent, handleHeartNotification);
        window.socket.on(requestEvent, handleChatRequest);
        window.socket.on(acceptedEvent, handleChatAccepted);
        window.socket.on(rejectedEvent, handleChatRejected);

        // Store listeners for cleanup
        socketListenersRef.current = {
            heart: { event: heartEvent, handler: handleHeartNotification },
            request: { event: requestEvent, handler: handleChatRequest },
            accepted: { event: acceptedEvent, handler: handleChatAccepted },
            rejected: { event: rejectedEvent, handler: handleChatRejected }
        };

        console.log(`Listening for notifications for user ${userId}:`, {
            heartEvent, requestEvent, acceptedEvent, rejectedEvent
        });

        return () => {
            if (window.socket) {
                Object.values(socketListenersRef.current).forEach(({ event, handler }) => {
                    window.socket.off(event, handler);
                });
            }
        };
    }, [user, addNotification, fetchChatRequests]);

    const toggleNotifications = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={toggleNotifications}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
            >
                <Bell size={20} className="text-white group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <NotificationPanel isOpen={isOpen} onClose={handleClose} />

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleClose}
                />
            )}
        </div>
    );
};

export default NotificationButton;