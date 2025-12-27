<template>
  <div class="flex flex-1 select-none">
    <!-- SIDEBAR -->
    <aside class="w-80 p-4 space-y-3 overflow-y-auto">
      <!-- Match Progress (if playing a match) -->
      <div v-if="gameStore.isMatch" class="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
        <h3 class="text-sm font-bold text-purple-700 mb-2">Match Progress</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Game {{ gameStore.currentGameNumber }}</span>
          </div>
          <div class="space-y-3">
            <div>
              <div class="text-xs text-gray-600 mb-1">Your Marks</div>
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="`p1-${i}`"
                  :class="[
                    'w-6 h-6 rounded border-2 flex-shrink-0',
                    i <= gameStore.player1Marks
                      ? 'bg-green-500 border-green-600'
                      : 'bg-white border-gray-300',
                  ]"
                ></div>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-600 mb-1">Bot Marks</div>
              <div class="flex gap-1">
                <div
                  v-for="i in 4"
                  :key="`p2-${i}`"
                  :class="[
                    'w-6 h-6 rounded border-2 flex-shrink-0',
                    i <= gameStore.player2Marks
                      ? 'bg-red-500 border-red-600'
                      : 'bg-white border-gray-300',
                  ]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Info -->
      <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
        <h3 class="text-sm font-bold text-gray-700 mb-2">Game Info</h3>
        <div class="space-y-1 text-xs text-gray-600">
          <p><span class="font-medium">Variant:</span> Bisca de {{ gameStore.variant }}</p>
          <p>
            <span class="font-medium">Type:</span> {{ gameStore.isMatch ? 'match' : 'standalone' }}
          </p>
          <p><span class="font-medium">Opponent:</span> Bot</p>
        </div>
      </div>

      <h2 class="text-lg font-semibold">Deck</h2>
      <Deck :deck="gameStore.deck" :trump="gameStore.trump" />
    </aside>

    <!-- Game Board -->
    <main class="w-full flex flex-col justify-center">
      <div class="flex flex-row justify-center">
        <div class="flex flex-col gap-4">
          <PlayedCard :card="gameStore.played2" />
          <PlayedCard :card="gameStore.played1" />
        </div>
      </div>
    </main>

    <aside>
      <div>
        <h3>Bot played deck</h3>
        <PlayedDeck :deck="gameStore.spoils2" />
      </div>
      <div>
        <h3>My played deck</h3>
        <PlayedDeck :deck="gameStore.spoils1" />
      </div>
    </aside>
  </div>

  <!-- My Cards -->
  <footer class="p-4 text-center flex flex-col items-center gap-3">
    <div aria-live="polite" class="mb-2">
      <h3 class="text-lg font-semibold">
        {{ gameStore.currentPlayer === 'player' ? 'Your Turn' : 'Bot Turn' }}
      </h3>
    </div>

    <div class="flex flex-row gap-2 justify-center">
      <template v-for="card in gameStore.hand1">
        <GameCard
          :key="card.id"
          v-if="card"
          :card="card"
          @clicked="handleCardClick"
          :class="{
            'cursor-pointer hover:scale-105 transition-transform':
              gameStore.currentPlayer === 'player',
          }"
        />
      </template>
    </div>
  </footer>

  <!-- Game over modal (for standalone games or match end) -->
  <div
    v-if="gameStore.gameOver && !gameStore.isMatch"
    role="dialog"
    aria-modal="true"
    aria-labelledby="game-over-title"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <h2 id="game-over-title" class="text-2xl font-bold mb-4">Game Over</h2>
      <p class="mb-4 text-lg">
        <span v-if="gameStore.winner === 'player'">You won 🎉</span>
        <span v-else-if="gameStore.winner === 'bot'">Bot won</span>
        <span v-else>It's a draw</span>
      </p>
      <div class="flex justify-center gap-4">
        <button
          @click="restart"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          autofocus
        >
          Play again
        </button>
        <button @click="closeModal" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Game over modal (within a match - continue or match ended) -->
  <div
    v-if="gameStore.gameOver && gameStore.isMatch"
    role="dialog"
    aria-modal="true"
    aria-labelledby="match-game-over-title"
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <!-- Match still ongoing -->
      <div v-if="!gameStore.matchOver">
        <h2 id="match-game-over-title" class="text-2xl font-bold mb-4">
          Game {{ gameStore.currentGameNumber }} Complete
        </h2>
        <p class="mb-4 text-lg">
          <span v-if="gameStore.winner === 'player'">You won this game 🎉</span>
          <span v-else-if="gameStore.winner === 'bot'">Bot won this game</span>
          <span v-else>Draw - no mark awarded</span>
        </p>

        <!-- Match score -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Match Score</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-3xl font-bold text-green-600">{{ gameStore.player1Marks }}</div>
              <div class="text-xs text-gray-600">Your Marks</div>
            </div>
            <div class="text-2xl text-gray-400">-</div>
            <div>
              <div class="text-3xl font-bold text-red-600">{{ gameStore.player2Marks }}</div>
              <div class="text-xs text-gray-600">Bot Marks</div>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="continueMatch"
            class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            autofocus
          >
            Next Game
          </button>
          <button @click="closeModal" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Quit Match
          </button>
        </div>
      </div>

      <!-- Match ended -->
      <div v-else>
        <h2 id="match-game-over-title" class="text-2xl font-bold mb-4">Match Complete!</h2>
        <p class="mb-4 text-xl font-bold">
          <span v-if="gameStore.matchWinner === 'player'" class="text-green-600"
            >🏆 You Won the Match! 🏆</span
          >
          <span v-else-if="gameStore.matchWinner === 'bot'" class="text-red-600"
            >Bot Won the Match</span
          >
          <span v-else class="text-gray-600">Match Tied!</span>
        </p>

        <!-- Final match score -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Final Score</h3>
          <div class="flex justify-around text-center">
            <div>
              <div class="text-4xl font-bold text-green-600">{{ gameStore.player1Marks }}</div>
              <div class="text-xs text-gray-600">Your Marks</div>
            </div>
            <div class="text-2xl text-gray-400">-</div>
            <div>
              <div class="text-4xl font-bold text-red-600">{{ gameStore.player2Marks }}</div>
              <div class="text-xs text-gray-600">Bot Marks</div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Played {{ gameStore.currentGameNumber }} games</p>
        </div>

        <div class="flex justify-center gap-4">
          <button
            @click="restart"
            class="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
            autofocus
          >
            New Match
          </button>
          <button @click="closeModal" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import GameCard from '@/components/game/GameCard.vue'
import Deck from '@/components/game/Deck.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PlayedDeck from '@/components/game/PlayedDeck.vue'
import PlayedCard from '@/components/game/PlayedCard.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const router = useRouter()

// Navigation guard: redirect to setup if game not initialized
onMounted(() => {
  // Check if game is properly initialized from setup page
  if (gameStore.mode !== 'single' || gameStore.deck.length === 0) {
    // Not initialized, redirect to setup
    router.push('/game/setup')
  }
})

const handleCardClick = (card) => {
  // Prevent playing when game is over or when an end result is present.
  // closeModal currently clears `gameOver` but preserves `winner`/`endedAt`,
  // so require both `winner` and `endedAt` to be null to allow further plays.
  if (
    !gameStore.gameOver &&
    gameStore.winner == null &&
    gameStore.endedAt == null &&
    gameStore.currentPlayer === 'player' &&
    Object.keys(gameStore.played1).length === 0
  ) {
    gameStore.playCard(card)
  }
}

const restart = () => {
  if (gameStore.isMatch) {
    // Restart the entire match
    gameStore.startMatch()
    gameStore.dealCards(gameStore.handSize)
  } else {
    // Restart standalone game
    gameStore.mode = 'single'
    gameStore.startStandaloneGame()
    gameStore.dealCards(gameStore.handSize)
  }
}

const continueMatch = () => {
  // Start the next game in the match
  gameStore.startNextGame()
}

const closeModal = () => {
  // Navigate back to setup for a fresh game
  router.push('/game/setup')
}
</script>
