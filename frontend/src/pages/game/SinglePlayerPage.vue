<template>
  <div class="flex flex-1 select-none">
    <!-- SIDEBAR -->
    <aside class="w-66 p-4 space-y-4">
      <h2 class="text-lg font-semibold">Cards</h2>
      <Deck :deck="gameStore.deck" :trump="gameStore.trump" />
      <div>
        <h3>Bot played deck</h3>
        <PlayedDeck :deck="gameStore.spoils2" />
      </div>
      <div>
        <h3>My played deck</h3>
        <PlayedDeck :deck="gameStore.spoils1" />
      </div>
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
        <GameCard :key="card.id" v-if="card" :card="card" @clicked="handleCardClick" />
      </template>
    </div>
  </footer>

  <!-- Game over modal -->
  <div v-if="gameStore.gameOver" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50"></div>
    <div class="relative bg-white rounded-lg p-6 w-96 shadow-lg text-center">
      <h2 class="text-2xl font-bold mb-4">Game Over</h2>
      <p class="mb-4">
        <span v-if="gameStore.winner === 'player'">You won 🎉</span>
        <span v-else-if="gameStore.winner === 'bot'">Bot won</span>
        <span v-else>It's a draw</span>
      </p>
      <div class="flex justify-center gap-4">
        <button @click="restart" class="px-4 py-2 bg-green-500 text-white rounded">
          Play again
        </button>
        <button @click="closeModal" class="px-4 py-2 bg-gray-200 rounded">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import GameCard from '@/components/game/GameCard.vue'
import Deck from '@/components/game/Deck.vue'
import { onMounted } from 'vue'
import PlayedDeck from '@/components/game/PlayedDeck.vue'
import PlayedCard from '@/components/game/PlayedCard.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const handleCardClick = (card) => {
  // Prevent playing when game is over or when an end result is present.
  // closeModal currently clears `gameOver` but preserves `winner`/`endedAt`,
  // so require `winner` to be null to allow further plays.
  if (
    !gameStore.gameOver &&
    gameStore.winner == null &&
    gameStore.currentPlayer === 'player' &&
    Object.keys(gameStore.played1).length === 0
  ) {
    gameStore.playCard(card)
  }
}

const restart = () => {
  gameStore.setBoard()
  // deal using current handSize (3 or 9)
  gameStore.dealCards(gameStore.handSize)
  // ensure player starts
  gameStore.currentPlayer = 'player'
}

const closeModal = () => {
  // simply reset gameOver so modal closes; keep end state available if needed
  gameStore.gameOver = false
}

onMounted(() => {
  gameStore.setBoard()
  gameStore.dealCards(9)
})
</script>
