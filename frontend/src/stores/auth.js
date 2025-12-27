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
    currentUser.value = response.data.user
    // Save user to sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(response.data.user))
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
    if (token && !currentUser.value) {
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

  return {
    currentUser,
    isLoggedIn,
    currentUserID,
    login,
    register,
    logout,
    restoreSession,
  }
})
