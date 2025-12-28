import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useGamesStore = defineStore('games', () => {
    const games = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchMyGames() {
        loading.value = true
        error.value = null
        try {
            // GET /api/games (Laravel typically filters games for the logged-in user or returns all)
            // If it returns all, we'll need to filter on the frontend, but we'll assume the API filters.
            const response = await axios.get('/api/games')

            // Adjust here if data comes in another format (e.g., response.data)
            games.value = response.data.data
        } catch (e) {
            console.error("Games error:", e)
            error.value = 'Unable to load game history.'
        } finally {
            loading.value = false
        }
    }

    return { games, loading, error, fetchMyGames }
})