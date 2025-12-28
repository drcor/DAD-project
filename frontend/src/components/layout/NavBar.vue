<template>
  <NavigationMenu>
    <NavigationMenuList class="justify-around gap-4">
      <!-- Play Game Link -->
      <NavigationMenuItem>
        <NavigationMenuLink>
          <RouterLink to="/game/setup" class="font-medium">🎮 Play</RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem v-if="userLoggedIn">
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

      <NavigationMenuItem v-if="userLoggedIn">
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

      <NavigationMenuItem v-if="userLoggedIn">
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

      <NavigationMenuItem v-if="userLoggedIn">
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

      <!-- User Logged In -->
      <template v-if="userLoggedIn">
        <!-- Coin Balance -->
        <NavigationMenuItem>
          <div class="flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md">
            <span class="text-sm font-semibold text-yellow-700">
              {{ currentUser?.coins_balance || 0 }} 🪙
            </span>
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
  NavigationMenuList,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

const emits = defineEmits(['logout'])

// Apenas defineProps, sem guardar numa variável que não é usada
defineProps(['userLoggedIn'])

const logoutClickHandler = () => {
  emits('logout')
}
</script>
