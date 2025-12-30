<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo / Home Link -->
        <router-link to="/" class="flex items-center space-x-2">
          <span class="text-2xl">🃏</span>
          <span class="text-xl font-bold text-gray-800">Bisca</span>
        </router-link>

        <!-- Navigation Links -->
        <nav class="flex items-center space-x-4">
          <!-- Play Button (always visible) -->
          <router-link
            to="/game/setup"
            class="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            🎮 Play
          </router-link>

          <!-- User is logged in -->
          <template v-if="authStore.isLoggedIn">
            <!-- Coin Balance -->
            <div
              class="flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <span class="text-sm font-semibold text-yellow-700">
                {{ authStore.currentUser?.coins_balance || 0 }} 🪙
              </span>
            </div>

            <!-- Profile Link -->
            <router-link
              to="/profile"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span
                v-if="authStore.currentUser?.photo_url"
                class="w-6 h-6 rounded-full overflow-hidden"
              >
                <img
                  :src="authStore.currentUser.photo_url"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
              </span>
              <span
                v-else
                class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold"
              >
                {{ authStore.currentUser?.nickname?.[0]?.toUpperCase() || 'U' }}
              </span>
              <span class="hidden sm:inline">{{ authStore.currentUser?.nickname }}</span>
            </router-link>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </template>

          <!-- User is NOT logged in -->
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Register
            </router-link>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>
