import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useGamesStore = defineStore('games', () => {
    const games = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0
    })

    async function fetchMyGames(page = 1, perPage = 15) {
        loading.value = true
        error.value = null
        try {
            // GET /api/games with pagination
            const response = await axios.get('/api/games', {
                params: {
                    page,
                    per_page: perPage
                }
            })

            // Store games and pagination metadata
            games.value = response.data.data
            pagination.value = {
                currentPage: response.data.meta.current_page,
                lastPage: response.data.meta.last_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total
            }
        } catch (e) {
            console.error("Games error:", e)
            error.value = 'Unable to load game history.'
        } finally {
            loading.value = false
        }
    }

    return { games, loading, error, pagination, fetchMyGames }
})