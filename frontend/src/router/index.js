import SinglePlayerPage from '@/pages/game/SinglePlayerPage.vue'
import GameSetupPage from '@/pages/game/GameSetupPage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import MultiPlayerPage from '@/pages/game/MultiPlayerPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import RegisterPage from '@/pages/auth/RegisterPage.vue'
import ProfilePage from '@/pages/profile/ProfilePage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import CoinStore from '@/pages/coin/CoinStore.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HistoryPage from '@/pages/transactions/HistoryPage.vue'
import GamesHistoryPage from '@/pages/games/GamesHistoryPage.vue'
import StatisticsPage from '@/pages/statistics/StatisticsPage.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      component: RegisterPage,
      meta: { guestOnly: true },
    },
    {
      path: '/profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/testing',
      children: [
        {
          path: 'laravel',
          component: LaravelPage,
        },
        {
          path: 'websockets',
          component: WebsocketsPage,
        },
      ],
    },
    {
      path: '/store',
      name: 'store',
      component: CoinStore,
      meta: { requiresAuth: true }
    },
    {
      path: '/transactions',
      name: 'TransactionHistory',
      component: HistoryPage,
      meta: { requiresAuth: true } // Garante que só utilizadores logados acedem
    },
    {
      path: '/games',
      name: 'GamesHistory',
      component: GamesHistoryPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: StatisticsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/game',
      children: [
        {
          path: 'setup',
          component: GameSetupPage
        },
        {
          path: 'singleplayer',
          component: SinglePlayerPage
        },
        {
          path: 'lobby',
          component: LobbyPage,
          meta: { requiresAuth: true }
        },
        {
          path: 'multiplayer/:id',
          component: MultiPlayerPage,
          meta: { requiresAuth: true }
        }
      ]
    }
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Try to restore session if not already logged in
  if (!authStore.isLoggedIn) {
    await authStore.restoreSession()
  }

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect to login if authentication is required
    next('/login')
  } else if (to.meta.guestOnly && authStore.isLoggedIn) {
    // Redirect to home if already logged in
    next('/')
  } else {
    next()
  }
})

export default router

