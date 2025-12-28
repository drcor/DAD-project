import SinglePlayerPage from '@/pages/game/SinglePlayerPage.vue'
import GameSetupPage from '@/pages/game/GameSetupPage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import MultiPlayerPage from '@/pages/game/MultiPlayerPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import CoinStore from '@/pages/Coin/CoinStore.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HistoryPage from '@/pages/Transactions/HistoryPage.vue'
import GamesHistoryPage from '@/pages/Games/GamesHistoryPage.vue'
import StatisticsPage from '@/pages/Statistics/StatisticsPage.vue'
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

// Navigation guard to enforce authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.currentUser) {
    // Redirect to login page if not authenticated
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    // Allow navigation
    next()
  }
})

export default router
