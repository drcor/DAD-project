<template>
  <div class="border-b bg-white shadow-sm">
    <div class="flex h-16 items-center px-4 container mx-auto">
      
      <RouterLink to="/" class="mr-6 flex items-center space-x-2 font-bold text-xl tracking-tight text-primary">
        🎲 Casino DAD
      </RouterLink>

      <NavigationMenu class="mx-6">
        <NavigationMenuList class="flex gap-2">
          
          <NavigationMenuItem>
            <RouterLink to="/statistics" custom v-slot="{ href, navigate, isActive }">
              <a 
                :href="href" 
                @click="navigate"
                :class="[
                  'group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none',
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                ]"
              >
                🏆 Estatísticas
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
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                ]"
              >
                🎮 Jogos
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
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                ]"
              >
                💰 Moedas
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
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                ]"
              >
                📊 Transações
              </a>
            </RouterLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger class="text-slate-500">🛠️ Testing</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid gap-3 p-4 w-[200px] bg-white rounded-md shadow-md">
                <li>
                  <RouterLink to="/testing/laravel" class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                    <div class="text-sm font-medium leading-none">Laravel</div>
                    <p class="line-clamp-2 text-sm leading-snug text-slate-500">Testar API</p>
                  </RouterLink>
                </li>
                <li>
                  <RouterLink to="/testing/websockets" class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900">
                    <div class="text-sm font-medium leading-none">WebSockets</div>
                    <p class="line-clamp-2 text-sm leading-snug text-slate-500">Testar Socket.IO</p>
                  </RouterLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>

      <div class="ml-auto flex items-center space-x-4">
        <template v-if="userLoggedIn">
           <button 
            @click.prevent="logoutClickHandler" 
            class="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-md transition-colors"
          >
            Sair
          </button>
        </template>

        <template v-else>
          <RouterLink to="/login">
             <button class="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Login
             </button>
          </RouterLink>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

const emits = defineEmits(['logout'])

// Apenas defineProps, sem guardar numa variável que não é usada
defineProps(['userLoggedIn'])

const logoutClickHandler = () => {
  emits('logout')
}
</script>