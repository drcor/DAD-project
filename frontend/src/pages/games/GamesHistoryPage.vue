<script setup>
import { onMounted, ref } from 'vue'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
// Icons
import { Loader2, Gamepad2, Trophy, XCircle, Clock, Swords, Users } from 'lucide-vue-next'

const store = useGamesStore()
const authStore = useAuthStore()
const selectedGame = ref(null)
const showModal = ref(false)

onMounted(() => {
  // Refresh user data to ensure balance is up-to-date
  authStore.refreshUserData().catch((err) => console.error('Failed to refresh user data:', err))

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

const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
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

// Determine game mode based on player data
const getGameMode = (game) => {
  // Since only multiplayer games are stored, all are multiplayer
  // But we can check if it's part of a match
  if (game.match_id) {
    return { label: 'Match', icon: Users, color: 'purple' }
  }
  return { label: 'Multiplayer', icon: Users, color: 'blue' }
}

const viewGameDetails = (game) => {
  selectedGame.value = game
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedGame.value = null
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
                @click="viewGameDetails(game)"
                class="hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                  {{ formatDate(game.began_at) }}
                </td>

                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <component
                        :is="getGameMode(game).icon"
                        class="w-4 h-4"
                        :class="`text-${getGameMode(game).color}-600`"
                      />
                      <span class="font-medium text-slate-900">
                        {{ getGameMode(game).label }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <span>Bisca de {{ game.type }}</span>
                      <span>•</span>
                      <span>ID: #{{ game.id }}</span>
                    </div>
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

    <!-- Game Details Modal -->
    <div
      v-if="showModal && selectedGame"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start"
        >
          <div>
            <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Gamepad2 class="w-6 h-6 text-purple-600" />
              Game Details
            </h2>
            <p class="text-sm text-slate-500 mt-1">Game #{{ selectedGame.id }}</p>
          </div>
          <button @click="closeModal" class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <XCircle class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Game Type & Status -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-50 rounded-lg p-4">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Game Type</div>
              <div class="flex items-center gap-2">
                <component
                  :is="getGameMode(selectedGame).icon"
                  class="w-5 h-5"
                  :class="`text-${getGameMode(selectedGame).color}-600`"
                />
                <span class="font-semibold text-slate-900">
                  {{ getGameMode(selectedGame).label }}
                </span>
              </div>
              <div class="text-sm text-slate-600 mt-1">Bisca de {{ selectedGame.type }}</div>
            </div>

            <div class="bg-slate-50 rounded-lg p-4">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Status</div>
              <Badge
                variant="outline"
                :class="
                  selectedGame.status === 'Ended'
                    ? 'bg-slate-100'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                "
              >
                {{ selectedGame.status }}
              </Badge>
            </div>
          </div>

          <!-- Players & Result -->
          <div class="border border-slate-200 rounded-lg p-4 space-y-4">
            <h3 class="font-semibold text-slate-900 flex items-center gap-2">
              <Users class="w-5 h-5 text-blue-600" />
              Players & Result
            </h3>

            <!-- Player 1 -->
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ selectedGame.player1?.nickname || 'Player 1' }}
                    <span
                      v-if="selectedGame.player1_user_id === authStore.currentUser?.id"
                      class="text-xs text-blue-600"
                      >(You)</span
                    >
                  </div>
                  <div class="text-sm text-slate-500">
                    {{ selectedGame.player1_points || 0 }} points
                  </div>
                </div>
              </div>
              <div v-if="selectedGame.winner_user_id === selectedGame.player1_user_id">
                <Trophy class="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            <!-- VS Divider -->
            <div class="text-center text-sm font-semibold text-slate-400">VS</div>

            <!-- Player 2 -->
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Users class="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ selectedGame.player2?.nickname || 'Player 2' }}
                    <span
                      v-if="selectedGame.player2_user_id === authStore.currentUser?.id"
                      class="text-xs text-blue-600"
                      >(You)</span
                    >
                  </div>
                  <div class="text-sm text-slate-500">
                    {{ selectedGame.player2_points || 0 }} points
                  </div>
                </div>
              </div>
              <div v-if="selectedGame.winner_user_id === selectedGame.player2_user_id">
                <Trophy class="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            <!-- Draw indicator -->
            <div
              v-if="selectedGame.is_draw"
              class="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div class="flex items-center justify-center gap-2 text-amber-800">
                <Swords class="w-5 h-5" />
                <span class="font-semibold">Game ended in a draw</span>
              </div>
            </div>
          </div>

          <!-- Game Timeline -->
          <div class="border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 class="font-semibold text-slate-900 flex items-center gap-2">
              <Clock class="w-5 h-5 text-green-600" />
              Timeline
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-600">Started:</span>
                <span class="font-medium text-slate-900">{{
                  formatDate(selectedGame.began_at)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Ended:</span>
                <span class="font-medium text-slate-900">{{
                  formatDate(selectedGame.ended_at)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Duration:</span>
                <span class="font-medium text-slate-900">{{
                  formatDuration(selectedGame.total_time)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Match Info (if part of a match) -->
          <div
            v-if="selectedGame.game_match"
            class="border border-purple-200 bg-purple-50 rounded-lg p-4 space-y-3"
          >
            <h3 class="font-semibold text-purple-900 flex items-center gap-2">
              <Users class="w-5 h-5 text-purple-600" />
              Match Information
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-purple-700">Match ID:</span>
                <span class="font-medium text-purple-900">#{{ selectedGame.match_id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-purple-700">Match Type:</span>
                <span class="font-medium text-purple-900">Best of 4 Marks</span>
              </div>
              <div v-if="selectedGame.game_match.status" class="flex justify-between">
                <span class="text-purple-700">Match Status:</span>
                <Badge variant="outline" class="bg-white">{{
                  selectedGame.game_match.status
                }}</Badge>
              </div>
            </div>
          </div>

          <!-- Final Result -->
          <div class="border-t border-slate-200 pt-4">
            <div class="text-center">
              <div
                class="inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                :class="{
                  'bg-green-50 border-2 border-green-200':
                    getGameResult(selectedGame).color === 'green',
                  'bg-red-50 border-2 border-red-200': getGameResult(selectedGame).color === 'red',
                  'bg-slate-50 border-2 border-slate-200':
                    getGameResult(selectedGame).color === 'slate',
                }"
              >
                <component
                  :is="getGameResult(selectedGame).icon"
                  class="w-6 h-6"
                  :class="{
                    'text-green-600': getGameResult(selectedGame).color === 'green',
                    'text-red-600': getGameResult(selectedGame).color === 'red',
                    'text-slate-600': getGameResult(selectedGame).color === 'slate',
                  }"
                />
                <span
                  class="text-xl font-bold"
                  :class="{
                    'text-green-700': getGameResult(selectedGame).color === 'green',
                    'text-red-700': getGameResult(selectedGame).color === 'red',
                    'text-slate-700': getGameResult(selectedGame).color === 'slate',
                  }"
                >
                  {{ getGameResult(selectedGame).label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4">
          <button
            @click="closeModal"
            class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
