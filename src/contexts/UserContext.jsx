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

    // Initialize user on mount
    useEffect(() => {
        initializeUser();
    }, []);

    const initializeUser = async () => {
        try {
            // Check if user exists in localStorage
            const savedUserId = localStorage.getItem('userId');
            const savedUsername = localStorage.getItem('username');

            if (savedUserId && savedUsername) {
                // Try to fetch existing user
                const response = await fetch(`${API_URL}/api/users/${savedUserId}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setLoading(false);
                    return;
                }

                // If response failed (e.g. 404 because DB was wiped), we fall through to create a new user
                console.warn(`User ID ${savedUserId} not found. Creating new user.`);
            }

            // Create a new user with a default username
            const username = savedUsername || `User${Math.floor(Math.random() * 10000)}`;
            const response = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (!response.ok) {
                throw new Error('Failed to create user');
            }

            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('userId', userData.id);
            localStorage.setItem('username', userData.username);
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
        updateUserStatus,
        refreshUser: initializeUser
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

