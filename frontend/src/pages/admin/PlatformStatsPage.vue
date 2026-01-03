<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { API_ENDPOINTS } from '@/config/api'
import axios from 'axios'
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import DateRangeFilter from '@/components/DateRangeFilter.vue'
import {
  Loader2,
  TrendingUp,
  Users,
  Shield,
  Ban,
  CheckCircle,
  Gamepad2,
  Trophy,
  Coins,
  Activity,
  BarChart3,
  Target,
  DollarSign,
  AlertCircle,
} from 'lucide-vue-next'

const router = useRouter()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const timelineData = ref(null)
const loadingTimeline = ref(true)
const selectedDays = ref(30)
const engagementMetrics = ref(null)
const gamePerformanceMetrics = ref(null)
const economyMetrics = ref(null)
const transactionTypeData = ref(null)
const recentActivity = ref(null)
const authError = ref(null)

// Helper function to get and validate auth token
const getAuthToken = () => {
  const token = sessionStorage.getItem('authToken')

  if (!token) {
    authError.value = 'Authentication token not found. Please log in again.'
    console.error('Authentication token missing')
    return null
  }

  return token
}

// Helper function to handle authentication errors
const handleAuthError = (response, endpoint) => {
  if (response.status === 401) {
    authError.value = 'Your session has expired. Please log in again.'
    console.error(`Unauthorized access to ${endpoint}: Token invalid or expired`)

    // Redirect to login after a short delay
    setTimeout(() => {
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('currentUser')
      router.push('/login')
    }, 2000)

    return true
  }

  if (response.status === 403) {
    authError.value = 'You do not have permission to access this resource.'
    console.error(`Forbidden access to ${endpoint}: Insufficient permissions`)
    return true
  }

  return false
}

onMounted(async () => {
  // Validate token before fetching any data
  if (!getAuthToken()) {
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    return
  }

  // Verify user is admin
  if (!authStore.isAdmin) {
    authError.value = 'Access denied. This page is only accessible to administrators.'
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }

  adminStore.fetchStatistics()
  await fetchAllData()
})

const fetchAllData = async () => {
  await Promise.all([
    fetchTimelineData(),
    fetchEngagementMetrics(),
    fetchGamePerformanceMetrics(),
    fetchEconomyMetrics(),
    fetchTransactionTypeData(),
    fetchRecentActivity(),
  ])
}

const handleDateChange = async (filterData) => {
  selectedDays.value = filterData.days
  await fetchAllData()
}

const fetchTimelineData = async () => {
  try {
    loadingTimeline.value = true
    const token = getAuthToken()

    if (!token) {
      loadingTimeline.value = false
      return
    }

    const response = await axios.get(`${API_ENDPOINTS.ADMIN.TIMELINE}?days=${selectedDays.value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    timelineData.value = response.data
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleAuthError(error.response, 'timeline statistics')
      return
    }
    console.error('Failed to fetch timeline data:', error)
    authError.value = 'Network error while loading timeline data. Please check your connection.'
  } finally {
    loadingTimeline.value = false
  }
}

const fetchEngagementMetrics = async () => {
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await axios.get(
      `${API_ENDPOINTS.ADMIN.ENGAGEMENT}?days=${selectedDays.value}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    engagementMetrics.value = response.data
  } catch (error) {
    if (error.response && !handleAuthError(error.response, 'engagement metrics')) {
      console.error('Failed to fetch engagement metrics:', error.response?.status)
    }
  }
}

const fetchGamePerformanceMetrics = async () => {
  try {
    const token = getAuthToken()
    if (!token) return

    const response = await axios.get(
      `${API_ENDPOINTS.ADMIN.GAME_PERFORMANCE}?days=${selectedDays.value}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    gamePerformanceMetrics.value = response.data
  } catch (error) {
    if (error.response && !handleAuthError(error.response, 'game performance metrics')) {
      console.error('Failed to fetch game performance metrics:', error.response?.status)
    }
  }
}

const fetchEconomyMetrics = async () => {
  try {
    const token = sessionStorage.getItem('authToken')
    const response = await axios.get(`${API_ENDPOINTS.ADMIN.ECONOMY}?days=${selectedDays.value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    economyMetrics.value = response.data
  } catch (error) {
    console.error('Failed to fetch economy metrics:', error)
  }
}

const fetchTransactionTypeData = async () => {
  try {
    const token = sessionStorage.getItem('authToken')
    const response = await axios.get(
      `${API_ENDPOINTS.ADMIN.TRANSACTIONS_BY_TYPE}?days=${selectedDays.value}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    transactionTypeData.value = response.data
  } catch (error) {
    console.error('Failed to fetch transaction type data:', error)
  }
}

const fetchRecentActivity = async () => {
  try {
    const token = sessionStorage.getItem('authToken')
    // Fetch recent transactions, games, users
    const [transactionsRes, gamesRes, usersRes] = await Promise.all([
      axios.get(`${API_ENDPOINTS.ADMIN.TRANSACTIONS}?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_ENDPOINTS.GAMES}?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_ENDPOINTS.ADMIN.USERS}?limit=10&sort=created_at&order=desc`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    recentActivity.value = {
      transactions: transactionsRes.data,
      games: gamesRes.data,
      users: usersRes.data,
    }
  } catch (error) {
    console.error('Failed to fetch recent activity:', error)
    recentActivity.value = { transactions: [], games: [], users: [] }
  }
}
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0)
}

const formatDecimal = (num) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0)
}

const getPercentage = (part, total) => {
  if (!total) return 0
  return ((part / total) * 100).toFixed(1)
}

// Dynamic date range text for chart titles
const dateRangeText = computed(() => {
  if (selectedDays.value === 1) return 'Last 24 Hours'
  if (selectedDays.value === 7) return 'Last 7 Days'
  if (selectedDays.value === 30) return 'Last 30 Days'
  if (selectedDays.value === 90) return 'Last 90 Days'
  if (selectedDays.value === 365) return 'Last Year'
  return `Last ${selectedDays.value} Days`
})

// Chart data preparations
const userGrowthChartData = computed(() => {
  if (!timelineData.value) return null
  return {
    labels: timelineData.value.user_registrations.map((d) => d.date),
    datasets: [
      {
        label: 'New Users',
        data: timelineData.value.user_registrations.map((d) => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const activityTimelineChartData = computed(() => {
  if (!timelineData.value) return null
  return {
    labels: timelineData.value.games_played.map((d) => d.date),
    datasets: [
      {
        label: 'Games',
        data: timelineData.value.games_played.map((d) => d.count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Matches',
        data: timelineData.value.matches_played.map((d) => d.count),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const transactionVolumeChartData = computed(() => {
  if (!timelineData.value) return null
  return {
    labels: timelineData.value.transactions.map((d) => d.date),
    datasets: [
      {
        label: 'Transactions',
        data: timelineData.value.transactions.map((d) => d.count),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const coinEconomyChartData = computed(() => {
  if (!adminStore.statistics) return null
  return {
    labels: ['In Circulation', 'Total Transacted'],
    datasets: [
      {
        data: [
          adminStore.statistics.economy.total_coins_in_circulation,
          adminStore.statistics.transactions.total_coins,
        ],
        backgroundColor: ['rgba(234, 179, 8, 0.8)', 'rgba(139, 92, 246, 0.8)'],
        borderColor: ['rgb(234, 179, 8)', 'rgb(139, 92, 246)'],
        borderWidth: 2,
      },
    ],
  }
})

const transactionTypeChartData = computed(() => {
  if (!transactionTypeData.value) return null
  const types = transactionTypeData.value.transactions_by_type || []
  return {
    labels: types.map((t) => t.type_name),
    datasets: [
      {
        data: types.map((t) => t.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(251, 146, 60)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      },
    ],
  }
})

const gameTypeChartData = computed(() => {
  if (!gamePerformanceMetrics.value) return null
  const types = gamePerformanceMetrics.value.game_type_stats || []
  return {
    labels: types.map((t) => (t.type === '3' ? 'Bisca 3' : 'Bisca 9')),
    datasets: [
      {
        data: types.map((t) => t.count),
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'],
        borderColor: ['rgb(16, 185, 129)', 'rgb(245, 158, 11)'],
        borderWidth: 2,
      },
    ],
  }
})
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    <div class="w-full max-w-7xl mx-4 space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
          <BarChart3 class="w-6 h-6 text-purple-600" />
          Platform Statistics & Usage
        </h3>
        <p class="text-sm text-slate-500 mt-1">
          Overview of platform activity and user engagement.
        </p>
      </div>

      <!-- Date Range Filter -->
      <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <h4 class="font-semibold text-lg mb-4">📅 Date Range Filter</h4>
        <DateRangeFilter v-model="selectedDays" @change="handleDateChange" />
      </div>

      <!-- Loading State -->
      <div
        v-if="adminStore.loading"
        class="bg-white rounded-xl shadow-lg border border-slate-200 py-20 flex flex-col items-center justify-center text-slate-500"
      >
        <Loader2 class="w-8 h-8 animate-spin mb-2 text-purple-600" />
        <p>Loading statistics...</p>
      </div>

      <!-- Statistics Content -->
      <template v-else-if="adminStore.statistics">
        <!-- Charts Section -->
        <div v-if="!loadingTimeline && timelineData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- User Growth Chart -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users class="w-5 h-5 text-blue-600" />
              User Growth ({{ dateRangeText }})
            </h4>
            <LineChart
              v-if="userGrowthChartData"
              chart-id="user-growth-chart"
              :data="userGrowthChartData"
            />
          </div>

          <!-- Activity Timeline Chart -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Activity class="w-5 h-5 text-green-600" />
              Activity Timeline ({{ dateRangeText }})
            </h4>
            <LineChart
              v-if="activityTimelineChartData"
              chart-id="activity-timeline-chart"
              :data="activityTimelineChartData"
            />
          </div>

          <!-- Transaction Volume Chart -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Activity class="w-5 h-5 text-purple-600" />
              Transaction Volume ({{ dateRangeText }})
            </h4>
            <LineChart
              v-if="transactionVolumeChartData"
              chart-id="transaction-volume-chart"
              :data="transactionVolumeChartData"
            />
          </div>

          <!-- Coin Economy Distribution -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Coins class="w-5 h-5 text-yellow-600" />
              Coin Economy Distribution
            </h4>
            <PieChart
              v-if="coinEconomyChartData"
              chart-id="coin-economy-chart"
              :data="coinEconomyChartData"
            />
          </div>

          <!-- Transaction Types Distribution -->
          <div
            v-if="transactionTypeData"
            class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          >
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <DollarSign class="w-5 h-5 text-purple-600" />
              Transaction Types Distribution
            </h4>
            <PieChart
              v-if="transactionTypeChartData"
              chart-id="transaction-types-chart"
              :data="transactionTypeChartData"
            />
          </div>

          <!-- Game Types Popularity -->
          <div
            v-if="gamePerformanceMetrics"
            class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
          >
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Gamepad2 class="w-5 h-5 text-green-600" />
              Game Types Popularity
            </h4>
            <PieChart
              v-if="gameTypeChartData"
              chart-id="game-types-chart"
              :data="gameTypeChartData"
            />
          </div>
        </div>

        <!-- Engagement Metrics -->
        <div
          v-if="engagementMetrics"
          class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
        >
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-blue-600" />
            User Engagement Metrics
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
            >
              <div class="text-2xl font-bold text-blue-900">
                {{ engagementMetrics.dau }}
              </div>
              <div class="text-sm text-blue-700">Daily Active Users</div>
            </div>
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
            >
              <div class="text-2xl font-bold text-green-900">
                {{ engagementMetrics.wau }}
              </div>
              <div class="text-sm text-green-700">Weekly Active Users</div>
            </div>
            <div
              class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
            >
              <div class="text-2xl font-bold text-purple-900">
                {{ engagementMetrics.mau }}
              </div>
              <div class="text-sm text-purple-700">Monthly Active Users</div>
            </div>
            <div
              class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
            >
              <div class="text-2xl font-bold text-orange-900">
                {{ formatDecimal(engagementMetrics.average_games_per_user) }}
              </div>
              <div class="text-sm text-orange-700">Avg Games per User</div>
            </div>
            <div
              class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200"
            >
              <div class="text-2xl font-bold text-pink-900">
                {{ formatDecimal(engagementMetrics.average_matches_per_user) }}
              </div>
              <div class="text-sm text-pink-700">Avg Matches per User</div>
            </div>
            <div
              class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200"
            >
              <div class="text-2xl font-bold text-indigo-900">
                {{ formatDecimal(engagementMetrics.retention_rate) }}%
              </div>
              <div class="text-sm text-indigo-700">Retention Rate</div>
            </div>
          </div>
        </div>

        <!-- Game Performance Metrics -->
        <div
          v-if="gamePerformanceMetrics"
          class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
        >
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-600" />
            Game Performance Metrics
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200"
            >
              <div class="text-2xl font-bold text-yellow-900">
                {{ formatDecimal(gamePerformanceMetrics.average_game_duration) }}s
              </div>
              <div class="text-sm text-yellow-700">Avg Game Duration</div>
            </div>
            <div
              class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200"
            >
              <div class="text-2xl font-bold text-red-900">
                {{ formatDecimal(gamePerformanceMetrics.capote_frequency) }}%
              </div>
              <div class="text-sm text-red-700">Capote Frequency</div>
            </div>
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
            >
              <div class="text-2xl font-bold text-blue-900">
                {{ formatDecimal(gamePerformanceMetrics.bandeira_frequency) }}%
              </div>
              <div class="text-sm text-blue-700">Bandeira Frequency</div>
            </div>
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
            >
              <div class="text-2xl font-bold text-green-900">
                {{ gamePerformanceMetrics.total_capotes + gamePerformanceMetrics.total_bandeiras }}
              </div>
              <div class="text-sm text-green-700">Total Special Victories</div>
            </div>
          </div>
        </div>

        <!-- Economy Metrics -->
        <div
          v-if="economyMetrics"
          class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
        >
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Coins class="w-5 h-5 text-yellow-600" />
            Economy Metrics
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200"
            >
              <div class="text-2xl font-bold text-yellow-900">
                {{ formatDecimal(economyMetrics.coin_velocity) }}
              </div>
              <div class="text-sm text-yellow-700">Coin Velocity (tx/user)</div>
            </div>
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
            >
              <div class="text-2xl font-bold text-green-900">
                {{ formatNumber(economyMetrics.total_earned) }}
              </div>
              <div class="text-sm text-green-700">Total Coins Earned</div>
            </div>
            <div
              class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200"
            >
              <div class="text-2xl font-bold text-red-900">
                {{ formatNumber(economyMetrics.total_spent) }}
              </div>
              <div class="text-sm text-red-700">Total Coins Spent</div>
            </div>
            <div
              class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
            >
              <div class="text-2xl font-bold text-purple-900">
                {{ formatDecimal(economyMetrics.spending_earning_ratio) }}%
              </div>
              <div class="text-sm text-purple-700">Spending/Earning Ratio</div>
            </div>
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
            >
              <div class="text-2xl font-bold text-blue-900">
                {{ formatNumber(economyMetrics.wealth_distribution.p50) }}
              </div>
              <div class="text-sm text-blue-700">Median Balance</div>
            </div>
            <div
              class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200"
            >
              <div class="text-2xl font-bold text-indigo-900">
                {{ formatNumber(economyMetrics.wealth_distribution.max) }}
              </div>
              <div class="text-sm text-indigo-700">Highest Balance</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div
          v-if="recentActivity"
          class="bg-white rounded-xl shadow-lg border border-slate-200 p-6"
        >
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity class="w-5 h-5 text-purple-600" />
            Recent Activity
          </h4>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Registrations -->
            <div>
              <h5 class="font-medium text-sm text-gray-700 mb-2">📝 Recent Registrations</h5>
              <div class="space-y-2">
                <div
                  v-for="user in recentActivity.users.data?.slice(0, 5) || []"
                  :key="user.id"
                  class="text-sm bg-gray-50 p-2 rounded"
                >
                  <div class="font-medium">{{ user.nickname || user.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ new Date(user.created_at).toLocaleDateString() }}
                  </div>
                </div>
                <p v-if="!recentActivity.users.data?.length" class="text-sm text-gray-400">
                  No recent users
                </p>
              </div>
            </div>

            <!-- Recent Transactions -->
            <div>
              <h5 class="font-medium text-sm text-gray-700 mb-2">💰 Recent Transactions</h5>
              <div class="space-y-2">
                <div
                  v-for="tx in recentActivity.transactions.data?.slice(0, 5) || []"
                  :key="tx.id"
                  class="text-sm bg-gray-50 p-2 rounded"
                >
                  <div class="font-medium">
                    <span :class="tx.coins > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ tx.coins > 0 ? '+' : '' }}{{ tx.coins }} coins
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ tx.type?.name || 'Unknown' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ tx.user?.name || 'Unknown' }}
                  </div>
                </div>
                <p v-if="!recentActivity.transactions.data?.length" class="text-sm text-gray-400">
                  No recent transactions
                </p>
              </div>
            </div>

            <!-- Recent Games -->
            <div>
              <h5 class="font-medium text-sm text-gray-700 mb-2">🎮 Recent Games</h5>
              <div class="space-y-2">
                <div
                  v-for="game in recentActivity.games.data?.slice(0, 5) || []"
                  :key="game.id"
                  class="text-sm bg-gray-50 p-2 rounded"
                >
                  <div class="font-medium">Bisca {{ game.type }}</div>
                  <div class="text-xs text-gray-500">
                    Status:
                    {{
                      game.status === 'E'
                        ? 'Ended'
                        : game.status === 'PE'
                          ? 'Playing'
                          : 'Interrupted'
                    }}
                  </div>
                </div>
                <p v-if="!recentActivity.games.data?.length" class="text-sm text-gray-400">
                  No recent games
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Statistics -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Users class="w-5 h-5 text-blue-600" />
            User Statistics
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Total Users -->
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Users class="w-8 h-8 text-blue-600" />
                <TrendingUp class="w-4 h-4 text-blue-500" />
              </div>
              <div class="text-2xl font-bold text-blue-900">
                {{ formatNumber(adminStore.statistics.users.total) }}
              </div>
              <div class="text-sm text-blue-700">Total Users</div>
            </div>

            <!-- Players -->
            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Gamepad2 class="w-8 h-8 text-green-600" />
                <span class="text-xs font-medium text-green-700">
                  {{
                    getPercentage(
                      adminStore.statistics.users.players,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
              <div class="text-2xl font-bold text-green-900">
                {{ formatNumber(adminStore.statistics.users.players) }}
              </div>
              <div class="text-sm text-green-700">Players</div>
            </div>

            <!-- Administrators -->
            <div
              class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Shield class="w-8 h-8 text-purple-600" />
                <span class="text-xs font-medium text-purple-700">
                  {{
                    getPercentage(
                      adminStore.statistics.users.administrators,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
              <div class="text-2xl font-bold text-purple-900">
                {{ formatNumber(adminStore.statistics.users.administrators) }}
              </div>
              <div class="text-sm text-purple-700">Administrators</div>
            </div>

            <!-- Active Users -->
            <div
              class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200"
            >
              <div class="flex items-center justify-between mb-2">
                <CheckCircle class="w-8 h-8 text-emerald-600" />
                <span class="text-xs font-medium text-emerald-700">
                  {{
                    getPercentage(
                      adminStore.statistics.users.active,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
              <div class="text-2xl font-bold text-emerald-900">
                {{ formatNumber(adminStore.statistics.users.active) }}
              </div>
              <div class="text-sm text-emerald-700">Active</div>
            </div>

            <!-- Blocked Users -->
            <div
              class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Ban class="w-8 h-8 text-red-600" />
                <span class="text-xs font-medium text-red-700">
                  {{
                    getPercentage(
                      adminStore.statistics.users.blocked,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
              <div class="text-2xl font-bold text-red-900">
                {{ formatNumber(adminStore.statistics.users.blocked) }}
              </div>
              <div class="text-sm text-red-700">Blocked</div>
            </div>
          </div>
        </div>

        <!-- Game Statistics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Games -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Gamepad2 class="w-5 h-5 text-blue-600" />
              Game Statistics
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Gamepad2 class="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">Total Games</div>
                    <div class="text-xs text-slate-500">All multiplayer games</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-blue-600">
                  {{ formatNumber(adminStore.statistics.games.total) }}
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle class="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">Completed</div>
                    <div class="text-xs text-slate-500">Finished games</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-green-600">
                  {{ formatNumber(adminStore.statistics.games.completed) }}
                  <span class="text-sm text-green-500 ml-1">
                    ({{
                      getPercentage(
                        adminStore.statistics.games.completed,
                        adminStore.statistics.games.total,
                      )
                    }}%)
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Activity class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">In Progress</div>
                    <div class="text-xs text-slate-500">Active games</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-amber-600">
                  {{ formatNumber(adminStore.statistics.games.in_progress) }}
                  <span class="text-sm text-amber-500 ml-1">
                    ({{
                      getPercentage(
                        adminStore.statistics.games.in_progress,
                        adminStore.statistics.games.total,
                      )
                    }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Matches -->
          <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <Trophy class="w-5 h-5 text-yellow-600" />
              Match Statistics
            </h4>

            <div class="space-y-3">
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"
                  >
                    <Trophy class="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">Total Matches</div>
                    <div class="text-xs text-slate-500">All competitive matches</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-yellow-600">
                  {{ formatNumber(adminStore.statistics.matches.total) }}
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle class="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">Completed</div>
                    <div class="text-xs text-slate-500">Finished matches</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-green-600">
                  {{ formatNumber(adminStore.statistics.matches.completed) }}
                  <span class="text-sm text-green-500 ml-1">
                    ({{
                      getPercentage(
                        adminStore.statistics.matches.completed,
                        adminStore.statistics.matches.total,
                      )
                    }}%)
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Activity class="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">In Progress</div>
                    <div class="text-xs text-slate-500">Active matches</div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-amber-600">
                  {{ formatNumber(adminStore.statistics.matches.in_progress) }}
                  <span class="text-sm text-amber-500 ml-1">
                    ({{
                      getPercentage(
                        adminStore.statistics.matches.in_progress,
                        adminStore.statistics.matches.total,
                      )
                    }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Economy Statistics -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <Coins class="w-5 h-5 text-yellow-600" />
            Platform Economy
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Coins class="w-8 h-8 text-yellow-600" />
              </div>
              <div class="text-2xl font-bold text-yellow-900">
                {{ formatNumber(adminStore.statistics.economy.total_coins_in_circulation) }}
              </div>
              <div class="text-sm text-yellow-700">Total Coins in Circulation</div>
            </div>

            <div
              class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
            >
              <div class="flex items-center justify-between mb-2">
                <TrendingUp class="w-8 h-8 text-green-600" />
              </div>
              <div class="text-2xl font-bold text-green-900">
                {{ formatDecimal(adminStore.statistics.economy.average_balance) }}
              </div>
              <div class="text-sm text-green-700">Average Player Balance</div>
            </div>

            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Activity class="w-8 h-8 text-blue-600" />
              </div>
              <div class="text-2xl font-bold text-blue-900">
                {{ formatNumber(adminStore.statistics.transactions.total) }}
              </div>
              <div class="text-sm text-blue-700">Total Transactions</div>
            </div>

            <div
              class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
            >
              <div class="flex items-center justify-between mb-2">
                <Coins class="w-8 h-8 text-purple-600" />
              </div>
              <div class="text-2xl font-bold text-purple-900">
                {{ formatNumber(adminStore.statistics.transactions.total_coins) }}
              </div>
              <div class="text-sm text-purple-700">Total Coins Transacted</div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white"
          >
            <div class="flex items-center justify-between mb-4">
              <h5 class="font-semibold text-lg">Platform Activity</h5>
              <Activity class="w-6 h-6 opacity-80" />
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="opacity-90">Active Games:</span>
                <span class="font-bold">{{
                  formatNumber(adminStore.statistics.games.in_progress)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-90">Active Matches:</span>
                <span class="font-bold">{{
                  formatNumber(adminStore.statistics.matches.in_progress)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-90">Active Users:</span>
                <span class="font-bold">{{
                  formatNumber(adminStore.statistics.users.active)
                }}</span>
              </div>
            </div>
          </div>

          <div
            class="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white"
          >
            <div class="flex items-center justify-between mb-4">
              <h5 class="font-semibold text-lg">Completion Rate</h5>
              <CheckCircle class="w-6 h-6 opacity-80" />
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="opacity-90">Games:</span>
                <span class="font-bold">
                  {{
                    getPercentage(
                      adminStore.statistics.games.completed,
                      adminStore.statistics.games.total,
                    )
                  }}%
                </span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-90">Matches:</span>
                <span class="font-bold">
                  {{
                    getPercentage(
                      adminStore.statistics.matches.completed,
                      adminStore.statistics.matches.total,
                    )
                  }}%
                </span>
              </div>
            </div>
          </div>

          <div
            class="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white"
          >
            <div class="flex items-center justify-between mb-4">
              <h5 class="font-semibold text-lg">User Health</h5>
              <Users class="w-6 h-6 opacity-80" />
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="opacity-90">Active:</span>
                <span class="font-bold">
                  {{
                    getPercentage(
                      adminStore.statistics.users.active,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
              <div class="flex justify-between">
                <span class="opacity-90">Blocked:</span>
                <span class="font-bold">
                  {{
                    getPercentage(
                      adminStore.statistics.users.blocked,
                      adminStore.statistics.users.total,
                    )
                  }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
