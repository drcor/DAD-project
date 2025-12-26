import SinglePlayerPage from '@/pages/game/SinglePlayerPage.vue'
import GameSetupPage from '@/pages/game/GameSetupPage.vue'
import LobbyPage from '@/pages/game/LobbyPage.vue'
import MultiPlayerPage from '@/pages/game/MultiPlayerPage.vue'
import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

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
          component: LobbyPage
        },
        {
          path: 'multiplayer/:id',
          component: MultiPlayerPage
        }
      ]
    }
  ],
})

export default router
