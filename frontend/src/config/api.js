/**
 * API Configuration
 * Centralized configuration for API base URL and related constants
 */

const apiDomain = import.meta.env.VITE_API_DOMAIN

// Handle API domain with or without protocol
export const API_BASE_URL = apiDomain.startsWith('http://') || apiDomain.startsWith('https://')
    ? apiDomain
    : `http://${apiDomain}`

// WebSocket connection URL
export const WS_CONNECTION = import.meta.env.VITE_WS_CONNECTION

// API endpoints
export const API_ENDPOINTS = {
    BASE: API_BASE_URL,
    API: `${API_BASE_URL}/api`,

    // Auth endpoints
    AUTH: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        REGISTER: '/api/register',
        USER: '/api/users/me',
        PROFILE: '/api/profile',
        PROFILE_PASSWORD: '/api/profile/password',
        PROFILE_PHOTO: '/api/profile/photo',
    },

    // Admin endpoints
    ADMIN: {
        STATISTICS: '/api/admin/statistics',
        TIMELINE: '/api/admin/statistics/timeline',
        ENGAGEMENT: '/api/admin/statistics/engagement',
        GAME_PERFORMANCE: '/api/admin/statistics/game-performance',
        ECONOMY: '/api/admin/statistics/economy',
        TRANSACTIONS_BY_TYPE: '/api/admin/statistics/transactions/by-type',
        TRANSACTIONS: '/api/admin/transactions',
        USERS: '/api/admin/users',
        USER: (userId) => `/api/admin/users/${userId}`,
        USER_BLOCK: (userId) => `/api/admin/users/${userId}/block`,
        USER_UNBLOCK: (userId) => `/api/admin/users/${userId}/unblock`,
        USER_TRANSACTIONS: (userId) => `/api/admin/users/${userId}/transactions`,
    },

    // Public statistics
    STATISTICS: {
        BASE: '/api/statistics',
        TIMELINE: '/api/statistics/timeline',
    },

    // Games
    GAMES: '/api/games',

    // Matches
    MATCHES: '/api/matches',
    MATCH: (matchId) => `/api/matches/${matchId}`,

    // Transactions
    TRANSACTIONS: '/api/transactions',
}
