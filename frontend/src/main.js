import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
import axios from 'axios' // Mantém o import

import App from './App.vue'
import router from './router'

const apiDomain = import.meta.env.VITE_API_DOMAIN
const wsConnection = import.meta.env.VITE_WS_CONNECTION

axios.defaults.baseURL = `http://${apiDomain}`

axios.defaults.withCredentials = false 

const app = createApp(App)

app.provide('socket', io(wsConnection))
app.provide('serverBaseURL', `http://${apiDomain}`)
app.provide('apiBaseURL', `http://${apiDomain}/api`)

app.use(createPinia())
app.use(router)

app.mount('#app')