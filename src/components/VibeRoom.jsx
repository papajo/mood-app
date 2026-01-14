import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, MoreVertical, ShieldAlert, Ban } from 'lucide-react';
import io from 'socket.io-client';
import { useUser } from '../contexts/UserContext';
import { API_URL, SOCKET_URL } from '../config/api';

const VibeRoom = ({ currentMood }) => {
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [activeMenuId, setActiveMenuId] = useState(null); // ID of message with open menu
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Initialize socket and join room
    useEffect(() => {
        if (!currentMood || !user) return;

        // Initialize socket if not already done
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });
        }

        const socket = socketRef.current;

        // Join the room with user info
        socket.emit('join_room', { roomId: currentMood.id, userId: user.id });

        // Fetch history
        setLoading(true);
        fetch(`${API_URL}/api/messages/${currentMood.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch messages');
                return res.json();
            })
            .then(data => {
                // Fetch user avatars for messages
                const messagesWithAvatars = data.map(msg => {
                    if (!msg.avatar && msg.userId) {
                        // Fetch avatar from user endpoint
                        fetch(`${API_URL}/api/users/${msg.userId}`)
                            .then(res => res.json())
                            .then(userData => {
                                setMessages(prev => prev.map(m =>
                                    m.id === msg.id ? { ...m, avatar: userData.avatar } : m
                                ));
                            })
                            .catch(() => { });
                    }
                    return msg;
                });
                setMessages(messagesWithAvatars);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch messages:", err);
                setError(err.message);
                setLoading(false);
            });

        // Listen for new messages
        const handleReceiveMessage = (data) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        };

        // Listen for typing indicators
        const handleUserTyping = (data) => {
            if (data.userId !== user.id) {
                setTypingUsers(prev => new Set([...prev, data.username]));
                // Auto-remove typing indicator after 3 seconds
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.username);
                        return newSet;
                    });
                }, 3000);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.userId !== user.id) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    // Find username by userId if needed
                    newSet.delete(data.username);
                    return newSet;
                });
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);

        // Make socket globally available for notification listeners
        window.socket = socket;

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receive_message', handleReceiveMessage);
                socketRef.current.off('user_typing', handleUserTyping);
                socketRef.current.off('user_stopped_typing', handleUserStoppedTyping);
            }
            setTypingUsers(new Set());
            window.socket = null;
        };
    }, [currentMood, user]);

    const scrollToBottom = () => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Close menu when clicking outside
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setInputText(e.target.value);

        if (!socketRef.current || !currentMood || !user) return;

        // Emit typing indicator
        if (e.target.value.trim()) {
            socketRef.current.emit('typing_start', {
                roomId: currentMood.id,
                userId: user.id,
                username: user.username
            });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing indicator after 1 second of no typing
            typingTimeoutRef.current = setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.emit('typing_stop', {
                        roomId: currentMood.id,
                        userId: user.id
                    });
                }
            }, 1000);
        } else {
            if (socketRef.current) {
                socketRef.current.emit('typing_stop', {
                    roomId: currentMood.id,
                    userId: user.id
                });
            }
        }
    };

    const handleReport = async (msg) => {
        try {
            await fetch(`${API_URL}/api/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: user.id,
                    reportedId: msg.userId,
                    reason: 'Inappropriate content'
                })
            });
            alert('User reported. Thank you for keeping MoodMingle safe.');
        } catch (e) {
            console.error('Report failed', e);
        }
    };

    const handleBlock = async (msg) => {
        if (!confirm(`Are you sure you want to block ${msg.user}?`)) return;
        try {
            await fetch(`${API_URL}/api/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blockerId: user.id,
                    blockedId: msg.userId
                })
            });

            // Optimistically remove messages from this user
            setMessages(prev => prev.filter(m => m.userId !== msg.userId));
            alert(`You have blocked ${msg.user}.`);
        } catch (e) {
            console.error('Block failed', e);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !user || !socketRef.current) return;

        if (inputText.length > 500) {
            // Ideally show a toast error, but for now we safeguard
            return;
        }

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current.emit('typing_stop', {
            roomId: currentMood.id,
            userId: user.id
        });

        const messageData = {
            roomId: currentMood.id,
            userId: user.id,
            user: user.username,
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Emit to server
        socketRef.current.emit('send_message', messageData);
        setInputText('');
    };

    if (!currentMood) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 glass-panel">
                <p>Select a mood to enter a Vibe Room.</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 glass-panel">
                <Loader2 className="animate-spin h-6 w-6 mb-2" />
                <p>Loading user...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[65vh] glass-panel p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-xl">{currentMood.emoji}</span>
                    {currentMood.label} Room
                    <span className="text-xs font-normal text-gray-400 ml-auto">
                        {messages.length} messages
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-400">
                        <p>Failed to load messages</p>
                        <p className="text-sm mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <>
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const isMe = msg.userId === user.id;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                                    >
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {msg.avatar ? (
                                                    <img
                                                        src={msg.avatar}
                                                        alt={msg.user}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={14} />
                                                )}
                                            </div>
                                        )}
                                        <div className="relative max-w-[80%]">
                                            <div
                                                className={`p-3 rounded-2xl ${isMe
                                                    ? 'bg-primary text-white rounded-tr-sm'
                                                    : 'bg-white/10 text-gray-200 rounded-tl-sm'
                                                    }`}
                                            >
                                                {!isMe && <p className="text-xs text-primary mb-1 font-medium">{msg.user}</p>}
                                                <p className="text-sm">{msg.text}</p>
                                                <p className="text-[10px] opacity-50 text-right mt-1">{msg.time}</p>
                                            </div>

                                            {/* Context Menu for Reporting/Blocking */}
                                            {!isMe && (
                                                <div className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        className="p-1 hover:bg-white/10 rounded-full text-gray-400"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                                                        }}
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {activeMenuId === msg.id && (
                                                        <div className="absolute right-0 top-6 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                                            <button
                                                                onClick={() => handleReport(msg)}
                                                                className="w-full px-3 py-2 text-left text-xs text-yellow-400 hover:bg-white/5 flex items-center gap-2"
                                                            >
                                                                <ShieldAlert size={12} /> Report
                                                            </button>
                                                            <button
                                                                onClick={() => handleBlock(msg)}
                                                                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-white/5 flex items-center gap-2"
                                                            >
                                                                <Ban size={12} /> Block
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {typingUsers.size > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 italic px-2">
                                <span className="flex gap-1">
                                    {Array.from(typingUsers).map((username, idx) => (
                                        <span key={username}>
                                            {username}{idx < typingUsers.size - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </span>
                                <span>is typing...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={`Message #${currentMood.label}...`}
                    className="flex-1 bg-black/20 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default VibeRoom;
