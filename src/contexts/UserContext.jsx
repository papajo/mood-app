import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initialize user on mount
    useEffect(() => {
        initializeUser();
    }, []);

    // Add function to manually switch to a test user
    const switchToUser = async (userId, username) => {
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to switch user:', err);
        }
    };

    // Login function
    const login = async (userData, token) => {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('mood mingle-user', JSON.stringify(userData));
        setLoading(false);
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('mood mingle-user');
    };

    // Verify authentication token
    const verifyAuth = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('mood mingle-user', JSON.stringify(data.user));
                return true;
            } else {
                // Token invalid, clear it
                logout();
                return false;
            }
        } catch (err) {
            console.error('Failed to verify token:', err);
            logout();
            return false;
        }
    };

    const initializeUser = async () => {
        try {
            // First, try to verify authentication token
            const isAuth = await verifyAuth();
            if (isAuth) {
                setLoading(false);
                return;
            }

            // If not authenticated, check for guest user in localStorage
            const savedUserId = localStorage.getItem('userId');
            const savedUsername = localStorage.getItem('username');

            if (savedUserId && savedUsername) {
                // Try to fetch existing guest user
                const response = await fetch(`${API_URL}/api/users/${savedUserId}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }

                // If response failed (e.g. 404 because DB was wiped), we fall through to create a new user
                console.warn(`User ID ${savedUserId} not found. Creating new user.`);
            }

            // Check for full user object in localStorage (from user switcher)
            const fullUserData = localStorage.getItem('mood mingle-user');
            if (fullUserData) {
                try {
                    const userData = JSON.parse(fullUserData);
                    // Verify this user still exists on backend
                    const verifyResponse = await fetch(`${API_URL}/api/users/${userData.id}`);
                    if (verifyResponse.ok) {
                        setUser(userData);
                        setIsAuthenticated(false);
                        setLoading(false);
                        return;
                    } else {
                        console.warn(`User ${userData.id} no longer exists, creating new user`);
                        // Clear invalid user data and continue to auto-create
                        localStorage.removeItem('mood mingle-user');
                    }
                } catch (e) {
                    console.warn('Failed to parse user data, creating new user');
                }
            }

            // For guest users, we'll wait for them to sign up or login
            // Don't auto-create guest users anymore
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const updateUserStatus = async (status) => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setUser(prev => ({ ...prev, status }));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated,
        login,
        logout,
        updateUserStatus,
        refreshUser: initializeUser,
        switchToUser
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

