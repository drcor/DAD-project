import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
import axios from 'axios'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { API_BASE_URL, WS_CONNECTION } from './config/api'

// Configure axios with the API base URL
axios.defaults.baseURL = API_BASE_URL


const app = createApp(App)

app.provide('socket', io(WS_CONNECTION))
app.provide('serverBaseURL', API_BASE_URL)
app.provide('apiBaseURL', `${API_BASE_URL}/api`)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

// Restore session after app is mounted
const authStore = useAuthStore()
authStore.restoreSession()
