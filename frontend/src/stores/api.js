import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { API_ENDPOINTS } from '@/config/api'

export const useAPIStore = defineStore('api', () => {

  // Load token from sessionStorage on init
  const savedToken = sessionStorage.getItem('authToken')
  const token = ref(savedToken || undefined)

  // Set axios header if token exists
  if (savedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
  }

  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  // AUTH
  const postRegister = async (userData) => {
    console.log('API Store: Creating FormData for registration')
    const formData = new FormData()
    formData.append('email', userData.email)
    formData.append('nickname', userData.nickname)
    formData.append('name', userData.name)
    formData.append('password', userData.password)
    if (userData.photo) {
      console.log('API Store: Appending photo:', {
        name: userData.photo.name,
        size: userData.photo.size,
        type: userData.photo.type,
      })
      formData.append('photo', userData.photo)
    }

    console.log('API Store: FormData entries:')
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value)
    }

    const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response
  }

  const postLogin = async (credentials) => {
    const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    token.value = response.data.token
    // Save token to sessionStorage
    sessionStorage.setItem('authToken', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const postLogout = async () => {
    await axios.post(API_ENDPOINTS.AUTH.LOGOUT)
    token.value = undefined
    // Remove token from sessionStorage
    sessionStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
  }

  // Users / Profile
  const getAuthUser = () => {
    return axios.get(API_ENDPOINTS.AUTH.USER)
  }

  const getProfile = () => {
    return axios.get(API_ENDPOINTS.AUTH.PROFILE)
  }

  const updateProfile = (userData) => {
    return axios.put(API_ENDPOINTS.AUTH.PROFILE, userData)
  }

  const updatePassword = (passwordData) => {
    return axios.put(API_ENDPOINTS.AUTH.PROFILE_PASSWORD, passwordData)
  }

  const uploadPhoto = (photo) => {
    const formData = new FormData()
    formData.append('photo', photo)
    return axios.post(API_ENDPOINTS.AUTH.PROFILE_PHOTO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  const deletePhoto = () => {
    return axios.delete(API_ENDPOINTS.AUTH.PROFILE_PHOTO)
  }

  const deleteAccount = (confirmation) => {
    return axios.delete(API_ENDPOINTS.AUTH.PROFILE, {
      data: { confirmation },
    })
  }

  //Games
  const getGames = (resetPagination = false) => {
    if (resetPagination) {
      gameQueryParameters.value.page = 1
    }

    const queryParams = new URLSearchParams({
      page: gameQueryParameters.value.page,
      ...(gameQueryParameters.value.filters.type && {
        type: gameQueryParameters.value.filters.type,
      }),
      ...(gameQueryParameters.value.filters.status && {
        status: gameQueryParameters.value.filters.status,
      }),
      sort_by: gameQueryParameters.value.filters.sort_by,
      sort_direction: gameQueryParameters.value.filters.sort_direction,
    }).toString()
    return axios.get(`${API_ENDPOINTS.GAMES}?${queryParams}`)
  }

  return {
    postRegister,
    postLogin,
    postLogout,
    getAuthUser,
    getProfile,
    updateProfile,
    updatePassword,
    uploadPhoto,
    deletePhoto,
    deleteAccount,
    getGames,
    gameQueryParameters,
  }
})
