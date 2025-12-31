import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
    const users = ref([])
    const transactions = ref([])
    const statistics = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const pagination = ref({
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 0
    })
    const selectedUser = ref(null)

    async function fetchAllUsers(page = 1, perPage = 15, filters = {}) {
        loading.value = true
        error.value = null
        try {
            const params = {
                page,
                per_page: perPage,
                ...filters
            }

            const response = await axios.get('/api/admin/users', { params })

            users.value = response.data.data
            pagination.value = {
                currentPage: response.data.meta.current_page,
                lastPage: response.data.meta.last_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total
            }
        } catch (e) {
            console.error("Error fetching users:", e)
            error.value = e.response?.data?.message || 'Unable to load users.'
        } finally {
            loading.value = false
        }
    }

    async function fetchUser(userId) {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get(`/api/admin/users/${userId}`)
            selectedUser.value = response.data
            return response.data
        } catch (e) {
            console.error("Error fetching user:", e)
            error.value = e.response?.data?.message || 'Unable to load user details.'
            throw e
        } finally {
            loading.value = false
        }
    }

    async function blockUser(userId) {
        try {
            const response = await axios.patch(`/api/admin/users/${userId}/block`)
            return response.data
        } catch (e) {
            console.error("Error blocking user:", e)
            throw e
        }
    }

    async function unblockUser(userId) {
        try {
            const response = await axios.patch(`/api/admin/users/${userId}/unblock`)
            return response.data
        } catch (e) {
            console.error("Error unblocking user:", e)
            throw e
        }
    }

    async function createAdmin(data) {
        try {
            const response = await axios.post('/api/admin/users', data)
            return response.data
        } catch (e) {
            console.error("Error creating admin:", e)
            throw e
        }
    }

    async function deleteUser(userId) {
        try {
            const response = await axios.delete(`/api/admin/users/${userId}`)
            return response.data
        } catch (e) {
            console.error("Error deleting user:", e)
            throw e
        }
    }

    async function fetchAllTransactions(page = 1, perPage = 15, userId = null) {
        loading.value = true
        error.value = null
        try {
            const params = {
                page,
                per_page: perPage
            }
            if (userId) {
                params.user_id = userId
            }

            const response = await axios.get('/api/admin/transactions', { params })

            transactions.value = response.data.data
            pagination.value = {
                currentPage: response.data.meta.current_page,
                lastPage: response.data.meta.last_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total
            }
        } catch (e) {
            console.error("Error fetching transactions:", e)
            error.value = e.response?.data?.message || 'Unable to load transactions.'
        } finally {
            loading.value = false
        }
    }

    async function fetchUserTransactions(userId, page = 1, perPage = 15) {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get(`/api/admin/users/${userId}/transactions`, {
                params: {
                    page,
                    per_page: perPage
                }
            })

            transactions.value = response.data.data
            selectedUser.value = response.data.user
            pagination.value = {
                currentPage: response.data.meta.current_page,
                lastPage: response.data.meta.last_page,
                perPage: response.data.meta.per_page,
                total: response.data.meta.total
            }
        } catch (e) {
            console.error("Error fetching user transactions:", e)
            error.value = e.response?.data?.message || 'Unable to load user transactions.'
        } finally {
            loading.value = false
        }
    }

    async function fetchStatistics() {
        loading.value = true
        error.value = null
        try {
            const response = await axios.get('/api/admin/statistics')
            statistics.value = response.data
            return response.data
        } catch (e) {
            console.error("Error fetching statistics:", e)
            error.value = e.response?.data?.message || 'Unable to load statistics.'
            throw e
        } finally {
            loading.value = false
        }
    }

    return {
        users,
        transactions,
        statistics,
        loading,
        error,
        pagination,
        selectedUser,
        fetchAllUsers,
        fetchUser,
        blockUser,
        unblockUser,
        createAdmin,
        deleteUser,
        fetchAllTransactions,
        fetchUserTransactions,
        fetchStatistics
    }
})
