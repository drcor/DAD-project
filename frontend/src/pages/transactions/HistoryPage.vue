<script setup>
import { onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { useAuthStore } from '@/stores/auth' // To show total balance
import { Badge } from '@/components/ui/badge'
// Icons
import { 
  Loader2, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle 
} from 'lucide-vue-next'

const store = useTransactionsStore()
const authStore = useAuthStore()

onMounted(() => {
    // Refresh user data to ensure balance is up-to-date
    authStore.refreshUserData()
        .catch(err => console.error('Failed to refresh user data:', err))
    
    // Fetch transaction history
    store.fetchMyTransactions()
})

// Format date (e.g.: 27/12/2024 18:30)
const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    
    <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mx-4">
      
      <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div class="space-y-1.5">
          <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
            <History class="w-6 h-6 text-blue-600" />
            Transaction History
          </h3>
          <p class="text-sm text-slate-500">
            View all your virtual wallet movements.
          </p>
        </div>

        <div class="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <Wallet class="w-4 h-4 text-slate-500" />
            <span class="text-sm font-medium text-slate-600">Current Balance:</span>
            <span class="font-bold text-slate-900">{{ authStore.currentUser?.coins_balance ?? 0 }} 🪙</span>
        </div>
      </div>

      <div class="p-0">
        
        <div v-if="store.loading" class="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 class="w-8 h-8 animate-spin mb-2 text-primary" />
            <p>Loading transactions...</p>
        </div>

        <div v-else-if="store.error" class="py-12 flex flex-col items-center justify-center text-red-500">
            <AlertCircle class="w-8 h-8 mb-2" />
            <p>{{ store.error }}</p>
        </div>

        <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                        <th class="px-6 py-4">Date</th>
                        <th class="px-6 py-4">Description / Type</th>
                        <th class="px-6 py-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    
                    <tr v-for="t in store.transactions" :key="t.id" class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                            {{ formatDate(t.transaction_datetime) }}
                        </td>

                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="p-2 rounded-full" :class="t.coins > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
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
                            <Badge :variant="t.coins > 0 ? 'outline' : 'destructive'" 
                                   :class="t.coins > 0 
                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'">
                                {{ t.coins > 0 ? '+' : '' }}{{ t.coins }} coins
                            </Badge>
                        </td>
                    </tr>

                    <tr v-if="store.transactions.length === 0">
                        <td colspan="3" class="px-6 py-12 text-center text-slate-500">
                            <div class="flex flex-col items-center gap-2">
                                <History class="w-8 h-8 opacity-20" />
                                <p>You don't have any registered transactions yet.</p>
                            </div>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
      </div>
    </div>
  </div>
</template>