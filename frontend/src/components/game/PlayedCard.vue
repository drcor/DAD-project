<script setup lang="ts">
import GameCard from './GameCard.vue';

const props = defineProps({
    card: {
        type: Object,
        required: false
    }
})
</script>

<template>
    <GameCard v-if="card != null" :card="card" />
    <div v-else class="w-22 aspect-63/88 border border-gray-700 shadow-lg overflow-hidden bg-white grid grid-rows-3">
    </div>
</template>