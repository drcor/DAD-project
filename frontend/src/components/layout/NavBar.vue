<template>
  <div>
    <NavigationMenu>
      <NavigationMenuList class="justify-around gap-4">
        <!-- Play Game Link -->
        <NavigationMenuItem>
          <NavigationMenuLink>
            <RouterLink to="/game/setup" class="font-medium">🎮 Play</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <!-- Testing Menu (keep existing) -->
        <NavigationMenuItem>
          <NavigationMenuTrigger>Testing</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <RouterLink to="/testing/laravel">Laravel</RouterLink>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <RouterLink to="/testing/websockets">Web Sockets</RouterLink>
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <!-- User Logged In -->
        <template v-if="userLoggedIn">
          <!-- Coin Balance -->
          <NavigationMenuItem>
            <div
              class="flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md"
            >
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
  </div>
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

const emits = defineEmits(['logout'])
const { userLoggedIn } = defineProps(['userLoggedIn'])

const logoutClickHandler = () => {
  emits('logout')
}
</script>
