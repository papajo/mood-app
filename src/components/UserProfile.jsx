import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { API_URL } from '../config/api';
import { moods } from '../constants/moods';

const UserProfile = ({ onClose }) => {
    const { user, updateUserStatus, refreshUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [status, setStatus] = useState(user?.status || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    if (!user) {
        return (
            <div className="glass-panel text-center py-10">
                <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                <p className="mt-2 text-gray-400">Loading profile...</p>
            </div>
        );
    }

    const currentMood = moods.find(m => m.id === user.currentMoodId);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        if (status.length > 100) {
            setError('Status exceeds 100 characters');
            setSaving(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, avatar: avatar || undefined })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            await updateUserStatus(status);
            await refreshUser();
            setIsEditing(false);
            setSaving(false);
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setStatus(user.status || '');
        setAvatar(user.avatar || '');
        setIsEditing(false);
        setError(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="text-primary" />
                        Profile
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50">
                            {avatar ? (
                                <img src={avatar} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <User size={32} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white">{user.username}</h3>
                            {currentMood && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-2xl">{currentMood.emoji}</span>
                                    <span className="text-sm text-gray-400">{currentMood.label}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status-input" className="block text-sm font-medium text-gray-400 mb-2">
                            Status
                        </label>
                        {isEditing ? (
                            <input
                                id="status-input"
                                type="text"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                maxLength={100}
                            />
                        ) : (
                            <p className="text-white bg-black/20 rounded-lg px-4 py-2 min-h-[40px]">
                                {user.status || 'No status set'}
                            </p>
                        )}
                    </div>

                    {/* Avatar URL */}
                    {isEditing && (
                        <div>
                            <label htmlFor="avatar-input" className="block text-sm font-medium text-gray-400 mb-2">
                                Avatar URL
                            </label>
                            <input
                                id="avatar-input"
                                type="url"
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50 transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter a URL to an image for your avatar
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                                <Edit2 size={16} />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{currentMood ? 1 : 0}</p>
                        <p className="text-sm text-gray-400">Current Mood</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-secondary">∞</p>
                        <p className="text-sm text-gray-400">Connections</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfile;

