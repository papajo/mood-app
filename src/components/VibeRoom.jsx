import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, MoreVertical, ShieldAlert, Ban } from 'lucide-react';
import io from 'socket.io-client';
import { useUser } from '../contexts/UserContext';
import { API_URL, SOCKET_URL } from '../config/api';

const VibeRoom = ({ currentMood, privateRoom, onPrivateRoomClose }) => {
    const { user } = useUser();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [activeMenuId, setActiveMenuId] = useState(null); // ID of message with open menu
    const [otherUser, setOtherUser] = useState(null); // For private rooms
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const socketRef = useRef(null);
    const expirationTimeoutsRef = useRef(new Map());
    const pendingMessagesRef = useRef(new Map());
    const lastSyncAtRef = useRef(0);
    const lastMessageAtRef = useRef(0);
    const lastMessageIdRef = useRef(0);
    const lastFullSyncAtRef = useRef(0);
    const emptyDeltaCountRef = useRef(0);
    const isAtBottomRef = useRef(true);
    const STORAGE_LIMIT = 200;
    const [debugEvents, setDebugEvents] = useState([]);
    const debugEnabled = typeof window !== 'undefined' && localStorage.getItem('MM_DEBUG') === '1';

    const EPHEMERAL_TTL_MS = 2 * 60 * 1000;
    const MESSAGE_ACK_TIMEOUT_MS = 4000;
    const MESSAGE_MAX_RETRIES = 2;
    const POLL_INTERVAL_MS = 3000;
    const FULL_SYNC_INTERVAL_MS = 30000;

    // Determine which room to use (mood room or private room)
    const roomId = privateRoom ? `private_${privateRoom.id}` : (currentMood ? currentMood.id : null);
    const isPrivateRoom = !!privateRoom;

    const shouldShowMessage = (msg, currentUserId) => {
        if (!msg) return false;
        if (msg.user !== 'System') return true;
        if (msg.targetUserId == null) return true;
        return Number(msg.targetUserId) === Number(currentUserId);
    };

    const isEphemeralSystemMessage = (msg) => {
        if (!msg || msg.user !== 'System' || !msg.text) return false;
        return (
            msg.text.includes('sent you a chat request') ||
            msg.text.includes('accepted your chat request')
        );
    };

    const getMessageTimestamp = (msg) => {
        return msg?.timestamp || msg?.createdAt || null;
    };

    const getMessageTimeMs = (msg) => {
        const timestamp = getMessageTimestamp(msg);
        if (!timestamp) return null;
        if (typeof timestamp === 'number') return timestamp;
        if (typeof timestamp === 'string') {
            const normalized = timestamp.includes(' ') && !timestamp.includes('T')
                ? timestamp.replace(' ', 'T')
                : timestamp;
            const parsed = Date.parse(normalized);
            return Number.isNaN(parsed) ? null : parsed;
        }
        const parsed = Date.parse(String(timestamp));
        return Number.isNaN(parsed) ? null : parsed;
    };

    const isEphemeralExpired = (msg) => {
        if (!isEphemeralSystemMessage(msg)) return false;
        const messageTime = getMessageTimeMs(msg);
        if (!messageTime) return true;
        return Date.now() - messageTime > EPHEMERAL_TTL_MS;
    };

    const cleanupExpiredMessages = (list) => {
        const filtered = list.filter(msg => !isEphemeralExpired(msg));
        return filtered;
    };

    const scheduleExpire = (msg) => {
        if (!isEphemeralSystemMessage(msg) || !msg?.id) return;
        if (expirationTimeoutsRef.current.has(msg.id)) return;

        const now = Date.now();
        const messageTime = getMessageTimeMs(msg) ?? now;
        const remaining = EPHEMERAL_TTL_MS - Math.max(0, now - messageTime);

        if (remaining <= 0) {
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            return;
        }

        const timeoutId = setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== msg.id));
            expirationTimeoutsRef.current.delete(msg.id);
        }, remaining);

        expirationTimeoutsRef.current.set(msg.id, timeoutId);
    };

    const fetchMessages = (options = {}) => {
        const { silent = false } = options;
        if (!roomId) return;
        lastSyncAtRef.current = Date.now();
        if (!silent) {
            setLoading(true);
        }
        const sinceId = isPrivateRoom ? 0 : (options.sinceId || 0);
        const cacheBust = `ts=${Date.now()}`;
        const userParam = user?.id ? `userId=${user.id}` : '';
        const sinceParam = sinceId > 0 ? `sinceId=${sinceId}` : '';
        const query = [sinceParam, userParam, cacheBust].filter(Boolean).join('&');
        fetch(`${API_URL}/api/messages/${roomId}?${query}`, {
            cache: 'no-store'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch messages');
                return res.json();
            })
            .then(data => {
                if (debugEnabled) {
                    setDebugEvents(prev => [...prev.slice(-49), {
                        type: 'fetch_messages',
                        at: Date.now(),
                        roomId,
                        sinceId,
                        count: Array.isArray(data) ? data.length : -1
                    }]);
                }
                // Fetch user avatars for messages
                const messagesWithAvatars = data.map(msg => {
                    if (!msg.avatar && msg.userId) {
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
                const visibleMessages = messagesWithAvatars.filter(msg => !isEphemeralExpired(msg));
                if (debugEnabled) {
                    setDebugEvents(prev => [...prev.slice(-49), {
                        type: 'visible_messages',
                        at: Date.now(),
                        roomId,
                        count: visibleMessages.length
                    }]);
                }
                if (visibleMessages.length > 0) {
                    const maxId = Math.max(...visibleMessages.map(m => Number(m.id)).filter(n => Number.isFinite(n)));
                    if (Number.isFinite(maxId)) {
                        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, maxId);
                    }
                    emptyDeltaCountRef.current = 0;
                } else if (sinceId > 0) {
                    emptyDeltaCountRef.current += 1;
                }
                if (sinceId === 0) {
                    lastFullSyncAtRef.current = Date.now();
                    emptyDeltaCountRef.current = 0;
                }

                setMessages(prev => {
                    const prevFiltered = cleanupExpiredMessages(prev);
                    const prevById = new Map(prevFiltered.map(m => [m.id, m]));
                    const prevByClientId = new Map(prevFiltered.filter(m => m.clientId).map(m => [m.clientId, m]));
                    const mergedMap = new Map(prevFiltered.map(m => [m.id, m]));

                    // Upsert server messages without dropping existing ones
                    visibleMessages.forEach(m => {
                        const existing = prevByClientId.get(m.clientId) || prevById.get(m.id);
                        if (existing) {
                            mergedMap.set(existing.id, { ...existing, ...m, pending: false, failed: false });
                        } else {
                            mergedMap.set(m.id, m);
                        }
                    });

                    const merged = cleanupExpiredMessages(Array.from(mergedMap.values()));
                    merged.sort((a, b) => {
                        const aNum = Number(a.id);
                        const bNum = Number(b.id);
                        if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
                            return aNum - bNum;
                        }
                        return String(a.id).localeCompare(String(b.id));
                    });

                    const numericIds = merged.map(m => Number(m.id)).filter(n => Number.isFinite(n));
                    if (numericIds.length > 0) {
                        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, ...numericIds);
                    }
                    const prevIds = prevFiltered.map(m => m.id).join(',');
                    const mergedIds = merged.map(m => m.id).join(',');
                    if (prevIds === mergedIds) {
                        return prevFiltered;
                    }
                    return merged;
                });
                if (debugEnabled) {
                    setDebugEvents(prev => [...prev.slice(-49), {
                        type: 'merge_done',
                        at: Date.now(),
                        roomId,
                        count: messagesWithAvatars.length
                    }]);
                }
                visibleMessages.forEach(scheduleExpire);
                if (sinceId > 0 && emptyDeltaCountRef.current >= 3) {
                    emptyDeltaCountRef.current = 0;
                    fetchMessages({ silent: true, sinceId: 0 });
                }
                if (!silent) {
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Failed to fetch messages:", err);
                if (debugEnabled) {
                    setDebugEvents(prev => [...prev.slice(-49), {
                        type: 'fetch_error',
                        at: Date.now(),
                        roomId,
                        sinceId,
                        error: err.message
                    }]);
                }
                if (!silent) {
                    setError(err.message);
                    setLoading(false);
                }
            });
    };

    const fetchUndelivered = () => {
        if (!isPrivateRoom || !user?.id) return;
        fetch(`${API_URL}/api/messages/undelivered/${user.id}?ts=${Date.now()}`, {
            cache: 'no-store'
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch undelivered messages');
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) return;
                const idsToAck = [];
                let maxId = null;
                setMessages(prev => {
                    const merged = cleanupExpiredMessages(prev);
                    data.forEach(msg => {
                        if (isEphemeralExpired(msg)) {
                            idsToAck.push(msg.id);
                            return;
                        }
                        if (msg.roomId !== roomId) {
                            idsToAck.push(msg.id);
                            return;
                        }
                        if (!shouldShowMessage(msg, user.id)) {
                            idsToAck.push(msg.id);
                            return;
                        }
                        const exists = merged.some(m => m.id === msg.id);
                        if (!exists) {
                            merged.push(msg);
                        }
                        idsToAck.push(msg.id);
                        if (Number.isFinite(Number(msg.id))) {
                            maxId = Math.max(maxId ?? 0, Number(msg.id));
                        }
                        scheduleExpire(msg);
                    });
                    return merged;
                });
                if (Number.isFinite(maxId)) {
                    lastMessageIdRef.current = Math.max(lastMessageIdRef.current, maxId);
                }
                lastMessageAtRef.current = Date.now();
                if (idsToAck.length > 0) {
                    fetch(`${API_URL}/api/messages/ack`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, messageIds: idsToAck })
                    }).catch(() => {});
                }
            })
            .catch(() => {});
    };

    // Initialize socket and join room
    useEffect(() => {
        if ((!currentMood && !privateRoom) || !user) return;

        if (debugEnabled) {
            setDebugEvents(prev => [...prev.slice(-49), {
                type: 'mount',
                at: Date.now(),
                roomId
            }]);
        }

        const cached = sessionStorage.getItem(`messages:${roomId}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed.filter(msg => !isEphemeralExpired(msg)));
                }
            } catch (e) {
                sessionStorage.removeItem(`messages:${roomId}`);
            }
        }

        // Use global socket if available, otherwise create new one
        if (window.socket) {
            socketRef.current = window.socket;
            console.log('Using global socket for VibeRoom');
        } else if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });
            // Also set to window.socket for other components
            window.socket = socketRef.current;
            console.log('Created new socket for VibeRoom and set to window.socket');
        }

        const socket = socketRef.current;

        const joinRoom = () => {
            if (!roomId || !user?.id) return;
            socket.emit('join_room', { roomId: roomId, userId: user.id });
        };

        // Join the room with user info
        joinRoom();

        // Fetch other user info for private rooms
        if (isPrivateRoom && privateRoom.otherUserId) {
            fetch(`${API_URL}/api/users/${privateRoom.otherUserId}`)
                .then(res => res.json())
                .then(userData => setOtherUser(userData))
                .catch(err => console.error('Failed to fetch other user:', err));
        }

        // Fetch history
        fetchMessages();

        // Listen for new messages
        const handleReceiveMessage = (data) => {
            if (data?.roomId && data.roomId !== roomId) return;
            if (isEphemeralExpired(data)) return;
            // Server filters system messages by target_user_id
            if (debugEnabled) {
                setDebugEvents(prev => [...prev.slice(-49), {
                    type: 'receive_message',
                    at: Date.now(),
                    roomId: data?.roomId,
                    id: data?.id,
                    clientId: data?.clientId
                }]);
            }
        setMessages((prev) => {
            const prevFiltered = cleanupExpiredMessages(prev);
            const existingById = prevFiltered.some(m => m.id === data.id);
            if (existingById) return prevFiltered;

                if (data?.clientId) {
                const hasPending = prevFiltered.some(m => m.clientId === data.clientId);
                    if (hasPending) {
                    return prevFiltered.map(m => m.clientId === data.clientId
                            ? { ...data, pending: false, failed: false }
                            : m
                        );
                    }
                }
            return [...prevFiltered, data];
            });
            lastMessageAtRef.current = Date.now();
            if (Number.isFinite(Number(data?.id))) {
                const incomingId = Number(data.id);
                if (lastMessageIdRef.current > 0 && incomingId > lastMessageIdRef.current + 1) {
                    fetchMessages({ silent: true, sinceId: 0 });
                }
                lastMessageIdRef.current = Math.max(lastMessageIdRef.current, incomingId);
            }
            if (data?.clientId && pendingMessagesRef.current.has(data.clientId)) {
                const entry = pendingMessagesRef.current.get(data.clientId);
                if (entry?.timeoutId) {
                    clearTimeout(entry.timeoutId);
                }
                pendingMessagesRef.current.delete(data.clientId);
            }
            if (Number.isFinite(Number(data?.id)) && user?.id) {
                fetch(`${API_URL}/api/messages/ack`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, messageIds: [data.id] })
                }).catch(() => {});
            }
            scheduleExpire(data);
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

        const handleConnect = () => {
            joinRoom();
            socket.emit('register_user', { userId: user.id });
            fetchMessages({ silent: true, sinceId: lastMessageIdRef.current });
            fetchUndelivered();
            if (debugEnabled) {
                setDebugEvents(prev => [...prev.slice(-49), { type: 'socket_connect', at: Date.now(), roomId }]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('connect', handleConnect);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);

        // Make socket globally available for notification listeners
        window.socket = socket;

        return () => {
            if (debugEnabled) {
                setDebugEvents(prev => [...prev.slice(-49), {
                    type: 'unmount',
                    at: Date.now(),
                    roomId
                }]);
            }
            if (socketRef.current) {
                socketRef.current.off('receive_message', handleReceiveMessage);
                socketRef.current.off('connect', handleConnect);
                socketRef.current.off('user_typing', handleUserTyping);
                socketRef.current.off('user_stopped_typing', handleUserStoppedTyping);
            }
            setTypingUsers(new Set());
            expirationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
            expirationTimeoutsRef.current.clear();
            pendingMessagesRef.current.forEach(timeoutId => clearTimeout(timeoutId));
            pendingMessagesRef.current.clear();
        };
    }, [roomId, user, isPrivateRoom, privateRoom]);

    useEffect(() => {
        if (!roomId) return;
        const toStore = cleanupExpiredMessages(messages).slice(-STORAGE_LIMIT);
        sessionStorage.setItem(`messages:${roomId}`, JSON.stringify(toStore));
    }, [messages, roomId]);

    useEffect(() => {
        if (!isPrivateRoom) return;
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchMessages({ silent: true, sinceId: 0 });
                fetchUndelivered();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isPrivateRoom, roomId]);

    useEffect(() => {
        if (!isPrivateRoom) return;
        const intervalId = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            const now = Date.now();
            const socketConnected = socketRef.current?.connected;
            const hasPending = pendingMessagesRef.current.size > 0;
            const stale = now - lastSyncAtRef.current > POLL_INTERVAL_MS;
            const quiet = now - lastMessageAtRef.current > POLL_INTERVAL_MS;
            const needsFull = now - lastFullSyncAtRef.current > FULL_SYNC_INTERVAL_MS;
            if (needsFull) {
                fetchMessages({ silent: true, sinceId: 0 });
            } else if (hasPending || !socketConnected || stale || quiet) {
                fetchMessages({ silent: true, sinceId: lastMessageIdRef.current });
            }
            fetchUndelivered();
        }, POLL_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [isPrivateRoom, roomId]);

    const scrollToBottom = () => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        // Close menu when clicking outside
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        setInputText(e.target.value);

        if (!socketRef.current || !roomId || !user) return;

        // Emit typing indicator
        if (e.target.value.trim()) {
            socketRef.current.emit('typing_start', {
                roomId: roomId,
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
                        roomId: roomId,
                        userId: user.id
                    });
                }
            }, 1000);
        } else {
            if (socketRef.current) {
                socketRef.current.emit('typing_stop', {
                    roomId: roomId,
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
            roomId: roomId,
            userId: user.id
        });

        const clientId = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimisticMessage = {
            id: clientId,
            roomId: roomId,
            userId: user.id,
            user: user.username,
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: user.avatar || null,
            clientId,
            pending: true,
            failed: false
        };

        setMessages(prev => [...prev, optimisticMessage]);
        const messageData = {
            roomId: roomId,
            userId: user.id,
            user: user.username,
            text: inputText,
            time: optimisticMessage.time,
            clientId
        };

        const markDelivered = (clientId, patch = {}) => {
            const entry = pendingMessagesRef.current.get(clientId);
            if (entry) {
                entry.delivered = true;
                pendingMessagesRef.current.set(clientId, entry);
            }
            setMessages(prev => prev.map(m =>
                m.clientId === clientId
                    ? { ...m, ...patch, pending: false, failed: false }
                    : m
            ));
            pendingMessagesRef.current.delete(clientId);
        };

        const sendViaSocket = (payload) => {
            if (!socketRef.current) return;
            socketRef.current.emit('send_message', payload, (ack) => {
                if (ack?.ok && ack.clientId === payload.clientId) {
                    markDelivered(payload.clientId, { id: ack.id });
                }
            });
        };

        const sendWithRetry = async (payload) => {
            const entry = pendingMessagesRef.current.get(payload.clientId);
            if (entry?.delivered) return;
            const attempts = entry?.attempts ?? 0;
            try {
                const response = await fetch(`${API_URL}/api/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                const saved = await response.json();
                markDelivered(payload.clientId, saved);
            } catch (err) {
                const nextAttempts = attempts + 1;
                if (nextAttempts > MESSAGE_MAX_RETRIES) {
                    pendingMessagesRef.current.delete(payload.clientId);
                    setMessages(prev => prev.map(m => m.clientId === payload.clientId
                        ? { ...m, pending: false, failed: true }
                        : m
                    ));
                    fetchMessages({ silent: true, sinceId: lastMessageIdRef.current });
                    return;
                }
                pendingMessagesRef.current.set(payload.clientId, { payload, attempts: nextAttempts });
                setTimeout(() => sendWithRetry(payload), MESSAGE_ACK_TIMEOUT_MS);
            }
        };

        pendingMessagesRef.current.set(clientId, { payload: messageData, attempts: 0, delivered: false });
        sendViaSocket(messageData);
        sendWithRetry(messageData);
        setInputText('');
    };

    if (!currentMood && !privateRoom) {
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
                    {isPrivateRoom ? (
                        <>
                            <span className="text-xl">💬</span>
                            Private Chat {otherUser && `with ${otherUser.username}`}
                            {onPrivateRoomClose && (
                                <button
                                    onClick={onPrivateRoomClose}
                                    className="ml-auto text-gray-400 hover:text-white text-sm"
                                >
                                    Back to Rooms
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="text-xl">{currentMood.emoji}</span>
                            {currentMood.label} Room
                        </>
                    )}
                    <span className="text-xs font-normal text-gray-400 ml-auto">
                        {messages.length} messages
                    </span>
                </h3>
            </div>

            {debugEnabled && (
                <div className="p-2 text-[10px] text-gray-300 bg-black/30 border-b border-white/10">
                    <div>room: {roomId} | socket: {socketRef.current?.connected ? 'connected' : 'disconnected'} | msgs: {messages.length}</div>
                    <div>lastId: {lastMessageIdRef.current} | pending: {pendingMessagesRef.current.size}</div>
                    <div>lastSync: {new Date(lastSyncAtRef.current).toLocaleTimeString()} | lastMsg: {new Date(lastMessageAtRef.current).toLocaleTimeString()}</div>
                    <div className="max-h-20 overflow-y-auto mt-1">
                        {debugEvents.slice(-6).map((e, idx) => (
                            <div key={`${e.type}-${idx}`}>
                                {new Date(e.at).toLocaleTimeString()} {e.type} {e.roomId || ''} {e.id || ''} {e.count ?? ''} {e.error || ''}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onScroll={() => {
                    const el = messagesContainerRef.current;
                    if (!el) return;
                    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                    isAtBottomRef.current = distanceFromBottom < 40;
                }}
            >
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
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-[10px] opacity-50">{msg.time}</p>
                                                    {isMe && msg.pending && (
                                                        <p className="text-[10px] opacity-70 text-primary">Sending…</p>
                                                    )}
                                                    {isMe && msg.failed && (
                                                        <p className="text-[10px] opacity-70 text-red-400">Syncing…</p>
                                                    )}
                                                </div>
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
                    placeholder={isPrivateRoom ? (otherUser ? `Message ${otherUser.username}...` : 'Type a message...') : `Message #${currentMood.label}...`}
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
