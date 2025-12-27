<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Multiplayer Lobby</h1>
            <p class="text-gray-600 mt-1">
              <span v-if="authStore.isLoggedIn">Welcome, {{ authStore.currentUser?.name }}</span>
              <span v-else class="text-red-500">Please log in to play multiplayer</span>
            </p>
          </div>
          <router-link
            to="/game/setup"
            class="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back to Setup
          </router-link>
        </div>
      </div>

      <!-- Create Game Section -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Create New Game</h2>
        <div class="grid md:grid-cols-3 gap-4 mb-4">
          <!-- Variant Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Variant</label>
            <select
              v-model="newGameConfig.variant"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option :value="3">Bisca de 3</option>
              <option :value="9">Bisca de 9</option>
            </select>
          </div>

          <!-- Game Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              v-model="newGameConfig.type"
              class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="standalone">Standalone Game</option>
              <option value="match">Match (Best of 4)</option>
            </select>
          </div>

          <!-- Create Button -->
          <div class="flex items-end">
            <button
              @click="createGame"
              :disabled="!authStore.isLoggedIn || isCreating"
              class="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ isCreating ? 'Creating...' : 'Create Game' }}
            </button>
          </div>
        </div>
        <p v-if="!authStore.isLoggedIn" class="text-sm text-red-500">
          You must be logged in to create games
        </p>
      </div>

      <!-- Available Games List -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Available Games</h2>

        <!-- Not logged in state -->
        <div v-if="!authStore.isLoggedIn" class="text-center py-12 text-gray-500">
          <p class="font-semibold">Please log in to see available games</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="gameStore.availableGames.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <div class="text-5xl mb-3">🎮</div>
          <p class="font-semibold">No games available</p>
          <p class="text-sm">Create a new game to get started!</p>
        </div>

        <!-- Games Grid -->
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="game in gameStore.availableGames"
            :key="game.id"
            class="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-lg text-gray-800">{{ game.creatorName }}</h3>
                <p class="text-xs text-gray-500">Game #{{ game.id }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  game.type === 'match'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700',
                ]"
              >
                {{ game.type === 'match' ? 'Match' : 'Standalone' }}
              </span>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span class="font-medium">Variant:</span>
                <span>Bisca de {{ game.variant }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span class="font-medium">Status:</span>
                <span class="text-green-600">● Waiting for player</span>
              </div>
            </div>

            <button
              @click="joinGame(game)"
              :disabled="isJoining || game.creator === authStore.currentUserID"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{
                game.creator === authStore.currentUserID
                  ? 'Your Game'
                  : isJoining
                    ? 'Joining...'
                    : 'Join Game'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { useSocketStore } from '@/stores/socket'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()
const socketStore = useSocketStore()

// State
const newGameConfig = ref({
  variant: 9,
  type: 'standalone',
})
const isCreating = ref(false)
const isJoining = ref(false)

// Initialize socket connection
onMounted(() => {
  // Redirect if not logged in
  if (!authStore.isLoggedIn) {
    // Allow viewing but show message
    console.log('[Lobby] Not logged in - limited functionality')
  } else {
    // Join the server if logged in
    socketStore.emitJoin(authStore.currentUser)
  }

  // Set up socket event handlers
  socketStore.handleConnection()
  socketStore.handleGameEvents()

  // Listen for game-created event (when we create a game)
  socketStore.socket.on('game-created', (data) => {
    console.log('[Lobby] Game created, redirecting to waiting room:', data.id)
    router.push(`/game/multiplayer/${data.id}`)
  })

  // Listen for game-started event (when another player joins our created game)
  socketStore.socket.on('game-started', (data) => {
    console.log('[Lobby] Game started, redirecting to game:', data.gameId)
    router.push(`/game/multiplayer/${data.gameId}`)
  })

  // Request available games
  setTimeout(() => {
    socketStore.emitGetGames()
  }, 500)
})

// Cleanup on unmount
onUnmounted(() => {
  // Remove event listeners to prevent memory leaks
  socketStore.socket.off('game-created')
  socketStore.socket.off('game-started')
})

// Methods
const createGame = () => {
  if (!authStore.isLoggedIn) {
    alert('Please log in to create games')
    return
  }

  isCreating.value = true
  socketStore.emitCreateGame(newGameConfig.value.variant, newGameConfig.value.type)

  // Reset after a delay (game-created event will navigate)
  setTimeout(() => {
    isCreating.value = false
  }, 2000)
}

const joinGame = (game) => {
  if (!authStore.isLoggedIn) {
    alert('Please log in to join games')
    return
  }

  if (game.creator === authStore.currentUserID) {
    alert('You cannot join your own game')
    return
  }

  isJoining.value = true
  socketStore.emitJoinGame(game)

  // Navigate to multiplayer page
  setTimeout(() => {
    router.push(`/game/multiplayer/${game.id}`)
  }, 500)
}
</script>
