<template>
  <div class="relative w-44 h-28">
    <div
      :key="card.id"
      v-for="(card, index) in deck"
      class="absolute top-0 left-0 w-22 aspect-63/88 border border-gray-700 transform translate-y-0"
      :style="{
        transform: `translateX(-${index * 0.5}px)`,
      }"
    >
      <img
        src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fopengameart.org%2Fsites%2Fdefault%2Ffiles%2Fcard%2520back%2520red.png&f=1&nofb=1&ipt=f62ad16085d8dd3c2fc51d130389aed55c5735b32faa1b5787ef3331a7e01aa7"
      />
    </div>
  </div>
  <p class="mt-2 text-center">{{ points }} points</p>
</template>

<script setup>
import { useGameStore } from '@/stores/game'
import { computed } from 'vue'

const props = defineProps({
  deck: {
    type: Array,
    required: true,
    validator: (arr) =>
      Array.isArray(arr) &&
      arr.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          'id' in item &&
          'rank' in item &&
          'suit' in item &&
          'color' in item,
      ),
  },
})

const gameStore = useGameStore()

const points = computed(() => props.deck.reduce((sum, c) => sum + gameStore.getCardPoints(c), 0))
</script>
