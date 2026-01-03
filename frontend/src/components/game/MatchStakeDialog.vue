<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-gray-800">Set Match Stake</h2>
                <p class="text-sm text-gray-600 mt-1">Choose how much to wager on this match</p>
              </div>
              <button
                @click="handleCancel"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 space-y-6">
            <!-- Current Balance Display -->
            <div
              class="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Coins class="w-5 h-5 text-yellow-600" />
                  <span class="text-sm font-medium text-gray-700">Your Balance</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-2xl font-bold text-yellow-600">{{ currentBalance }}</span>
                  <Coins class="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <!-- Stake Amount Selection -->
            <div class="space-y-3">
              <label class="block text-sm font-semibold text-gray-700">
                Stake Amount (per player)
              </label>

              <!-- Range Slider -->
              <div class="px-2">
                <input
                  type="range"
                  v-model.number="stake"
                  :min="minStake"
                  :max="maxStake"
                  :step="1"
                  class="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  :class="{ 'cursor-not-allowed': currentBalance < minStake }"
                  :disabled="currentBalance < minStake"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{{ minStake }} coins</span>
                  <span>{{ maxStake }} coins</span>
                </div>
              </div>

              <!-- Stake Display -->
              <div class="flex items-center justify-center gap-2 py-4">
                <Coins class="w-8 h-8 text-indigo-600" />
                <input
                  type="number"
                  v-model.number="stake"
                  :min="minStake"
                  :max="maxStake"
                  class="text-center text-4xl font-bold text-indigo-600 w-32 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  :class="{ 'border-red-300 text-red-600': !isValidStake }"
                  :disabled="currentBalance < minStake"
                />
                <span class="text-2xl font-medium text-gray-600">coins</span>
              </div>

              <!-- Quick Selection Buttons -->
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="amount in quickAmounts"
                  :key="amount"
                  @click="stake = amount"
                  :disabled="currentBalance < amount"
                  :class="[
                    'px-4 py-2 rounded-lg font-semibold text-sm transition-all',
                    stake === amount
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    currentBalance < amount && 'opacity-50 cursor-not-allowed',
                  ]"
                >
                  {{ amount }}
                </button>
              </div>
            </div>

            <!-- Match Info -->
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <div class="flex items-start gap-2">
                <Info class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div class="text-sm text-blue-900 space-y-1">
                  <p class="font-semibold">Match Details:</p>
                  <ul class="space-y-1 ml-1">
                    <li>
                      • Each player stakes <strong>{{ stake }} coins</strong>
                    </li>
                    <li>
                      • Total pot: <strong>{{ stake * 2 }} coins</strong>
                    </li>
                    <li>
                      • Winner receives: <strong>{{ stake * 2 - 1 }} coins</strong>
                    </li>
                    <li>• Platform commission: <strong>1 coin</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Profit/Loss Display -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                <p class="text-xs font-medium text-green-700 mb-1">If You Win</p>
                <div class="flex items-center gap-1">
                  <TrendingUp class="w-4 h-4 text-green-600" />
                  <span class="text-lg font-bold text-green-600">+{{ stake - 1 }}</span>
                  <Coins class="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div class="p-3 bg-red-50 rounded-lg border border-red-200">
                <p class="text-xs font-medium text-red-700 mb-1">If You Lose</p>
                <div class="flex items-center gap-1">
                  <TrendingDown class="w-4 h-4 text-red-600" />
                  <span class="text-lg font-bold text-red-600">-{{ stake }}</span>
                  <Coins class="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>

            <!-- Warnings -->
            <div
              v-if="currentBalance < minStake"
              class="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2"
            >
              <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-red-800">
                <p class="font-semibold">Insufficient Balance</p>
                <p>
                  You need at least {{ minStake }} coins to play a match. Your current balance is
                  {{ currentBalance }} coins.
                </p>
              </div>
            </div>

            <div
              v-else-if="stake > currentBalance"
              class="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2"
            >
              <AlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-yellow-800">
                <p class="font-semibold">Stake exceeds balance</p>
                <p>You cannot stake more than your current balance ({{ currentBalance }} coins).</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
            <button
              @click="handleCancel"
              class="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              :disabled="!isValidStake"
              class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Confirm Stake
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Coins, Info, TrendingUp, TrendingDown, AlertCircle } from 'lucide-vue-next'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  initialStake: {
    type: Number,
    default: 3,
  },
})

// Emits
const emit = defineEmits(['confirm', 'cancel', 'update:isOpen'])

// Constants
const minStake = 3
const maxStake = 100
const quickAmounts = [3, 5, 10, 25, 50, 100]

// State
const stake = ref(props.initialStake)

// Computed
const isValidStake = computed(() => {
  return stake.value >= minStake && stake.value <= maxStake && stake.value <= props.currentBalance
})

// Watch for prop changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      // Reset to initial stake when dialog opens
      stake.value = Math.max(minStake, Math.min(props.initialStake, props.currentBalance))
    }
  },
)

watch(
  () => props.currentBalance,
  (newBalance) => {
    // Adjust stake if balance changed and current stake is invalid
    if (stake.value > newBalance) {
      stake.value = Math.max(minStake, Math.min(newBalance, maxStake))
    }
  },
)

// Methods
const handleConfirm = () => {
  if (isValidStake.value) {
    emit('confirm', stake.value)
    emit('update:isOpen', false)
  }
}

const handleCancel = () => {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>

<style scoped>
/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
  opacity: 0;
}

/* Custom range slider styling */
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  background: #4f46e5;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

input[type='range']::-webkit-slider-thumb:hover {
  background: #4338ca;
  transform: scale(1.1);
}

input[type='range']::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #4f46e5;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

input[type='range']::-moz-range-thumb:hover {
  background: #4338ca;
  transform: scale(1.1);
}

input[type='range']:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type='range']:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
  background: #9ca3af;
}

input[type='range']:disabled::-moz-range-thumb {
  cursor: not-allowed;
  background: #9ca3af;
}

/* Remove number input spinners */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}
</style>
