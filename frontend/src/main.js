import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
import axios from 'axios' // Mantém o import

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const apiDomain = import.meta.env.VITE_API_DOMAIN
const wsConnection = import.meta.env.VITE_WS_CONNECTION

axios.defaults.baseURL = `http://${apiDomain}`


const app = createApp(App)

app.provide('socket', io(wsConnection))
app.provide('serverBaseURL', `http://${apiDomain}`)
app.provide('apiBaseURL', `http://${apiDomain}/api`)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

// Restore session after app is mounted
const authStore = useAuthStore()
authStore.restoreSession()
