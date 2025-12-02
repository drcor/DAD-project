<template>
  <div class="flex flex-1">
    <!-- SIDEBAR -->
    <aside class="w-66 p-4 space-y-4">
      <h2 class="text-lg font-semibold">Cards</h2>
      <Deck :deck="deck" :trump="trumpCard" />
      <div>
        <h3>Bot played deck</h3>
        <PlayedDeck :deck="botPlayedDeck" />
      </div>
      <div>
        <h3>My played deck</h3>
        <PlayedDeck :deck="myPlayedDeck" />
      </div>
    </aside>

    <!-- Game Board -->
    <main class="w-full flex flex-col justify-center">
      <div class="flex flex-row justify-center">
        <div class="flex flex-col gap-4">
          <PlayedCard :card="table.botCard" />
          <PlayedCard :card="table.myCard" />
        </div>
      </div>
    </main>
  </div>


  <!-- My Cards -->
  <footer class="p-4 text-center flex flex-row gap-2 justify-center">
    <GameCard :key="card.id" v-for="card in hand" :card="card" @clicked="handleCardClick" />
  </footer>
</template>

<script setup>
import GameCard from '@/components/game/GameCard.vue'
import Deck from '@/components/game/Deck.vue'
import { ref, onMounted } from 'vue'
import PlayedDeck from '@/components/game/PlayedDeck.vue'
import PlayedCard from '@/components/game/PlayedCard.vue'

// Card utilities
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const suits = [
  { sym: '♠', color: 'text-black-200' },
  { sym: '♥', color: 'text-red-500' },
  { sym: '♦', color: 'text-red-500' },
  { sym: '♣', color: 'text-black-200' }
]

function makeDeck() {
  const deck = []
  let id = 1
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ id: id++, rank: r, suit: s.sym, color: s.color })
    }
  }
  return deck
}

function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
}

const trumpCard = ref({})
const deck = ref([])
const botPlayedDeck = ref([])
const myPlayedDeck = ref([])
const hand = ref([])
const table = ref({})

function resetGame() {
  deck.value = makeDeck()
  shuffleArray(deck.value)
  hand.value = []
  table.value = {
    myCard: null,
    botCard: null,
  }
}

const handleCardClick = (card) => {
  const idx = hand.value.indexOf(card)
  if (idx > -1) {
    const playedCard = hand.value.splice(idx, 1)[0]
    table.value.myCard = playedCard
  }
}


onMounted(() => {
  resetGame();

  // Delete bellow when gameplay is implemented
  hand.value = deck.value.splice(0, 9)
  trumpCard.value = deck.value.at(-1)
  botPlayedDeck.value = deck.value.splice(0, 4);
  myPlayedDeck.value = deck.value.splice(0, 4);
  table.value = {
    botCard: botPlayedDeck.value[0],
    myCard: myPlayedDeck.value[0]
  }
});
</script>