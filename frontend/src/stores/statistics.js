import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useStatisticsStore = defineStore('statistics', () => {
    const topCoins = ref([])
    const topVictories = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchStatistics() {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get('/api/statistics')
            topCoins.value = response.data.top_coins
            topVictories.value = response.data.top_victories
        } catch (e) {
            console.error("Erro stats:", e)
            error.value = 'Não foi possível carregar as estatísticas.'
        } finally {
            loading.value = false
        }
    }

    return { topCoins, topVictories, loading, error, fetchStatistics }
})