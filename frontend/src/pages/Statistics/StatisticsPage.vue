<script setup>
import { onMounted } from 'vue'
import { useStatisticsStore } from '@/stores/statistics'
import { 
  Trophy, 
  Coins, 
  Crown, 
  Medal, 
  Loader2, 
  TrendingUp 
} from 'lucide-vue-next'

const store = useStatisticsStore()

onMounted(() => {
    store.fetchStatistics()
})

// Função para dar cores às medalhas (1º, 2º, 3º)
const getRankColor = (index) => {
    switch (index) {
        case 0: return 'text-yellow-500 bg-yellow-100 border-yellow-200' // Ouro
        case 1: return 'text-slate-400 bg-slate-100 border-slate-200'   // Prata
        case 2: return 'text-orange-600 bg-orange-100 border-orange-200' // Bronze
        default: return 'text-slate-600 bg-white border-slate-100'       // Outros
    }
}
</script>

<template>
  <div class="min-h-[80vh] py-10 bg-slate-50">
    <div class="container mx-auto px-4">
      
      <div class="mb-10 text-center space-y-2">
        <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-3">
          <Trophy class="w-10 h-10 text-yellow-500" />
          Hall of Fame
        </h1>
        <p class="text-lg text-slate-500">Os melhores jogadores do Casino DAD.</p>
      </div>

      <div v-if="store.loading" class="flex justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-primary" />
      </div>

      <div v-else-if="store.error" class="text-center py-20 text-red-500 bg-white rounded-lg shadow-sm max-w-md mx-auto">
        <p>{{ store.error }}</p>
      </div>

      <div v-else class="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">

        <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <div class="p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-between">
            <h2 class="text-2xl font-bold flex items-center gap-2">
              <Crown class="w-6 h-6" /> Top Vencedores
            </h2>
            <TrendingUp class="w-6 h-6 opacity-50" />
          </div>
          
          <div class="p-0 flex-1">
             <ul class="divide-y divide-slate-100">
                <li v-for="(player, index) in store.topVictories" :key="player.id" class="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                   
                   <div :class="`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${getRankColor(index)}`">
                      <span v-if="index === 0">🥇</span>
                      <span v-else-if="index === 1">🥈</span>
                      <span v-else-if="index === 2">🥉</span>
                      <span v-else>{{ index + 1 }}</span>
                   </div>

                   <div class="flex-1">
                      <div class="font-bold text-slate-800 text-lg">{{ player.nickname }}</div>
                      <div class="text-xs text-slate-400">ID: #{{ player.id }}</div>
                   </div>

                   <div class="text-right">
                      <div class="font-bold text-xl text-blue-600">{{ player.total_victories ?? 0 }}</div>
                      <div class="text-xs font-medium text-slate-500 uppercase">Vitórias</div>
                   </div>
                </li>
             </ul>
             <div v-if="store.topVictories.length === 0" class="p-8 text-center text-slate-400">
                Sem dados disponíveis.
             </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <div class="p-6 bg-gradient-to-r from-green-600 to-green-500 text-white flex items-center justify-between">
            <h2 class="text-2xl font-bold flex items-center gap-2">
              <Coins class="w-6 h-6" /> Top Milionários
            </h2>
            <Medal class="w-6 h-6 opacity-50" />
          </div>
          
          <div class="p-0 flex-1">
             <ul class="divide-y divide-slate-100">
                <li v-for="(player, index) in store.topCoins" :key="player.id" class="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                   
                   <div :class="`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${getRankColor(index)}`">
                      <span v-if="index === 0">🥇</span>
                      <span v-else-if="index === 1">🥈</span>
                      <span v-else-if="index === 2">🥉</span>
                      <span v-else>{{ index + 1 }}</span>
                   </div>

                   <div class="flex-1">
                      <div class="font-bold text-slate-800 text-lg">{{ player.nickname }}</div>
                      <div class="text-xs text-slate-400">ID: #{{ player.id }}</div>
                   </div>

                   <div class="text-right">
                      <div class="font-bold text-xl text-green-600">{{ player.coins_balance }} 🪙</div>
                      <div class="text-xs font-medium text-slate-500 uppercase">Moedas</div>
                   </div>
                </li>
             </ul>
             <div v-if="store.topCoins.length === 0" class="p-8 text-center text-slate-400">
                Sem dados disponíveis.
             </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>