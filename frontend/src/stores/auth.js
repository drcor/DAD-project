import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  // Load user from sessionStorage on init
  const savedUser = sessionStorage.getItem('currentUser')
  const currentUser = ref(savedUser ? JSON.parse(savedUser) : undefined)

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined
  })

  const isAdmin = computed(() => {
    return currentUser.value?.type === 'A'
  })

  const isPlayer = computed(() => {
    return currentUser.value?.type === 'P'
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
    // Save user to sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(response.data))
    return response.data
  }

  const register = async (userData) => {
    const response = await apiStore.postRegister(userData)
    return response.data
  }

  const logout = async () => {
    try {
      await apiStore.postLogout()
    } catch {
      // Ignore logout errors, just clear local state
      console.warn('[Auth] Logout request failed, clearing local session anyway')
    }
    currentUser.value = undefined
    // Remove user from sessionStorage
    sessionStorage.removeItem('currentUser')
    sessionStorage.removeItem('authToken')
    // Clear axios authorization header
    delete axios.defaults.headers.common['Authorization']
  }

  // Initialize: restore session if token exists
  const restoreSession = async () => {
    const token = sessionStorage.getItem('authToken')
    if (!token) {
      // No token, ensure everything is cleared
      currentUser.value = undefined
      sessionStorage.removeItem('currentUser')
      return
    }

    try {
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data
      sessionStorage.setItem('currentUser', JSON.stringify(response.data))
      console.log('[Auth] Session restored for user:', response.data.nickname)
    } catch (error) {
      // Token is invalid or expired - silently clear everything
      if (error.response?.status === 401) {
        console.log('[Auth] Token expired, clearing session')
      } else {
        console.warn('[Auth] Failed to restore session:', error.message)
      }
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('currentUser')
      currentUser.value = undefined
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Refresh user data (e.g., coin balance after transactions)
  const refreshUserData = async () => {
    if (!currentUser.value) {
      console.warn('[Auth] Cannot refresh user data - not logged in')
      return
    }

    try {
      const response = await apiStore.getAuthUser()
      currentUser.value = response.data
      sessionStorage.setItem('currentUser', JSON.stringify(response.data))
      console.log('[Auth] User data refreshed - new balance:', response.data.coins_balance)
    } catch (error) {
      // If token is invalid during refresh, logout
      if (error.response?.status === 401) {
        console.warn('[Auth] Token expired during refresh, logging out')
        await logout()
      } else {
        console.error('[Auth] Failed to refresh user data:', error.message)
      }
    }
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    isPlayer,
    currentUserID,
    login,
    register,
    logout,
    restoreSession,
    refreshUserData,
  }
})
