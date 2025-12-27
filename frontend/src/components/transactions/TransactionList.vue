<script setup>
import { onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { Badge } from '@/components/ui/badge'

const store = useTransactionsStore()

onMounted(() => {
    store.fetchMyTransactions()
})

const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('pt-PT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}
</script>

<template>
    <div class="space-y-4">
        <h2 class="text-2xl font-bold">Histórico de Movimentos</h2>

        <div v-if="store.loading" class="text-gray-500">A carregar...</div>

        <div v-else class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
                <thead class="bg-gray-100 text-gray-700 uppercase">
                    <tr>
                        <th class="px-6 py-3">Data</th>
                        <th class="px-6 py-3">Tipo</th>
                        <th class="px-6 py-3">Valor</th>
                        <th class="px-6 py-3">Descrição</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in store.transactions" :key="t.id" class="border-b hover:bg-gray-50/50">
                        <td class="p-4 align-middle">{{ formatDate(t.transaction_datetime) }}</td>

                        <td class="p-4 align-middle">
                            <Badge :variant="t.coins > 0 ? 'secondary' : 'destructive'">
                                {{ t.coins > 0 ? 'Entrada' : 'Saída' }}
                            </Badge>
                            <span class="ml-2 text-xs text-gray-500">
                                {{ t.type ? t.type.name : 'Transação' }}
                            </span>
                        </td>

                        <td class="p-4 align-middle text-right font-bold"
                            :class="t.coins > 0 ? 'text-green-600' : 'text-red-600'">
                            {{ t.coins > 0 ? '+' : '' }}{{ t.coins }}
                        </td>
                    </tr>

                    <tr v-if="store.transactions.length === 0">
                        <td colspan="3" class="p-4 text-center text-gray-500">
                            Ainda não existem transações.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>