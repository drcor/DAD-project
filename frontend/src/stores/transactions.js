import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'
import { API_ENDPOINTS } from '@/config/api'

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref([])
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0
    })

    async function fetchMyTransactions(page = 1, perPage = 15) {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get(API_ENDPOINTS.TRANSACTIONS, {
                params: {
                    page,
                    per_page: perPage
                }
            })

            transactions.value = response.data.data
            pagination.value = {
                currentPage: response.data.meta.current_page,
                lastPage: response.data.meta.last_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total
            }
        } catch (e) {
            console.error("Error fetching transactions:", e)
            error.value = 'Unable to load transaction history.'
        } finally {
            loading.value = false
        }
    }

    return {
        transactions,
        loading,
        error,
        pagination,
        fetchMyTransactions
    }
})