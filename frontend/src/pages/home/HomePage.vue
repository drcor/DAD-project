<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4"
  >
    <div class="max-w-4xl w-full">
      <!-- User Profile Section (if logged in) -->
      <div v-if="authStore.isLoggedIn" class="mb-6 flex justify-end">
        <div class="bg-white rounded-xl p-4 shadow-md flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm text-gray-600">Welcome back,</p>
            <p class="font-bold text-gray-800">
              {{ authStore.currentUser?.nickname || authStore.currentUser?.name }}
            </p>
            <p class="text-xs text-yellow-600 font-semibold">
              {{ authStore.currentUser?.coins_balance || 0 }} 🪙
            </p>
          </div>
          <router-link
            to="/profile"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all text-sm"
          >
            My Profile
          </router-link>
        </div>
      </div>

      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-6xl font-bold text-gray-800 mb-4">🃏 Bisca</h1>
        <p class="text-xl text-gray-600 mb-8">The classic Portuguese card game</p>

        <!-- Main CTA -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <router-link
            to="/game/setup"
            class="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🎮 Play Now
          </router-link>

          <!-- Auth Buttons (if not logged in) -->
          <div v-if="!authStore.isLoggedIn" class="flex gap-4">
            <router-link
              to="/login"
              class="px-8 py-4 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Register
            </router-link>
          </div>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-3 gap-6 mt-12">
        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="text-3xl mb-3">🤖</div>
          <h3 class="font-bold text-lg mb-2 text-gray-800">Single Player</h3>
          <p class="text-gray-600 text-sm">Practice against our smart bot anytime</p>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="text-3xl mb-3">👥</div>
          <h3 class="font-bold text-lg mb-2 text-gray-800">Multiplayer</h3>
          <p class="text-gray-600 text-sm">Challenge real players online</p>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-md">
          <div class="text-3xl mb-3">🏆</div>
          <h3 class="font-bold text-lg mb-2 text-gray-800">Matches</h3>
          <p class="text-gray-600 text-sm">Compete in best-of-4 tournaments</p>
        </div>
      </div>

      <!-- Game Variants -->
      <div class="mt-12 bg-white rounded-xl p-8 shadow-md">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Choose Your Variant</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 class="font-bold text-xl mb-2 text-green-700">Bisca de 3</h3>
            <p class="text-gray-600">
              Quick games with 3 cards per hand. Perfect for fast-paced action!
            </p>
          </div>
          <div class="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 class="font-bold text-xl mb-2 text-blue-700">Bisca de 9</h3>
            <p class="text-gray-600">
              Classic games with 9 cards per hand. Strategic and engaging!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped></style>
