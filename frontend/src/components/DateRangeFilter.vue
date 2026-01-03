<template>
  <div class="w-full">
    <div class="flex items-center gap-4 flex-wrap">
      <!-- Preset Periods -->
      <div class="flex gap-2">
        <button
          v-for="preset in presets"
          :key="preset.value"
          @click="selectPreset(preset.value)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedDays === preset.value
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
          ]"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Custom Date Range Toggle -->
      <button
        @click="showCustom = !showCustom"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          showCustom
            ? 'bg-purple-600 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
        ]"
      >
        📅 Custom Range
      </button>
    </div>

    <!-- Custom Date Range Picker -->
    <div v-if="showCustom" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="flex items-center gap-4 flex-wrap">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From
          </label>
          <input
            type="date"
            v-model="customStartDate"
            :max="customEndDate || today"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To
          </label>
          <input
            type="date"
            v-model="customEndDate"
            :min="customStartDate"
            :max="today"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div class="self-end">
          <button
            @click="applyCustomRange"
            :disabled="!customStartDate || !customEndDate"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Apply
          </button>
        </div>
      </div>
      <p v-if="customDaysCount > 0" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Selected: {{ customDaysCount }} days
      </p>
    </div>

    <!-- Current Selection Info -->
    <div class="mt-3 text-sm text-gray-600 dark:text-gray-400">
      <span v-if="selectedDays">
        Showing data from the last <strong>{{ selectedDays }}</strong> days
      </span>
      <span v-else-if="customStartDate && customEndDate">
        Showing data from <strong>{{ formatDate(customStartDate) }}</strong> to
        <strong>{{ formatDate(customEndDate) }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 30,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const presets = [
  { label: 'Today', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '1 Year', value: 365 },
]

const selectedDays = ref(props.modelValue)
const showCustom = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const customDaysCount = computed(() => {
  if (!customStartDate.value || !customEndDate.value) return 0
  const start = new Date(customStartDate.value)
  const end = new Date(customEndDate.value)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return diff + 1 // Include both start and end dates
})

const selectPreset = (days) => {
  selectedDays.value = days
  showCustom.value = false
  customStartDate.value = ''
  customEndDate.value = ''
  emit('update:modelValue', days)
  emit('change', { days, startDate: null, endDate: null })
}

const applyCustomRange = () => {
  if (!customStartDate.value || !customEndDate.value) return

  selectedDays.value = null
  emit('update:modelValue', customDaysCount.value)
  emit('change', {
    days: customDaysCount.value,
    startDate: customStartDate.value,
    endDate: customEndDate.value,
  })
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Initialize with prop value
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== selectedDays.value) {
      selectedDays.value = newVal
    }
  },
  { immediate: true },
)
</script>
