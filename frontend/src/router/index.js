import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import CoinStore from '@/pages/Coin/CoinStore.vue'
import { createRouter, createWebHistory } from 'vue-router'
import HistoryPage from '@/pages/Transactions/HistoryPage.vue'
import GamesHistoryPage from '@/pages/Games/GamesHistoryPage.vue'
import StatisticsPage from '@/pages/Statistics/StatisticsPage.vue'

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
      component: StatisticsPage
    },
  ],
})

export default router
