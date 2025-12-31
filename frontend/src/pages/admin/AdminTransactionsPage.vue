<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-vue-next'

const adminStore = useAdminStore()

const selectedUserId = ref(null)

const displayedUserName = computed(() => {
  if (selectedUserId.value && adminStore.selectedUser) {
    return `${adminStore.selectedUser.nickname} (${adminStore.selectedUser.name})`
  }
  return 'All Users'
})

const currentBalance = computed(() => {
  if (selectedUserId.value && adminStore.selectedUser) {
    return adminStore.selectedUser.coins_balance
  }
  return null
})

onMounted(async () => {
  await adminStore.fetchAllUsers(1, 1000) // Get all users for dropdown
  adminStore.fetchAllTransactions()
})

const handleUserChange = (event) => {
  const userId = event.target.value
  selectedUserId.value = userId || null

  if (!userId) {
    adminStore.fetchAllTransactions(1, adminStore.pagination.perPage)
  } else {
    adminStore.fetchUserTransactions(userId, 1, adminStore.pagination.perPage)
  }
}

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= adminStore.pagination.lastPage) {
    if (selectedUserId.value) {
      adminStore.fetchUserTransactions(selectedUserId.value, page, adminStore.pagination.perPage)
    } else {
      adminStore.fetchAllTransactions(page, adminStore.pagination.perPage)
    }
  }
}

const nextPage = () => {
  if (adminStore.pagination.currentPage < adminStore.pagination.lastPage) {
    goToPage(adminStore.pagination.currentPage + 1)
  }
}

const previousPage = () => {
  if (adminStore.pagination.currentPage > 1) {
    goToPage(adminStore.pagination.currentPage - 1)
  }
}

const getPageNumbers = () => {
  const current = adminStore.pagination.currentPage
  const last = adminStore.pagination.lastPage
  const pages = []

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(last - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < last - 2) pages.push('...')
    pages.push(last)
  }

  return pages
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    <div
      class="w-full max-w-6xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mx-4"
    >
      <!-- Header -->
      <div class="p-6 border-b border-slate-100">
        <div class="space-y-1.5 mb-6">
          <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
            <Wallet class="w-6 h-6 text-blue-600" />
            Transaction History (Admin View)
          </h3>
          <p class="text-sm text-slate-500">View all platform transactions (read-only).</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <!-- User Filter -->
          <div class="flex items-center gap-2 flex-1">
            <Users class="w-4 h-4 text-slate-500" />
            <select
              :value="selectedUserId || ''"
              @change="handleUserChange"
              class="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm font-medium text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            >
              <option value="">All Users</option>
              <option v-for="user in adminStore.users" :key="user.id" :value="user.id">
                {{ user.nickname }} ({{ user.name }}) - {{ user.type === 'A' ? 'Admin' : 'Player' }}
              </option>
            </select>
          </div>

          <!-- User Info -->
          <div class="flex items-center gap-4">
            <div
              class="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200"
            >
              <span class="text-sm font-medium text-slate-600">Viewing:</span>
              <span class="font-bold text-slate-900">{{ displayedUserName }}</span>
            </div>

            <div
              v-if="currentBalance !== null"
              class="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200"
            >
              <Wallet class="w-4 h-4 text-yellow-600" />
              <span class="text-sm font-medium text-yellow-700">Balance:</span>
              <span class="font-bold text-yellow-900">{{ currentBalance }} 🪙</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="adminStore.loading"
        class="py-12 flex flex-col items-center justify-center text-slate-500"
      >
        <Loader2 class="w-8 h-8 animate-spin mb-2 text-blue-600" />
        <p>Loading transactions...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="adminStore.error"
        class="py-12 flex flex-col items-center justify-center text-red-500"
      >
        <AlertCircle class="w-8 h-8 mb-2" />
        <p>{{ adminStore.error }}</p>
      </div>

      <!-- Transactions Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-4 text-left">Date</th>
              <th v-if="!selectedUserId" class="px-6 py-4 text-left">User</th>
              <th class="px-6 py-4 text-left">Description / Type</th>
              <th class="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="t in adminStore.transactions"
              :key="t.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                {{ formatDate(t.transaction_datetime) }}
              </td>

              <td v-if="!selectedUserId" class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold"
                  >
                    {{ t.user?.nickname?.[0]?.toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">
                      {{ t.user?.nickname || 'Unknown' }}
                    </div>
                    <div class="text-xs text-slate-500">{{ t.user?.name || '-' }}</div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="p-2 rounded-full"
                    :class="t.coins > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                  >
                    <TrendingUp v-if="t.coins > 0" class="w-4 h-4" />
                    <TrendingDown v-else class="w-4 h-4" />
                  </div>

                  <div>
                    <div class="font-medium text-slate-900">
                      {{ t.type ? t.type.name : 'Transaction' }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ t.coins > 0 ? 'Wallet credit' : 'Wallet debit' }}
                    </div>
                  </div>
                </div>
              </td>

              <td class="px-6 py-4 text-right">
                <Badge
                  :variant="t.coins > 0 ? 'outline' : 'destructive'"
                  :class="
                    t.coins > 0
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  "
                >
                  {{ t.coins > 0 ? '+' : '' }}{{ t.coins }} coins
                </Badge>
              </td>
            </tr>

            <tr v-if="adminStore.transactions.length === 0">
              <td :colspan="selectedUserId ? 3 : 4" class="px-6 py-12 text-center text-slate-500">
                <Wallet class="w-8 h-8 opacity-20 mx-auto mb-2" />
                <p>No transactions found.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="!adminStore.loading && !adminStore.error && adminStore.transactions.length > 0"
        class="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/50"
      >
        <div class="text-sm text-slate-600">
          Showing
          <span class="font-medium">{{
            (adminStore.pagination.currentPage - 1) * adminStore.pagination.perPage + 1
          }}</span>
          to
          <span class="font-medium">{{
            Math.min(
              adminStore.pagination.currentPage * adminStore.pagination.perPage,
              adminStore.pagination.total,
            )
          }}</span>
          of
          <span class="font-medium">{{ adminStore.pagination.total }}</span>
          transactions
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="previousPage"
            :disabled="adminStore.pagination.currentPage === 1"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft class="w-4 h-4" />
            <span class="text-sm font-medium">Previous</span>
          </button>

          <div class="flex items-center gap-1">
            <template v-for="page in getPageNumbers()" :key="page">
              <button
                v-if="page !== '...'"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  page === adminStore.pagination.currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-300 hover:bg-slate-50',
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-2 text-slate-400">...</span>
            </template>
          </div>

          <button
            @click="nextPage"
            :disabled="adminStore.pagination.currentPage === adminStore.pagination.lastPage"
            class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <span class="text-sm font-medium">Next</span>
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Read-only Notice -->
      <div class="bg-blue-50 border-t border-blue-200 px-6 py-3">
        <p class="text-sm text-blue-800 text-center">
          ℹ️ <strong>Read-only view:</strong> Administrators can view transaction history but cannot
          create, modify, or delete transactions.
        </p>
      </div>
    </div>
  </div>
</template>
