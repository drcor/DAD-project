<template>
  <div class="relative w-full h-full">
    <canvas :id="chartId"></canvas>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { Chart, ArcElement, PieController, Tooltip, Legend } from 'chart.js'

// Register Chart.js components
Chart.register(ArcElement, PieController, Tooltip, Legend)

const props = defineProps({
  chartId: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
})

const chartInstance = ref(null)

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.5,
  plugins: {
    legend: {
      display: true,
      position: 'right',
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed !== null) {
            label += context.parsed
          }
          return label
        },
      },
    },
  },
}

const createChart = () => {
  const ctx = document.getElementById(props.chartId)
  if (!ctx) return

  chartInstance.value = new Chart(ctx, {
    type: 'pie',
    data: props.data,
    options: { ...defaultOptions, ...props.options },
  })
}

const updateChart = () => {
  if (chartInstance.value) {
    chartInstance.value.data = props.data
    chartInstance.value.update()
  }
}

onMounted(() => {
  createChart()
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})

watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true },
)
</script>
