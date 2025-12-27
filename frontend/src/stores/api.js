import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

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
    const formData = new FormData()
    formData.append('email', userData.email)
    formData.append('nickname', userData.nickname)
    formData.append('name', userData.name)
    formData.append('password', userData.password)
    if (userData.photo) {
      formData.append('photo', userData.photo)
    }

    const response = await axios.post(`${API_BASE_URL}/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    token.value = response.data.token
    sessionStorage.setItem('authToken', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response
  }

  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials)
    token.value = response.data.token
    // Save token to sessionStorage
    sessionStorage.setItem('authToken', response.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`)
    token.value = undefined
    // Remove token from sessionStorage
    sessionStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
  }

  // Users / Profile
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  const getProfile = () => {
    return axios.get(`${API_BASE_URL}/profile`)
  }

  const updateProfile = (userData) => {
    return axios.put(`${API_BASE_URL}/profile`, userData)
  }

  const updatePassword = (passwordData) => {
    return axios.put(`${API_BASE_URL}/profile/password`, passwordData)
  }

  const uploadPhoto = (photo) => {
    const formData = new FormData()
    formData.append('photo', photo)
    return axios.post(`${API_BASE_URL}/profile/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  const deletePhoto = () => {
    return axios.delete(`${API_BASE_URL}/profile/photo`)
  }

  const deleteAccount = (confirmation) => {
    return axios.delete(`${API_BASE_URL}/profile`, {
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
    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
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
