import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

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
    await apiStore.postLogout()
    currentUser.value = undefined
    // Remove user from sessionStorage
    sessionStorage.removeItem('currentUser')
  }

  // Initialize: restore session if token exists
  const restoreSession = async () => {
    const token = sessionStorage.getItem('authToken')
    if (token) {
      try {
        const response = await apiStore.getAuthUser()
        currentUser.value = response.data
        sessionStorage.setItem('currentUser', JSON.stringify(response.data))
      } catch (error) {
        console.error('[Auth] Failed to restore session:', error)
        // Token might be invalid, clear everything
        sessionStorage.removeItem('authToken')
        sessionStorage.removeItem('currentUser')
        currentUser.value = undefined
      }
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
      console.error('[Auth] Failed to refresh user data:', error)
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
