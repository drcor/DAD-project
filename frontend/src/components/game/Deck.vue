<template>
    <div class="relative w-44 h-28">
        <div :key="card.id" v-for="(card, index) in deck"
            class="absolute top-0 left-0 w-22 aspect-63/88 border border-gray-700 transform translate-y-0" :style="{
                transform: `translateX(-${index * 0.5}px)`
            }">
            <img
                src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fopengameart.org%2Fsites%2Fdefault%2Ffiles%2Fcard%2520back%2520red.png&f=1&nofb=1&ipt=f62ad16085d8dd3c2fc51d130389aed55c5735b32faa1b5787ef3331a7e01aa7" />
        </div>

        <div v-if="trump && trump.rank" class="absolute left-1/2 w-20 h-28 origin-center rotate-90 -translate-x-1/2 -z-1">
            <GameCard :card="trump" />
        </div>
    </div>
</template>

<script setup>
import GameCard from './GameCard.vue';

const props = defineProps({
    deck: {
        type: Array,
        required: true,
    },
    trump: {
        type: Object,
        required: false,
        default: () => ({})
    }
})
</script>