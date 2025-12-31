<script setup>
import { onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
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
} from 'lucide-vue-next'

const adminStore = useAdminStore()

onMounted(() => {
  adminStore.fetchStatistics()
})

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
