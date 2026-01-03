/**
 * API Composable
 * Provides easy access to API configuration and helpers
 */

import { API_BASE_URL, API_ENDPOINTS } from '@/config/api'

/**
 * Composable for accessing API configuration
 * @returns {Object} API configuration and helpers
 */
export function useAPI() {
    /**
     * Get full URL for an endpoint
     * @param {string} endpoint - The endpoint path (e.g., '/api/users')
     * @returns {string} Full URL
     */
    const getURL = (endpoint) => {
        // If endpoint already starts with http, return as is
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint
        }
        // Otherwise, prepend the base URL
        return `${API_BASE_URL}${endpoint}`
    }

    return {
        API_BASE_URL,
        API_ENDPOINTS,
        getURL,
    }
}
