<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
      <h1 class="text-4xl font-bold text-center mb-2 text-gray-800">New Game</h1>
      <p class="text-center text-gray-600 mb-8">Configure your Bisca game</p>

      <!-- User Status Info -->
      <div
        v-if="!authStore.isLoggedIn"
        class="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded"
      >
        <div class="flex items-start">
          <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <p class="text-sm font-semibold text-yellow-800">Playing as Guest</p>
            <p class="text-xs text-yellow-700 mt-1">
              Anonymous users can only play single-player mode.
              <router-link to="/login" class="underline font-medium">Login</router-link> to unlock
              multiplayer.
            </p>
          </div>
        </div>
      </div>

      <!-- Game Mode Selection -->
      <div class="mb-8">
        <label class="block text-sm font-semibold text-gray-700 mb-3">Game Mode</label>
        <div class="grid grid-cols-2 gap-4">
          <button
            @click="selectMode('single')"
            :class="[
              'p-6 rounded-xl border-2 transition-all duration-200',
              gameConfig.mode === 'single'
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-indigo-300 bg-white',
            ]"
          >
            <div class="flex flex-col items-center">
              <svg
                class="w-12 h-12 mb-2"
                :class="gameConfig.mode === 'single' ? 'text-indigo-600' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3
                class="font-bold text-lg"
                :class="gameConfig.mode === 'single' ? 'text-indigo-700' : 'text-gray-700'"
              >
                Single Player
              </h3>
              <p class="text-xs text-gray-500 mt-1">Play against bot</p>
            </div>
          </button>

          <button
            @click="selectMode('multi')"
            :disabled="!authStore.isLoggedIn"
            :class="[
              'p-6 rounded-xl border-2 transition-all duration-200',
              gameConfig.mode === 'multi'
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : authStore.isLoggedIn
                  ? 'border-gray-200 hover:border-indigo-300 bg-white'
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50',
            ]"
          >
            <div class="flex flex-col items-center">
              <svg
                class="w-12 h-12 mb-2"
                :class="gameConfig.mode === 'multi' ? 'text-indigo-600' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3
                class="font-bold text-lg"
                :class="gameConfig.mode === 'multi' ? 'text-indigo-700' : 'text-gray-700'"
              >
                Multiplayer
              </h3>
              <p class="text-xs text-gray-500 mt-1">Play against human</p>
              <p v-if="!authStore.isLoggedIn" class="text-xs text-red-500 mt-1">Login required</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Single Player Configuration (only shown when single player is selected) -->
      <div v-if="gameConfig.mode === 'single'">
        <!-- Variant Selection (Bisca de 3 or 9) -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-gray-700 mb-3">Card Variant</label>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="gameConfig.variant = 3"
              :class="[
                'p-5 rounded-xl border-2 transition-all duration-200',
                gameConfig.variant === 3
                  ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300 bg-white',
              ]"
            >
              <div class="text-center">
                <div
                  class="text-3xl font-bold mb-1"
                  :class="gameConfig.variant === 3 ? 'text-green-700' : 'text-gray-700'"
                >
                  3
                </div>
                <p
                  class="text-sm font-medium"
                  :class="gameConfig.variant === 3 ? 'text-green-700' : 'text-gray-600'"
                >
                  Bisca de 3
                </p>
                <p class="text-xs text-gray-500 mt-1">Quick game (3 cards)</p>
              </div>
            </button>

            <button
              @click="gameConfig.variant = 9"
              :class="[
                'p-5 rounded-xl border-2 transition-all duration-200',
                gameConfig.variant === 9
                  ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300 bg-white',
              ]"
            >
              <div class="text-center">
                <div
                  class="text-3xl font-bold mb-1"
                  :class="gameConfig.variant === 9 ? 'text-green-700' : 'text-gray-700'"
                >
                  9
                </div>
                <p
                  class="text-sm font-medium"
                  :class="gameConfig.variant === 9 ? 'text-green-700' : 'text-gray-600'"
                >
                  Bisca de 9
                </p>
                <p class="text-xs text-gray-500 mt-1">Classic game (9 cards)</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Game Type Selection (Standalone vs Match) -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-gray-700 mb-3">Game Type</label>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="gameConfig.type = 'standalone'"
              :class="[
                'p-5 rounded-xl border-2 transition-all duration-200',
                gameConfig.type === 'standalone'
                  ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 bg-white',
              ]"
            >
              <div class="text-center">
                <svg
                  class="w-10 h-10 mx-auto mb-2"
                  :class="gameConfig.type === 'standalone' ? 'text-purple-600' : 'text-gray-400'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p
                  class="text-sm font-medium"
                  :class="gameConfig.type === 'standalone' ? 'text-purple-700' : 'text-gray-600'"
                >
                  Standalone Game
                </p>
                <p class="text-xs text-gray-500 mt-1">Single game</p>
              </div>
            </button>

            <button
              @click="gameConfig.type = 'match'"
              :class="[
                'p-5 rounded-xl border-2 transition-all duration-200',
                gameConfig.type === 'match'
                  ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 bg-white',
              ]"
            >
              <div class="text-center">
                <svg
                  class="w-10 h-10 mx-auto mb-2"
                  :class="gameConfig.type === 'match' ? 'text-purple-600' : 'text-gray-400'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p
                  class="text-sm font-medium"
                  :class="gameConfig.type === 'match' ? 'text-purple-700' : 'text-gray-600'"
                >
                  Match
                </p>
                <p class="text-xs text-gray-500 mt-1">Best of 4 marks</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Summary (only for single player) -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Game Summary</h3>
          <div class="text-sm text-gray-600 space-y-1">
            <p><span class="font-medium">Mode:</span> Single Player (vs Bot)</p>
            <p><span class="font-medium">Variant:</span> Bisca de {{ gameConfig.variant }}</p>
            <p>
              <span class="font-medium">Type:</span>
              {{ gameConfig.type === 'standalone' ? 'Standalone Game' : 'Match (4 marks to win)' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Multiplayer Info (only shown when multiplayer is selected) -->
      <div v-else-if="gameConfig.mode === 'multi'" class="mb-6">
        <div class="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <div class="flex items-start">
            <svg
              class="w-6 h-6 text-indigo-600 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 class="text-sm font-semibold text-indigo-900 mb-1">Ready to play online?</h3>
              <p class="text-sm text-indigo-700">
                You'll be taken to the multiplayer lobby where you can create a new game or join an
                existing one. Configure your game settings (variant and type) in the lobby.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button
          @click="$router.push('/')"
          class="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="startGame"
          class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
        >
          {{ gameConfig.mode === 'multi' ? 'Go to Lobby' : 'Start Game' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const authStore = useAuthStore()
const gameStore = useGameStore()

// Game configuration
const gameConfig = reactive({
  mode: 'single', // 'single' or 'multi'
  variant: 9, // 3 or 9 (card count)
  type: 'standalone', // 'standalone' or 'match'
})

const selectMode = (mode) => {
  // Only allow multiplayer if logged in
  if (mode === 'multi' && !authStore.isLoggedIn) {
    return
  }
  gameConfig.mode = mode
}

const startGame = () => {
  if (gameConfig.mode === 'single') {
    // Configure game store with selected options
    gameStore.mode = 'single'
    gameStore.handSize = gameConfig.variant
    gameStore.gameType = gameConfig.type

    // Initialize based on game type
    if (gameConfig.type === 'match') {
      // Start a match (best-of-4-marks)
      gameStore.startMatch()
    } else {
      // Start a standalone game
      gameStore.startStandaloneGame()
    }

    // Deal cards for the first game
    gameStore.dealCards(gameConfig.variant)

    // Navigate to single player page
    router.push('/game/singleplayer')
  } else {
    // For multiplayer, navigate to lobby where user can create/join games
    router.push('/game/lobby')
  }
}
</script>
