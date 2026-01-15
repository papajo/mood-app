import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { API_URL } from '../config/api';

const Signup = ({ onSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                // Provide helpful message if email is already registered
                if (data.error && data.error.includes('already registered')) {
                    throw new Error(`${data.error}. Try logging in instead, or use a different email.`);
                }
                if (data.error && data.error.includes('already taken')) {
                    throw new Error(`${data.error}. Please choose a different username.`);
                }
                throw new Error(data.error || 'Signup failed');
            }

            // Store token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('mood mingle-user', JSON.stringify(data.user));

            onSuccess(data.user, data.token);
        } catch (err) {
            setError(err.message || 'An error occurred. Please check your connection and try again.');
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 max-w-md w-full"
        >
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Join MoodApp</h2>
                <p className="text-gray-400 text-sm">Create your account to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg"
                    >
                        <p className="font-semibold mb-1">Error:</p>
                        <p>{error}</p>
                        {error.includes('already registered') && (
                            <button
                                onClick={onSwitchToLogin}
                                className="mt-2 text-blue-300 hover:text-blue-200 underline text-xs"
                            >
                                Go to Login →
                            </button>
                        )}
                    </motion.div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={30}
                            pattern="[a-zA-Z0-9_-]+"
                            placeholder="cool_username"
                            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">3-30 characters, letters, numbers, _ and - only</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span className="animate-spin">⏳</span>
                    ) : (
                        <>
                            <UserPlus size={18} />
                            Create Account
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </motion.div>
    );
};

export default Signup;
