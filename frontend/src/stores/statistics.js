import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { API_ENDPOINTS } from '@/config/api'

export const useStatisticsStore = defineStore('statistics', () => {
    const topCoins = ref([])
    const topGameWins = ref([])
    const topMatchWins = ref([])
    const topCapotes = ref([])
    const topBandeiras = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchStatistics() {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get(API_ENDPOINTS.STATISTICS.BASE)
            topCoins.value = response.data.top_coins || []
            topGameWins.value = response.data.top_game_wins || []
            topMatchWins.value = response.data.top_match_wins || []
            topCapotes.value = response.data.top_capotes || []
            topBandeiras.value = response.data.top_bandeiras || []
        } catch (e) {
            console.error("Statistics error:", e)
            error.value = 'Unable to load statistics.'
        } finally {
            loading.value = false
        }
    }

    return {
        topCoins,
        topGameWins,
        topMatchWins,
        topCapotes,
        topBandeiras,
        loading,
        error,
        fetchStatistics
    }
})