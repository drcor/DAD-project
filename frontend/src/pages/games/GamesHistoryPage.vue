<script setup>
import { onMounted } from 'vue'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
// Icons
import { Loader2, Gamepad2, Trophy, XCircle, Clock, Swords } from 'lucide-vue-next'

const store = useGamesStore()
const authStore = useAuthStore()

onMounted(() => {
  // Refresh user data to ensure balance is up-to-date
  authStore.refreshUserData()
    .catch(err => console.error('Failed to refresh user data:', err))
  
  // Fetch game history
  store.fetchMyGames()
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// Logic to determine the game result
const getGameResult = (game) => {
  if (game.status !== 'Ended') return { label: 'In Progress', color: 'blue', icon: Clock }

  // If there's no defined winner (draw or error)
  if (!game.winner_user_id) return { label: 'Draw', color: 'slate', icon: Swords }

  // Check if I won
  const myId = authStore.currentUser?.id
  if (game.winner_user_id === myId) {
    return { label: 'Victory', color: 'green', icon: Trophy }
  } else {
    return { label: 'Defeat', color: 'red', icon: XCircle }
  }
}
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    <div
      class="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mx-4"
    >
      <div
        class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1.5">
          <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
            <Gamepad2 class="w-6 h-6 text-purple-600" />
            Game History
          </h3>
          <p class="text-sm text-slate-500">View the results of your online matches.</p>
        </div>
      </div>

      <div class="p-0">
        <div
          v-if="store.loading"
          class="py-12 flex flex-col items-center justify-center text-slate-500"
        >
          <Loader2 class="w-8 h-8 animate-spin mb-2 text-primary" />
          <p>Loading games...</p>
        </div>

        <div
          v-else-if="store.error"
          class="py-12 flex flex-col items-center justify-center text-red-500"
        >
          <XCircle class="w-8 h-8 mb-2" />
          <p>{{ store.error }}</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Type</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="game in store.games"
                :key="game.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                  {{ formatDate(game.began_at) }}
                </td>

                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="font-medium text-slate-900">
                      {{ game.type === 'M' ? 'Multiplayer' : 'Singleplayer' }}
                    </span>
                    <span class="text-xs text-slate-500"> ID: #{{ game.id }} </span>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <Badge
                    variant="outline"
                    :class="
                      game.status === 'Ended'
                        ? 'bg-slate-100'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    "
                  >
                    {{ game.status }}
                  </Badge>
                </td>

                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end">
                    <Badge
                      v-if="game.status === 'Ended'"
                      variant="outline"
                      :class="{
                        'bg-green-50 text-green-700 border-green-200':
                          getGameResult(game).color === 'green',
                        'bg-red-50 text-red-700 border-red-200':
                          getGameResult(game).color === 'red',
                        'bg-slate-100 text-slate-600': getGameResult(game).color === 'slate',
                      }"
                      class="flex items-center gap-1 pl-1 pr-3 py-1"
                    >
                      <component :is="getGameResult(game).icon" class="w-3.5 h-3.5" />
                      {{ getGameResult(game).label }}
                    </Badge>
                    <span v-else class="text-slate-400 italic text-xs">Waiting...</span>
                  </div>
                </td>
              </tr>

              <tr v-if="store.games.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <div class="flex flex-col items-center gap-2">
                    <Gamepad2 class="w-8 h-8 opacity-20" />
                    <p>You don't have any registered games yet.</p>
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
