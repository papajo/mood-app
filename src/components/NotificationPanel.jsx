import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, Check, Clock, User } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';

const NotificationPanel = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const {
        notifications,
        chatRequests,
        unreadCount,
        markHeartsAsRead,
        acceptChatRequest,
        rejectChatRequest,
        clearAllNotifications
    } = useNotifications();
    const [activeTab, setActiveTab] = useState('hearts'); // 'hearts' or 'requests'

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleClose = () => {
        onClose();
    };

    const handleClearAll = () => {
        if (user) {
            clearAllNotifications(user.id);
        } else {
            clearAllNotifications();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-80 max-h-96 glass-panel z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h3 className="font-semibold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => handleTabChange('hearts')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'hearts' 
                                    ? 'text-white border-b-2 border-primary' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Hearts {notifications.length > 0 && `(${notifications.length})`}
                        </button>
                        <button
                            onClick={() => handleTabChange('requests')}
                            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'requests' 
                                    ? 'text-white border-b-2 border-primary' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Chat Requests {chatRequests.length > 0 && `(${chatRequests.length})`}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto max-h-64">
                        {activeTab === 'hearts' ? (
                            <div className="p-4">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Heart size={24} className="mx-auto mb-2 opacity-50" />
                                        <p>No heart notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                                    !notification.isRead 
                                                        ? 'bg-pink-500/10 border border-pink-500/20' 
                                                        : 'bg-white/5'
                                                }`}
                                            >
                                                {notification.type === 'heart' ? (
                                                    <>
                                                        <div className="relative">
                                                            <img
                                                                src={notification.senderAvatar}
                                                                alt={notification.senderUsername}
                                                                className="w-10 h-10 rounded-full"
                                                            />
                                                            <Heart 
                                                                size={12} 
                                                                className="absolute -top-1 -right-1 text-pink-500 bg-white rounded-full p-0.5"
                                                                fill="currentColor"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium">
                                                                {notification.senderUsername}
                                                            </p>
                                                            <p className="text-gray-400 text-xs">
                                                                sent you a heart ❤️
                                                            </p>
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                {new Date(notification.createdAt).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                                <MessageCircle size={16} className="text-primary" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium">
                                                                Chat Update
                                                            </p>
                                                            <p className="text-gray-400 text-xs">
                                                                {notification.message || 'Private chat accepted'}
                                                            </p>
                                                            <p className="text-gray-500 text-xs mt-1">
                                                                {new Date(notification.createdAt).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={() => user && markHeartsAsRead(user.id)}
                                        className="w-full mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="p-4">
                                {chatRequests.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                                        <p>No pending chat requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {chatRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                                            >
                                                <div className="relative">
                                                    <img
                                                        src={request.requesterAvatar}
                                                        alt={request.requesterUsername}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <MessageCircle 
                                                        size={12} 
                                                        className="absolute -top-1 -right-1 text-blue-500 bg-white rounded-full p-0.5"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium">
                                                        {request.requesterUsername}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        wants to start a private chat
                                                    </p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        {new Date(request.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => user && acceptChatRequest(request.id, user.id)}
                                                        className="p-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                                                        title="Accept chat request"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => user && rejectChatRequest(request.id, user.id)}
                                                        className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                        title="Reject chat request"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {(notifications.length > 0 || chatRequests.length > 0) && (
                        <div className="p-3 border-t border-white/10">
                            <button
                                onClick={handleClearAll}
                                className="w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                            >
                                Clear All Notifications
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPanel;