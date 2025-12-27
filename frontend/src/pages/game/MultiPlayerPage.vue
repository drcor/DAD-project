<template>
  <!-- Loading state - show while waiting for game data (but not if game is complete) -->
  <div
    v-if="!gameStarted && !multiplayerGame?.complete"
    class="flex items-center justify-center min-h-screen"
  >
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"
      ></div>
      <p class="text-gray-600">Loading game...</p>
    </div>
  </div>

  <!-- Game UI - only show when game data is loaded OR when game is complete -->
  <div v-else class="flex flex-1 select-none">
    <!-- SIDEBAR -->
    <aside class="w-80 p-4 space-y-3 overflow-y-auto">
      <!-- Match Progress (if playing a match) -->
      <div
        v-if="multiplayerGame?.isMatch"
        class="bg-purple-50 border-2 border-purple-200 rounded-lg p-3"
      >
        <h3 class="text-sm font-bold text-purple-700 mb-2">Match Progress</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Game {{ multiplayerGame.currentGameNumber }}</span>
          </div>
          <div class="space-y-3">
            <div>
              <div class="text-xs text-gray-600 mb-1">Your Marks</div>
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="`my-${i}`"
                  :class="[
                    'w-6 h-6 rounded border-2 flex-shrink-0',
                    i <= (multiplayerGame.myMarks || 0)
                      ? 'bg-green-500 border-green-600'
                      : 'bg-white border-gray-300',
                  ]"
                ></div>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-600 mb-1">Opponent Marks</div>
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="`opp-${i}`"
                  :class="[
                    'w-6 h-6 rounded border-2 flex-shrink-0',
                    i <= (multiplayerGame.opponentMarks || 0)
                      ? 'bg-red-500 border-red-600'
                      : 'bg-white border-gray-300',
                  ]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Timer -->
      <div
        v-if="!multiplayerGame?.complete && gameStarted"
        :class="[
          'border-2 rounded-lg p-3',
          multiplayerGame?.timerWarning
            ? 'bg-red-50 border-red-500'
            : multiplayerGame?.isMyTurn
              ? 'bg-blue-50 border-blue-500'
              : 'bg-gray-50 border-gray-300',
        ]"
      >
        <h3
          :class="[
            'text-sm font-bold mb-2',
            multiplayerGame?.timerWarning
              ? 'text-red-700'
              : multiplayerGame?.isMyTurn
                ? 'text-blue-700'
                : 'text-gray-700',
          ]"
        >
          {{ multiplayerGame?.isMyTurn ? 'Your Turn' : "Opponent's Turn" }}
        </h3>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-2 bg-white rounded-full overflow-hidden border">
            <div
              :class="[
                'h-full transition-all duration-300',
                multiplayerGame?.timerWarning
                  ? 'bg-red-500'
                  : multiplayerGame?.isMyTurn
                    ? 'bg-blue-500'
                    : 'bg-gray-400',
              ]"
              :style="{ width: `${((multiplayerGame?.timeRemaining || 0) / 20) * 100}%` }"
            ></div>
          </div>
          <span
            :class="[
              'text-lg font-mono font-bold min-w-[3ch] text-right',
              multiplayerGame?.timerWarning ? 'text-red-600' : 'text-gray-700',
            ]"
          >
            {{ multiplayerGame?.timeRemaining || 0 }}s
          </span>
        </div>
      </div>

      <!-- Game Info -->
      <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
        <h3 class="text-sm font-bold text-gray-700 mb-2">Game Info</h3>
        <div class="space-y-1 text-xs text-gray-600">
          <p v-if="multiplayerGame">
            <span class="font-medium">Variant:</span> Bisca de {{ multiplayerGame.variant }}
          </p>
          <p v-if="multiplayerGame">
            <span class="font-medium">Type:</span> {{ multiplayerGame.type }}
          </p>
          <p v-if="multiplayerGame?.opponentName">
            <span class="font-medium">Opponent:</span> {{ multiplayerGame.opponentName }}
          </p>
        </div>
      </div>

      <h2 class="text-lg font-semibold">Deck</h2>
      <Deck :deck="multiplayerGame?.deck || []" :trump="multiplayerGame?.trump || {}" />

      <!-- Resign Button -->
      <button
        v-if="!multiplayerGame?.complete && gameStarted"
        @click="resign"
        class="mt-8 w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        Resign
      </button>
    </aside>

    <!-- Game Board -->
    <main class="w-full flex flex-col justify-center">
      <div class="flex flex-row justify-center">
        <div class="flex flex-col gap-4">
          <PlayedCard :card="multiplayerGame?.opponentPlayed" />
          <PlayedCard :card="multiplayerGame?.myPlayed" />
        </div>
      </div>
    </main>

    <aside>
      <div>
        <h3>Opponent's Spoils</h3>
        <PlayedDeck :deck="multiplayerGame?.opponentSpoils || []" />
      </div>
      <div>
        <h3>My Spoils</h3>
        <PlayedDeck :deck="multiplayerGame?.mySpoils || []" />
      </div>
    </aside>
  </div>

  <!-- My Cards -->
  <footer class="p-4 text-center flex flex-col items-center gap-3">
    <div aria-live="polite" class="mb-2">
      <h3 class="text-lg font-semibold">
        {{ turnStatus }}
      </h3>
    </div>

    <div class="flex flex-row gap-2 justify-center">
      <template v-for="card in multiplayerGame?.myHand || []">
        <GameCard
          :key="card.id"
          v-if="card"
          :card="card"
          @clicked="handleCardClick"
          :class="{
            'cursor-pointer hover:scale-105 transition-transform': multiplayerGame?.isMyTurn,
          }"
        />
      </template>
    </div>
  </footer>

  <!-- Waiting for opponent modal -->
  <div
    v-if="!gameStarted && !multiplayerGame?.complete"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <h2 class="text-2xl font-bold mb-4">Waiting for Game to Start...</h2>
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"
      ></div>
      <p class="text-gray-600 mb-4">
        {{
          multiplayerGame?.opponentName
            ? 'Waiting for cards to be dealt...'
            : 'Waiting for another player to join...'
        }}
      </p>
      <button @click="leaveGame" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
        Leave Game
      </button>
    </div>
  </div>

  <!-- Game over modal (for standalone games or match end) -->
  <div
    v-if="multiplayerGame?.complete && !multiplayerGame?.isMatch"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <h2 class="text-2xl font-bold mb-4">Game Over</h2>
      <p class="mb-4 text-lg">
        <span v-if="didIWin">You won 🎉</span>
        <span v-else-if="multiplayerGame.winner === 'draw'">It's a draw</span>
        <span v-else>Opponent won</span>
      </p>

      <!-- Points Display -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Final Score</h3>
        <div class="flex justify-around text-center">
          <div>
            <div class="text-3xl font-bold text-green-600">{{ myPoints }}</div>
            <div class="text-xs text-gray-600">Your Points</div>
          </div>
          <div class="text-2xl text-gray-400">-</div>
          <div>
            <div class="text-3xl font-bold text-red-600">{{ opponentPoints }}</div>
            <div class="text-xs text-gray-600">Opponent Points</div>
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-4">
        <button @click="leaveGame" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Leave
        </button>
      </div>
    </div>
  </div>

  <!-- Match game over modal -->
  <div
    v-if="multiplayerGame?.complete && multiplayerGame?.isMatch"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <!-- Match still ongoing -->
      <div v-if="!multiplayerGame.matchOver">
        <h2 class="text-2xl font-bold mb-4">
          Game {{ multiplayerGame.currentGameNumber }} Complete
        </h2>
        <p class="mb-4 text-lg">
          <span v-if="didIWin">You won this game 🎉</span>
          <span v-else-if="multiplayerGame.winner === 'draw'">Draw - no mark awarded</span>
          <span v-else>Opponent won this game</span>
        </p>

        <!-- Game Points -->
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 class="text-xs font-semibold text-gray-700 mb-2">This Game's Points</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ myPoints }}</div>
              <div class="text-xs text-gray-600">You</div>
            </div>
            <div class="text-xl text-gray-400">-</div>
            <div>
              <div class="text-2xl font-bold text-red-600">{{ opponentPoints }}</div>
              <div class="text-xs text-gray-600">Opponent</div>
            </div>
          </div>
        </div>

        <!-- Match score -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Match Score</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-3xl font-bold text-green-600">{{ multiplayerGame.myMarks }}</div>
              <div class="text-xs text-gray-600">Your Marks</div>
            </div>
            <div class="text-2xl text-gray-400">-</div>
            <div>
              <div class="text-3xl font-bold text-red-600">{{ multiplayerGame.opponentMarks }}</div>
              <div class="text-xs text-gray-600">Opponent Marks</div>
            </div>
          </div>
        </div>

        <button
          @click="startNextGame"
          class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors mb-2"
        >
          Start Next Game
        </button>
        <button
          @click="leaveGame"
          class="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Leave Match
        </button>
      </div>

      <!-- Match ended -->
      <div v-else>
        <h2 class="text-2xl font-bold mb-4">Match Complete!</h2>
        <p class="mb-4 text-xl font-bold">
          <span v-if="didIWinMatch" class="text-green-600">🏆 You Won the Match! 🏆</span>
          <span v-else-if="multiplayerGame.matchWinner === 'draw'" class="text-gray-600"
            >Match Tied!</span
          >
          <span v-else class="text-red-600">Opponent Won the Match</span>
        </p>

        <!-- Last Game Points -->
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 class="text-xs font-semibold text-gray-700 mb-2">Final Game Points</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ myPoints }}</div>
              <div class="text-xs text-gray-600">You</div>
            </div>
            <div class="text-xl text-gray-400">-</div>
            <div>
              <div class="text-2xl font-bold text-red-600">{{ opponentPoints }}</div>
              <div class="text-xs text-gray-600">Opponent</div>
            </div>
          </div>
        </div>

        <!-- Final match score -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Final Match Score</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-4xl font-bold text-green-600">{{ multiplayerGame.myMarks }}</div>
              <div class="text-xs text-gray-600">Your Marks</div>
            </div>
            <div class="text-2xl text-gray-400">-</div>
            <div>
              <div class="text-4xl font-bold text-red-600">{{ multiplayerGame.opponentMarks }}</div>
              <div class="text-xs text-gray-600">Opponent Marks</div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Played {{ multiplayerGame.currentGameNumber }} games
          </p>
        </div>

        <div class="flex justify-center gap-4">
          <button @click="leaveGame" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Leave
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Timeout Modal -->
  <div
    v-if="gameStore.showTimeoutModal"
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <div class="mb-4">
        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
      </div>
      <h2 class="text-2xl font-bold mb-4 text-red-600">Time's Up!</h2>
      <p class="mb-4 text-lg">
        <span v-if="gameStore.timeoutData?.timedOutPlayer === authStore.currentUserID">
          You ran out of time and forfeited the game.
        </span>
        <span v-else> Your opponent ran out of time! </span>
      </p>
      <p class="mb-6 text-sm text-gray-600">
        All remaining cards have been awarded to
        {{ gameStore.timeoutData?.winner === authStore.currentUserID ? 'you' : 'your opponent' }}.
      </p>
      <button
        @click="gameStore.closeTimeoutModal()"
        class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Continue
      </button>
    </div>
  </div>
  <!-- End of game UI wrapper -->
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from '@/stores/socket'
import GameCard from '@/components/game/GameCard.vue'
import Deck from '@/components/game/Deck.vue'
import PlayedDeck from '@/components/game/PlayedDeck.vue'
import PlayedCard from '@/components/game/PlayedCard.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const gameStore = useGameStore()
const socketStore = useSocketStore()

const multiplayerGame = computed(() => gameStore.multiplayerGame)

const didIWin = computed(() => {
  if (!multiplayerGame.value) return false
  const myId = authStore.currentUserID
  return multiplayerGame.value.winner === myId
})

const didIWinMatch = computed(() => {
  if (!multiplayerGame.value) return false
  const myId = authStore.currentUserID
  return multiplayerGame.value.matchWinner === myId
})

// Computed: Calculate points from spoils
const myPoints = computed(() => {
  if (!multiplayerGame.value?.mySpoils) return 0
  return multiplayerGame.value.mySpoils.reduce((sum, card) => {
    return sum + (gameStore.getCardPoints(card) || 0)
  }, 0)
})

const opponentPoints = computed(() => {
  if (!multiplayerGame.value?.opponentSpoils) return 0
  return multiplayerGame.value.opponentSpoils.reduce((sum, card) => {
    return sum + (gameStore.getCardPoints(card) || 0)
  }, 0)
})

// Computed: check if game has actually started (has cards or played cards visible)
const gameStarted = computed(() => {
  if (!multiplayerGame.value) return false
  // Game has started if:
  // 1. We have cards in our hand OR there are played cards on the board
  // 2. OR the game is complete (finished games count as "started")
  const hasCards = multiplayerGame.value.myHand && multiplayerGame.value.myHand.length > 0
  const hasPlayedCards = multiplayerGame.value.myPlayed || multiplayerGame.value.opponentPlayed
  const isComplete = multiplayerGame.value.complete
  return hasCards || hasPlayedCards || isComplete
})

// Computed: turn status with ID verification
const turnStatus = computed(() => {
  if (!multiplayerGame.value) return 'Waiting...'

  const myUserId = authStore.currentUserID
  const currentPlayerId = multiplayerGame.value.currentPlayerId
  const isMyTurnByFlag = multiplayerGame.value.isMyTurn
  const isMyTurnById = currentPlayerId === myUserId

  // Both should agree, but log if they don't
  if (isMyTurnByFlag !== isMyTurnById) {
    console.warn('[Multiplayer] Turn mismatch! Flag:', isMyTurnByFlag, 'ID check:', isMyTurnById)
  }

  return isMyTurnByFlag ? 'Your Turn' : "Opponent's Turn"
})

// Initialize
onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  const gameId = parseInt(route.params.id)
  console.log('[Multiplayer] Mounting page for game', gameId)

  // Join server
  socketStore.emitJoin(authStore.currentUser)
  socketStore.handleConnection()
  socketStore.handleGameEvents()

  // Request current game state
  socketStore.emitGetGameState(gameId)

  // Listen for game-over event
  const socket = socketStore.socket || window.socket
  if (socket) {
    socket.on('game-over', (data) => {
      console.log('[Multiplayer] Game over:', data)
    })

    // Listen for errors from backend
    socket.on('error', (error) => {
      console.error('[Multiplayer] Backend error:', error)
      alert(`Error: ${error.message || 'Unknown error'}`)
    })
  }
})

onUnmounted(() => {
  // Clean up listeners
  const socket = socketStore.socket
  if (socket) {
    socket.off('game-over')
    socket.off('error')
  }
})

// Methods
const handleCardClick = (card) => {
  console.log('[Multiplayer] Card clicked:', card)
  console.log('[Multiplayer] Full game state:', multiplayerGame.value)

  // Validate it's our turn using both the backend-calculated flag and user ID
  const myUserId = authStore.currentUserID
  const isMyTurnByFlag = multiplayerGame.value?.isMyTurn
  const isMyTurnById = multiplayerGame.value?.currentPlayerId === myUserId

  console.log(
    '[Multiplayer] Card click - myUserId:',
    myUserId,
    'currentPlayerId:',
    multiplayerGame.value?.currentPlayerId,
    'isMyTurnByFlag:',
    isMyTurnByFlag,
    'isMyTurnById:',
    isMyTurnById,
    'gameComplete:',
    multiplayerGame.value?.complete,
    'myPlayed:',
    multiplayerGame.value?.myPlayed,
  )

  if (!isMyTurnByFlag || !isMyTurnById || multiplayerGame.value?.complete) {
    console.log('[Multiplayer] Cannot play - not my turn or game complete')
    return
  }

  if (multiplayerGame.value.myPlayed) {
    // Already played this trick
    console.log('[Multiplayer] Already played this trick')
    return
  }

  const gameId = parseInt(route.params.id)
  console.log('[Multiplayer] Playing card:', card, 'in game', gameId)
  socketStore.emitPlayCard(gameId, card.id)
}

const resign = () => {
  if (confirm('Are you sure you want to resign? You will forfeit the game/match.')) {
    const gameId = parseInt(route.params.id)
    socketStore.emitResign(gameId)
  }
}

const startNextGame = () => {
  const gameId = parseInt(route.params.id)
  console.log('[Multiplayer] Starting next game in match', gameId)
  socketStore.emitStartNextMatchGame(gameId)
}

const leaveGame = () => {
  const gameId = parseInt(route.params.id)
  socketStore.emitLeaveGame(gameId)
  router.push('/game/lobby')
}
</script>
