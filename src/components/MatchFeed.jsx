import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Loader2, Check } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_URL } from '../config/api';

const MatchFeed = ({ currentMood }) => {
    const { user } = useUser();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [likedUsers, setLikedUsers] = useState(new Set());
    const [sendingHeart, setSendingHeart] = useState(new Set());
    const [privateChatRequests, setPrivateChatRequests] = useState(new Map()); // userId -> 'pending', 'accepted', 'rejected'

    // Fetch matching users when mood changes
    useEffect(() => {
        if (!currentMood || !user) {
            setMatches([]);
            return;
        }

        setLoading(true);
        setError(null);
        fetch(`${API_URL}/api/users/match/${currentMood.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch matches');
                return res.json();
            })
            .then(data => {
                // Filter out current user
                const otherUsers = data.filter(u => u.id !== user.id);
                setMatches(otherUsers);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch matches:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [currentMood, user]);

    const sendHeartNotification = async (e, targetUserId) => {
        e.stopPropagation(); // Prevent triggering card click
        
        if (!user) {
            console.error('No user found');
            return;
        }

        setSendingHeart(prev => new Set(prev).add(targetUserId));

        try {
            const response = await fetch(`${API_URL}/api/heart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    senderId: user.id, 
                    receiverId: targetUserId 
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Heart sent successfully:', result);
            
            // Add to liked users
            setLikedUsers(prev => new Set(prev).add(targetUserId));
        } catch (err) {
            console.error('Failed to send heart:', err);
            // You could show a toast notification here
        } finally {
            setSendingHeart(prev => {
                const newSet = new Set(prev);
                newSet.delete(targetUserId);
                return newSet;
            });
        }
    };

    const requestPrivateChat = async (e, targetUser) => {
        e.stopPropagation(); // Prevent triggering card click
        
        if (!user) {
            console.error('No user found');
            return;
        }

        try {
            console.log('Sending private chat request:', {
                requesterId: user.id, 
                requestedId: targetUser.id,
                user: user,
                targetUser: targetUser
            });
            
            const response = await fetch(`${API_URL}/api/private-chat/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requesterId: parseInt(user.id), 
                    requestedId: parseInt(targetUser.id) 
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Private chat request sent:', result);
            
            if (result.status === 'existing') {
                // Room already exists, you could navigate to the chat
                console.log('Private chat room already exists:', result.roomId);
                setPrivateChatRequests(prev => new Map(prev).set(targetUser.id, 'accepted'));
                alert('Chat room already exists! You can start chatting.');
            } else if (result.success && result.requestId) {
                // Set request status to pending
                setPrivateChatRequests(prev => new Map(prev).set(targetUser.id, 'pending'));
                console.log(`Private chat request sent to ${targetUser.name}`);
                // Show success feedback (could use a toast notification)
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            console.error('Failed to request private chat:', err);
            const errorMessage = err.message || 'Failed to send chat request';
            
            if (errorMessage.includes('already pending')) {
                setPrivateChatRequests(prev => new Map(prev).set(targetUser.id, 'pending'));
                alert('Chat request is already pending');
            } else if (errorMessage.includes('already registered') || errorMessage.includes('existing')) {
                setPrivateChatRequests(prev => new Map(prev).set(targetUser.id, 'accepted'));
                alert('You already have an active chat with this user');
            } else {
                alert(`Error: ${errorMessage}`);
            }
        }
    };

    const handleChat = (e, _userName) => {
        e.stopPropagation();
        // TODO: Navigate to chat tab or open direct message
        // This would be handled by parent component or routing
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Coming Soon Features */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#1DB954]/10 to-[#1DB954]/5 border border-[#1DB954]/20 text-[#1DB954] text-xs font-medium whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                    Spotify Integration Coming Soon
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E1306C]/10 to-[#E1306C]/5 border border-[#E1306C]/20 text-[#E1306C] text-xs font-medium whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-[#E1306C] animate-pulse" />
                    Instagram Integration Coming Soon
                </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-200 px-1">
                {currentMood ? `Vibing with you (${matches.length})` : 'Select a mood to find your tribe'}
            </h2>

            <div className="flex flex-col gap-3">
                {loading ? (
                    <div className="glass-panel text-center py-10">
                        <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
                        <p className="mt-4 text-gray-400">Finding your vibe matches...</p>
                    </div>
                ) : error ? (
                    <div className="glass-panel text-center py-10 text-red-400">
                        <p>Failed to load matches</p>
                        <p className="text-sm mt-2 text-gray-500">{error}</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {matches.length > 0 ? (
                            matches.map((matchUser) => (
                                <motion.div
                                    key={matchUser.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass-panel flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden"
                                >
                                    {/* Match Score Badge */}
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white shadow-lg">
                                        100% Match
                                    </div>

                                    <img src={matchUser.avatar} alt={matchUser.name} className="w-12 h-12 rounded-full border-2 border-white/10" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{matchUser.name}</h3>
                                        <p className="text-sm text-gray-400 truncate">{matchUser.status || 'No status'}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4 z-20">
                                        <button
                                            onClick={(e) => sendHeartNotification(e, matchUser.id)}
                                            disabled={sendingHeart.has(matchUser.id)}
                                            className={`p-2 rounded-full transition-all ${
                                                likedUsers.has(matchUser.id) 
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                                                    : 'bg-white/10 hover:bg-pink-500/50 text-white'
                                            } ${sendingHeart.has(matchUser.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Heart 
                                                size={18} 
                                                fill={likedUsers.has(matchUser.id) ? "currentColor" : "none"}
                                                className={sendingHeart.has(matchUser.id) ? 'animate-pulse' : ''}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => requestPrivateChat(e, matchUser)}
                                            disabled={privateChatRequests.get(matchUser.id) === 'pending'}
                                            className={`p-2 rounded-full transition-all ${
                                                privateChatRequests.get(matchUser.id) === 'pending'
                                                    ? 'bg-yellow-500/50 text-white cursor-not-allowed'
                                                    : 'bg-white/10 hover:bg-blue-500/50 text-white'
                                            }`}
                                        >
                                            {privateChatRequests.get(matchUser.id) === 'pending' ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <MessageCircle size={18} />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            currentMood && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-10 text-gray-500 glass-panel"
                                >
                                    <p>No one else is feeling this exact vibe right now.</p>
                                    <p className="text-sm mt-2">Be the first!</p>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                )}

                {!currentMood && (
                    <div className="text-center py-10 text-gray-500 glass-panel border-dashed">
                        <p>Tap a mood above to start mingling.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchFeed;
