import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config/api'

export const useMatchesStore = defineStore('matches', () => {
    // State
    const matches = ref([])
    const currentPage = ref(1)
    const lastPage = ref(1)
    const perPage = ref(10)
    const total = ref(0)
    const loading = ref(false)
    const error = ref(null)
    const selectedMatch = ref(null)

    // Getters
    const hasMatches = computed(() => matches.value.length > 0)
    const hasPreviousPage = computed(() => currentPage.value > 1)
    const hasNextPage = computed(() => currentPage.value < lastPage.value)

    // Actions
    async function fetchMatches(page = 1, filters = {}) {
        loading.value = true
        error.value = null

        try {
            const params = {
                page,
                per_page: perPage.value,
                ...filters
            }

            const response = await axios.get(API_ENDPOINTS.MATCHES, { params })

            matches.value = response.data.data
            currentPage.value = response.data.meta.current_page
            lastPage.value = response.data.meta.last_page
            perPage.value = response.data.meta.per_page
            total.value = response.data.meta.total
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch matches'
            console.error('Error fetching matches:', err)
        } finally {
            loading.value = false
        }
    }

    async function fetchMatchDetails(matchId) {
        loading.value = true
        error.value = null

        try {
            const response = await axios.get(API_ENDPOINTS.MATCH(matchId))
            selectedMatch.value = response.data.data
            return response.data.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch match details'
            console.error('Error fetching match details:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    function clearSelectedMatch() {
        selectedMatch.value = null
    }

    function clearMatches() {
        matches.value = []
        currentPage.value = 1
        lastPage.value = 1
        total.value = 0
        error.value = null
    }

    function nextPage() {
        if (hasNextPage.value) {
            fetchMatches(currentPage.value + 1)
        }
    }

    function previousPage() {
        if (hasPreviousPage.value) {
            fetchMatches(currentPage.value - 1)
        }
    }

    function goToPage(page) {
        if (page >= 1 && page <= lastPage.value) {
            fetchMatches(page)
        }
    }

    return {
        // State
        matches,
        currentPage,
        lastPage,
        perPage,
        total,
        loading,
        error,
        selectedMatch,

        // Getters
        hasMatches,
        hasPreviousPage,
        hasNextPage,

        // Actions
        fetchMatches,
        fetchMatchDetails,
        clearSelectedMatch,
        clearMatches,
        nextPage,
        previousPage,
        goToPage
    }
})
