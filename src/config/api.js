/**
 * API Configuration
 * Uses environment variables with fallback to defaults for development
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3002';

