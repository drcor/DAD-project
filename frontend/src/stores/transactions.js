import { defineStore } from 'pinia'
import axios from 'axios' 
import { ref } from 'vue'

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchMyTransactions() {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get('/api/transactions') 
            
            transactions.value = response.data.data 
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
        fetchMyTransactions 
    }
})