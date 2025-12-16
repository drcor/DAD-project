<template>
    <div class="w-22 aspect-63/88 border border-gray-700 shadow-lg overflow-hidden bg-white grid grid-rows-3 select-none" @click="handleClick">
        <div class="flex items-start justify-start p-2 text-lg font-bold">
            {{ card.rank }}
        </div>
        <div class="flex items-center justify-center text-6xl">
            <span :class="card.color">{{ card.suit }}</span>
        </div>
        <div class="flex items-start justify-start p-2 text-lg font-bold rotate-180">
            {{ card.rank }}
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    card: {
        type: Object,
        required: true
    }
})

const emits = defineEmits(['clicked'])

const handleClick = () => {
    emits('clicked', props.card)
}
</script>