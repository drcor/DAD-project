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
import MatchHistoryPage from '@/pages/matches/MatchHistoryPage.vue'
import StatisticsPage from '@/pages/statistics/StatisticsPage.vue'
import UsersPage from '@/pages/admin/UsersPage.vue'
import AdminTransactionsPage from '@/pages/admin/AdminTransactionsPage.vue'
import PlatformStatsPage from '@/pages/admin/PlatformStatsPage.vue'
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
      meta: { requiresAuth: true, requiresPlayer: true }
    },
    {
      path: '/transactions',
      name: 'TransactionHistory',
      component: HistoryPage,
      meta: { requiresAuth: true, requiresPlayer: true }
    },
    {
      path: '/games',
      name: 'GamesHistory',
      component: GamesHistoryPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/matches',
      name: 'MatchHistory',
      component: MatchHistoryPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: StatisticsPage,
      // No requiresAuth - statistics/leaderboards should be public
    },
    {
      path: '/game',
      children: [
        {
          path: 'setup',
          component: GameSetupPage,
          meta: { requiresAuth: true, requiresPlayer: true }
        },
        {
          path: 'singleplayer',
          component: SinglePlayerPage
        },
        {
          path: 'lobby',
          component: LobbyPage,
          meta: { requiresAuth: true, requiresPlayer: true }
        },
        {
          path: 'multiplayer/:id',
          component: MultiPlayerPage,
          meta: { requiresAuth: true, requiresPlayer: true }
        }
      ]
    },
    {
      path: '/admin',
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'users',
          name: 'AdminUsers',
          component: UsersPage,
        },
        {
          path: 'transactions',
          name: 'AdminTransactions',
          component: AdminTransactionsPage,
        },
        {
          path: 'statistics',
          name: 'AdminStatistics',
          component: PlatformStatsPage,
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

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // Redirect to login if authentication is required
    next('/login')
    return
  }

  // Check if route is for guests only
  if (to.meta.guestOnly && authStore.isLoggedIn) {
    // Redirect to home if already logged in
    next('/')
    return
  }

  // Check if route requires admin access
  if (to.meta.requiresAdmin) {
    if (authStore.currentUser?.type !== 'A') {
      // Redirect non-admins to home
      next('/')
      return
    }
  }

  // Check if route requires player access (not admin)
  if (to.meta.requiresPlayer) {
    if (authStore.currentUser?.type === 'A') {
      // Redirect admins to admin dashboard
      next('/admin/users')
      return
    }
  }

  next()
})

export default router

