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
            <Users class="w-6 h-6 text-purple-600" />
            Match History
          </h3>
          <p class="text-sm text-slate-500">View all your completed matches</p>
        </div>
      </div>

      <div class="p-0">
        <!-- Loading State -->
        <div
          v-if="matchesStore.loading"
          class="py-12 flex flex-col items-center justify-center text-slate-500"
        >
          <Loader2 class="w-8 h-8 animate-spin mb-2 text-primary" />
          <p>Loading matches...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="matchesStore.error"
          class="py-12 flex flex-col items-center justify-center text-red-500"
        >
          <XCircle class="w-8 h-8 mb-2" />
          <p>{{ matchesStore.error }}</p>
        </div>

        <!-- Content -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50/80 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Type</th>
                <th class="px-6 py-4">Game Type</th>
                <th class="px-6 py-4">Players</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="match in matchesStore.matches"
                :key="match.id"
                @click="openMatchDetails(match)"
                class="hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                  {{ formatDate(match.began_at) }}
                </td>

                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-2">
                      <component
                        :is="matchMode.icon"
                        class="w-4 h-4"
                        :class="`text-${matchMode.color}-600`"
                      />
                      <span class="font-medium text-slate-900">
                        {{ matchMode.label }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <span>Best of 4 Marks</span>
                      <template v-if="authStore.currentUser?.type === 'A'">
                        <span>•</span>
                        <span>ID: #{{ match.id }}</span>
                      </template>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" class="bg-amber-50 text-amber-700 border-amber-200">
                    Bisca de {{ match.type }}
                  </Badge>
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-900">{{
                      getPlayerInfo(match).myName
                    }}</span>
                    <span class="text-slate-400 text-sm">vs</span>
                    <span class="font-medium text-slate-900">{{
                      getPlayerInfo(match).opponentName
                    }}</span>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <Badge
                    variant="outline"
                    :class="{
                      'bg-slate-100': match.status?.toLowerCase() === 'ended',
                      'bg-blue-50 text-blue-700 border-blue-200':
                        match.status?.toLowerCase() === 'in_progress',
                      'bg-red-50 text-red-700 border-red-200':
                        match.status?.toLowerCase() === 'interrupted',
                    }"
                  >
                    {{ match.status }}
                  </Badge>
                </td>

                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end">
                    <Badge
                      v-if="match.status?.toLowerCase() === 'ended'"
                      variant="outline"
                      :class="{
                        'bg-green-50 text-green-700 border-green-200':
                          getMatchResult(match).color === 'green',
                        'bg-red-50 text-red-700 border-red-200':
                          getMatchResult(match).color === 'red',
                        'bg-slate-100 text-slate-600': getMatchResult(match).color === 'slate',
                      }"
                      class="flex items-center gap-1 pl-1 pr-3 py-1"
                    >
                      <component :is="getMatchResult(match).icon" class="w-3.5 h-3.5" />
                      {{ getMatchResult(match).label }}
                    </Badge>
                    <span v-else class="text-slate-400 italic text-xs">In Progress...</span>
                  </div>
                </td>
              </tr>

              <tr v-if="matchesStore.matches.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                  <div class="flex flex-col items-center gap-2">
                    <Users class="w-8 h-8 opacity-20" />
                    <p>No matches found. Play some games to build your match history!</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div
          v-if="!matchesStore.loading && !matchesStore.error && matchesStore.matches.length > 0"
          class="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50/50"
        >
          <!-- Results info -->
          <div class="text-sm text-slate-600">
            Showing
            <span class="font-medium">{{
              (matchesStore.currentPage - 1) * matchesStore.perPage + 1
            }}</span>
            to
            <span class="font-medium">{{
              Math.min(matchesStore.currentPage * matchesStore.perPage, matchesStore.total)
            }}</span>
            of
            <span class="font-medium">{{ matchesStore.total }}</span>
            matches
          </div>

          <!-- Page controls -->
          <div class="flex items-center gap-2">
            <button
              @click="matchesStore.previousPage()"
              :disabled="!matchesStore.hasPreviousPage"
              class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft class="w-4 h-4" />
              <span class="text-sm font-medium">Previous</span>
            </button>

            <!-- Page numbers -->
            <div class="flex items-center gap-1">
              <template v-for="page in getPageNumbers()" :key="page">
                <button
                  v-if="page !== '...'"
                  @click="matchesStore.goToPage(page)"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    page === matchesStore.currentPage
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-slate-300 hover:bg-slate-50',
                  ]"
                >
                  {{ page }}
                </button>
                <span v-else class="px-2 text-slate-400">...</span>
              </template>
            </div>

            <button
              @click="matchesStore.nextPage()"
              :disabled="!matchesStore.hasNextPage"
              class="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span class="text-sm font-medium">Next</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Match Details Modal -->
    <div
      v-if="showMatchModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeMatchModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start"
        >
          <div>
            <h2 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users class="w-6 h-6 text-purple-600" />
              Match Details
            </h2>
            <p v-if="authStore.currentUser?.type === 'A'" class="text-sm text-slate-500 mt-1">
              Match #{{ selectedMatchDetails?.id }}
            </p>
          </div>
          <button
            @click="closeMatchModal"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XCircle class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6" v-if="selectedMatchDetails">
          <!-- Match Type & Status & Result -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-slate-50 rounded-lg p-4">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Match Type</div>
              <div class="flex items-center gap-2">
                <Users class="w-5 h-5 text-purple-600" />
                <span class="font-semibold text-slate-900">Multiplayer Match</span>
              </div>
              <div class="text-sm text-slate-600 mt-1">
                Bisca de {{ selectedMatchDetails.type }}
              </div>
            </div>

            <div class="bg-slate-50 rounded-lg p-4">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Status</div>
              <Badge
                variant="outline"
                :class="{
                  'bg-slate-100': selectedMatchDetails.status?.toLowerCase() === 'ended',
                  'bg-blue-50 text-blue-700 border-blue-200':
                    selectedMatchDetails.status?.toLowerCase() === 'in_progress',
                  'bg-red-50 text-red-700 border-red-200':
                    selectedMatchDetails.status?.toLowerCase() === 'interrupted',
                }"
              >
                {{ selectedMatchDetails.status }}
              </Badge>
            </div>

            <div class="bg-slate-50 rounded-lg p-4">
              <div class="text-xs text-slate-500 uppercase font-semibold mb-1">Result</div>
              <div class="flex items-center gap-2">
                <component
                  :is="getMatchResult(selectedMatchDetails).icon"
                  class="w-5 h-5"
                  :class="{
                    'text-green-600': getMatchResult(selectedMatchDetails).color === 'green',
                    'text-red-600': getMatchResult(selectedMatchDetails).color === 'red',
                    'text-slate-600': getMatchResult(selectedMatchDetails).color === 'slate',
                    'text-blue-600': getMatchResult(selectedMatchDetails).color === 'blue',
                  }"
                />
                <span
                  class="font-semibold"
                  :class="{
                    'text-green-700': getMatchResult(selectedMatchDetails).color === 'green',
                    'text-red-700': getMatchResult(selectedMatchDetails).color === 'red',
                    'text-slate-700': getMatchResult(selectedMatchDetails).color === 'slate',
                    'text-blue-700': getMatchResult(selectedMatchDetails).color === 'blue',
                  }"
                >
                  {{ getMatchResult(selectedMatchDetails).label }}
                </span>
              </div>
            </div>
          </div>

          <!-- Match Info -->
          <div class="space-y-3">
            <div class="flex py-3 border-b border-gray-100">
              <span class="w-40 font-semibold text-gray-600">Match Format:</span>
              <span class="text-gray-900">Best of 4 Marks</span>
            </div>
            <div class="flex py-3 border-b border-gray-100">
              <span class="w-40 font-semibold text-gray-600">Total Games:</span>
              <span class="text-gray-900">{{ selectedMatchDetails.games?.length || 0 }}</span>
            </div>
            <div class="flex py-3 border-b border-gray-100">
              <span class="w-40 font-semibold text-gray-600">Started:</span>
              <span class="text-gray-900">{{ formatDateTime(selectedMatchDetails.began_at) }}</span>
            </div>
            <div v-if="selectedMatchDetails.ended_at" class="flex py-3 border-b border-gray-100">
              <span class="w-40 font-semibold text-gray-600">Ended:</span>
              <span class="text-gray-900">{{ formatDateTime(selectedMatchDetails.ended_at) }}</span>
            </div>
          </div>

          <!-- Players Section -->
          <div class="border border-slate-200 rounded-lg p-4 space-y-4">
            <h3 class="font-semibold text-slate-900 flex items-center gap-2">
              <Users class="w-5 h-5 text-blue-600" />
              Players & Result
            </h3>
            <!-- Current User (You) -->
            <div
              class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users class="w-5 h-5 text-white" />
                </div>
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ getPlayerInfo(selectedMatchDetails).myName }}
                  </div>
                  <div class="text-sm text-slate-500">
                    {{ getPlayerInfo(selectedMatchDetails).myGamesWon }} games won •
                    {{ getPlayerInfo(selectedMatchDetails).myMarks }} marks
                  </div>
                </div>
              </div>
              <div v-if="selectedMatchDetails.winner_user_id === authStore.currentUser?.id">
                <Trophy class="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            <!-- VS Divider -->
            <div class="text-center text-sm font-semibold text-slate-400">VS</div>

            <!-- Opponent -->
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
                  <Users class="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ getPlayerInfo(selectedMatchDetails).opponentName }}
                  </div>
                  <div class="text-sm text-slate-500">
                    {{ getPlayerInfo(selectedMatchDetails).opponentGamesWon }} games won •
                    {{ getPlayerInfo(selectedMatchDetails).opponentMarks }} marks
                  </div>
                </div>
              </div>
              <div
                v-if="
                  selectedMatchDetails.winner_user_id &&
                  selectedMatchDetails.winner_user_id !== authStore.currentUser?.id
                "
              >
                <Trophy class="w-6 h-6 text-yellow-500" />
              </div>
            </div>

            <!-- Draw indicator -->
            <div
              v-if="
                !selectedMatchDetails.winner_user_id &&
                selectedMatchDetails.status?.toLowerCase() === 'ended'
              "
              class="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div class="flex items-center justify-center gap-2 text-amber-800">
                <Swords class="w-5 h-5" />
                <span class="font-semibold">Match ended in a draw</span>
              </div>
            </div>
          </div>

          <!-- Achievement Statistics -->
          <div v-if="hasAchievements" class="border border-slate-200 rounded-lg p-4 space-y-4">
            <h3 class="text-xl font-semibold text-gray-900">Achievements</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- User's Achievements -->
              <div
                v-if="getPlayerInfo(selectedMatchDetails).myCapotes > 0"
                class="bg-blue-50 rounded-lg p-4 border-2 border-blue-200"
              >
                <div class="text-sm text-blue-600 font-semibold mb-1">
                  {{ getPlayerInfo(selectedMatchDetails).myName }} Capotes
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ getPlayerInfo(selectedMatchDetails).myCapotes }}
                </div>
              </div>
              <div
                v-if="getPlayerInfo(selectedMatchDetails).myBandeiras > 0"
                class="bg-blue-50 rounded-lg p-4 border-2 border-blue-200"
              >
                <div class="text-sm text-blue-600 font-semibold mb-1">
                  {{ getPlayerInfo(selectedMatchDetails).myName }} Bandeiras
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ getPlayerInfo(selectedMatchDetails).myBandeiras }}
                </div>
              </div>

              <!-- Opponent's Achievements -->
              <div
                v-if="getPlayerInfo(selectedMatchDetails).opponentCapotes > 0"
                class="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div class="text-sm text-gray-600 mb-1">
                  {{ getPlayerInfo(selectedMatchDetails).opponentName }} Capotes
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ getPlayerInfo(selectedMatchDetails).opponentCapotes }}
                </div>
              </div>
              <div
                v-if="getPlayerInfo(selectedMatchDetails).opponentBandeiras > 0"
                class="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div class="text-sm text-gray-600 mb-1">
                  {{ getPlayerInfo(selectedMatchDetails).opponentName }} Bandeiras
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ getPlayerInfo(selectedMatchDetails).opponentBandeiras }}
                </div>
              </div>
            </div>
          </div>

          <!-- Games List -->
          <div
            v-if="selectedMatchDetails.games && selectedMatchDetails.games.length > 0"
            class="border border-slate-200 rounded-lg p-4 space-y-4"
          >
            <h3 class="text-xl font-semibold text-gray-900">
              Games in this Match ({{ selectedMatchDetails.games.length }})
            </h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Game #
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Winner
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Achievements
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(game, index) in selectedMatchDetails.games" :key="game.id">
                    <td class="px-4 py-3 whitespace-nowrap">{{ index + 1 }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">{{ game.winner?.nickname || '—' }}</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      {{ game.player1_points }} - {{ game.player2_points }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex gap-2 flex-wrap">
                        <span
                          v-if="game.is_capote"
                          class="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800"
                        >
                          Capote
                        </span>
                        <span
                          v-if="game.is_bandeira"
                          class="px-2 py-1 text-xs font-semibold rounded bg-pink-100 text-pink-800"
                        >
                          Bandeira
                        </span>
                        <span
                          v-if="game.is_forfeit"
                          class="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800"
                        >
                          Forfeit
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap text-gray-500">
                      {{ formatTime(game.began_at) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4">
          <button
            @click="closeMatchModal"
            class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMatchesStore } from '@/stores/matches'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
// Icons
import { Loader2, Users, XCircle, ChevronLeft, ChevronRight, Trophy, Swords } from 'lucide-vue-next'

const matchesStore = useMatchesStore()
const authStore = useAuthStore()
const showMatchModal = ref(false)
const selectedMatchDetails = ref(null)

const hasAchievements = computed(() => {
  if (!selectedMatchDetails.value) return false
  return (
    selectedMatchDetails.value.player1_capotes > 0 ||
    selectedMatchDetails.value.player1_bandeiras > 0 ||
    selectedMatchDetails.value.player2_capotes > 0 ||
    selectedMatchDetails.value.player2_bandeiras > 0
  )
})

// Get player display information from user's perspective
const getPlayerInfo = (match) => {
  const myId = authStore.currentUser?.id

  // Determine if user is player1 or player2
  const isPlayer1 = match.player1_user_id === myId
  const isPlayer2 = match.player2_user_id === myId

  if (isPlayer1) {
    return {
      myName: 'You',
      opponentName: match.player2?.nickname || match.player2?.name || 'Unknown',
      myMarks: match.player1_marks,
      opponentMarks: match.player2_marks,
      myGamesWon: match.player1_total_games_won,
      opponentGamesWon: match.player2_total_games_won,
      myCapotes: match.player1_capotes || 0,
      opponentCapotes: match.player2_capotes || 0,
      myBandeiras: match.player1_bandeiras || 0,
      opponentBandeiras: match.player2_bandeiras || 0,
    }
  } else if (isPlayer2) {
    return {
      myName: 'You',
      opponentName: match.player1?.nickname || match.player1?.name || 'Unknown',
      myMarks: match.player2_marks,
      opponentMarks: match.player1_marks,
      myGamesWon: match.player2_total_games_won,
      opponentGamesWon: match.player1_total_games_won,
      myCapotes: match.player2_capotes || 0,
      opponentCapotes: match.player1_capotes || 0,
      myBandeiras: match.player2_bandeiras || 0,
      opponentBandeiras: match.player1_bandeiras || 0,
    }
  } else {
    // Admin view (viewing someone else's match)
    return {
      myName: match.player1?.nickname || match.player1?.name || 'Player 1',
      opponentName: match.player2?.nickname || match.player2?.name || 'Player 2',
      myMarks: match.player1_marks,
      opponentMarks: match.player2_marks,
      myGamesWon: match.player1_total_games_won,
      opponentGamesWon: match.player2_total_games_won,
      myCapotes: match.player1_capotes || 0,
      opponentCapotes: match.player2_capotes || 0,
      myBandeiras: match.player1_bandeiras || 0,
      opponentBandeiras: match.player2_bandeiras || 0,
    }
  }
}

// Logic to determine the match result
const getMatchResult = (match) => {
  if (match.status?.toLowerCase() !== 'ended') {
    return { label: 'In Progress', color: 'blue', icon: Users }
  }

  // If there's no defined winner (draw or error)
  if (!match.winner_user_id) return { label: 'Draw', color: 'slate', icon: Swords }

  // Check if I won
  const myId = authStore.currentUser?.id
  if (match.winner_user_id === myId) {
    return { label: 'Victory', color: 'green', icon: Trophy }
  } else {
    return { label: 'Defeat', color: 'red', icon: XCircle }
  }
}

// Determine match mode - all matches are multiplayer
const matchMode = computed(() => {
  // All matches are multiplayer - the type field indicates the game variant (3 or 9 cards)
  return { label: 'Match', icon: Users, color: 'purple' }
})

onMounted(() => {
  matchesStore.fetchMatches()
})

async function openMatchDetails(match) {
  // Prevent duplicate calls if already loading or modal is open
  if (matchesStore.loading || showMatchModal.value) {
    return
  }

  try {
    selectedMatchDetails.value = await matchesStore.fetchMatchDetails(match.id)
    showMatchModal.value = true
  } catch (error) {
    console.error('Failed to load match details:', error)
  }
}

function closeMatchModal() {
  showMatchModal.value = false
  setTimeout(() => {
    selectedMatchDetails.value = null
    matchesStore.clearSelectedMatch()
  }, 300)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPageNumbers() {
  const pages = []
  const current = matchesStore.currentPage
  const last = matchesStore.lastPage

  if (last <= 7) {
    for (let i = 1; i <= last; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(last)
    } else if (current >= last - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = last - 4; i <= last; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(last)
    }
  }

  return pages
}
</script>
