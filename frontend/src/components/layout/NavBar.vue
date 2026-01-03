<template>
  <NavigationMenu>
    <NavigationMenuList class="justify-around gap-4">
      <!-- Play Game Link - Only for Players -->
      <NavigationMenuItem v-if="!isAdmin">
        <NavigationMenuLink>
          <RouterLink to="/game/setup" custom v-slot="{ href, navigate, isActive }">
            <a
              :href="href"
              @click="navigate"
              :class="[
                'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
              ]"
              >🎮 Play
            </a>
          </RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <RouterLink to="/statistics" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            🏆 Statistics
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && !isAdmin">
        <RouterLink to="/games" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            🎮 Game History
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && !isAdmin">
        <RouterLink to="/matches" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            🏅 Match History
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && !isAdmin">
        <RouterLink to="/store" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            💰 Coins
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && !isAdmin">
        <RouterLink to="/transactions" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            📊 Transactions
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <!-- Admin-specific navigation -->
      <NavigationMenuItem v-if="userLoggedIn && isAdmin">
        <RouterLink to="/admin/users" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            👥 Users
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && isAdmin">
        <RouterLink to="/games" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            🎮 Games
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && isAdmin">
        <RouterLink to="/matches" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            🏅 Matches
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && isAdmin">
        <RouterLink to="/admin/transactions" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            💳 Transactions
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn && isAdmin">
        <RouterLink to="/admin/statistics" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :class="[
              'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
              isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500',
            ]"
          >
            📊 Platform Stats
          </a>
        </RouterLink>
      </NavigationMenuItem>

      <!-- User Logged In -->
      <template v-if="userLoggedIn">
        <!-- Coin Balance - Only for Players -->
        <NavigationMenuItem v-if="!isAdmin">
          <div class="flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
            <span class="text-sm font-semibold text-yellow-700">
              {{ currentUser?.coins_balance || 0 }} 🪙
            </span>
          </div>
        </NavigationMenuItem>

        <!-- Admin Badge -->
        <NavigationMenuItem v-if="isAdmin">
          <div class="flex items-center px-3 py-1 bg-purple-50 border border-purple-200 rounded-md">
            <span class="text-sm font-semibold text-purple-700"> 👑 Admin </span>
          </div>
        </NavigationMenuItem>

        <!-- Profile Link -->
        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/profile" class="flex items-center gap-2">
              <span v-if="currentUser?.photo_url" class="w-6 h-6 rounded-full overflow-hidden">
                <img
                  :src="currentUser.photo_url"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
              </span>
              <span
                v-else
                class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold"
              >
                {{ currentUser?.nickname?.[0]?.toUpperCase() || 'U' }}
              </span>
              <span>{{ currentUser?.nickname || 'Profile' }}</span>
            </RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <!-- Logout -->
        <NavigationMenuItem>
          <NavigationMenuLink>
            <a @click.prevent="logoutClickHandler" class="cursor-pointer text-red-600 font-medium"
              >Logout</a
            >
          </NavigationMenuLink>
        </NavigationMenuItem>
      </template>

      <!-- User NOT Logged In -->
      <template v-else>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/login" class="font-medium">Login</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/register" class="font-medium text-green-600">Register</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </template>
    </NavigationMenuList>
  </NavigationMenu>
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)
const isAdmin = computed(() => authStore.currentUser?.type === 'A')

const emits = defineEmits(['logout'])

// Just defineProps, without storing in an unused variable
defineProps(['userLoggedIn'])

const logoutClickHandler = () => {
  emits('logout')
}
</script>
