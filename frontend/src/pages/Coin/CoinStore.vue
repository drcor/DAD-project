<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// UI Components (Based on shadcn/ui)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Icons (Remove this line if you get errors with lucide-vue-next)
import { Loader2, Coins, Wallet, CreditCard } from 'lucide-vue-next'

const userStore = useAuthStore()

// --- Data ---
const paymentType = ref('MBWAY')
const reference = ref('')
const value = ref(5)
const loading = ref(false)
const message = ref('')
const error = ref('')

const paymentMethods = [
  { value: 'MBWAY', label: 'MBWAY' },
  { value: 'VISA', label: 'Cartão Visa' },
  { value: 'IBAN', label: 'Transferência Bancária' },
  { value: 'MB', label: 'Multibanco' },
  { value: 'PAYPAL', label: 'PayPal' },
]

// --- Dynamic Placeholder ---
const referencePlaceholder = computed(() => {
    switch (paymentType.value) {
        case 'MBWAY': return '912345678'
        case 'VISA': return '4000 0000 0000 0000'
        case 'IBAN': return 'PT50...'
        case 'MB': return '12345-123456789'
        case 'PAYPAL': return 'email@example.com'
        default: return 'Reference'
    }
})

// --- Purchase Action ---
async function buyCoins() {
    error.value = ''
    message.value = ''
    loading.value = true

    try {
        const response = await axios.post('/api/transactions', {
            type: paymentType.value,
            reference: reference.value,
            value: value.value
        })

        const gainedCoins = response.data.coins_added
        const newBalance = response.data.balance
        
        message.value = `Success! You added ${gainedCoins} coins.`
        
        if (userStore.currentUser) {
            userStore.currentUser.coins_balance = newBalance
        }
        reference.value = ''
    } catch (e) {
        console.error(e)
        if (e.response?.status === 422) {
            error.value = "Invalid data. Check the reference and value."
        } else {
            error.value = "Error processing payment."
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="flex justify-center items-start min-h-[80vh] py-10 bg-slate-50">
    
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      
      <div class="p-6 border-b border-slate-100 space-y-1.5">
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">
            Official Store
          </Badge>
        </div>
        <h3 class="font-semibold tracking-tight text-2xl flex items-center gap-2">
          <Coins class="w-6 h-6 text-yellow-500" />
          Buy Coins
        </h3>
        <p class="text-sm text-slate-500">
          Top up your account to play multiplayer matches.
        </p>
      </div>

      <div class="p-6 space-y-6">
        
        <div class="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-slate-200">
          <div class="flex items-center gap-2 text-slate-600 font-medium">
            <Wallet class="w-5 h-5" />
            <span>Current Balance</span>
          </div>
          <div class="text-2xl font-bold text-slate-900">
            {{ userStore.currentUser?.coins_balance ?? 0 }} 
            <span class="text-sm font-normal text-slate-500">coins</span>
          </div>
        </div>

        <form @submit.prevent="buyCoins" class="space-y-4">
          
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                How much do you want to top up? (€)
            </label>
            <div class="flex items-center gap-4">
              <Input 
                v-model="value" 
                type="number" 
                min="1" max="99" 
                class="text-lg font-bold w-full"
              />
              <div class="text-right min-w-[100px]">
                <div class="text-xs text-slate-500 uppercase font-semibold">You Receive</div>
                <div class="text-xl font-bold text-green-600">+ {{ value * 10 }} 🪙</div>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Payment Method
            </label>
            <Select v-model="paymentType">
              <SelectTrigger>
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="method in paymentMethods" :key="method.value" :value="method.value">
                  {{ method.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Payment Details
            </label>
            <div class="relative">
              <CreditCard class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                v-model="reference" 
                type="text" 
                class="pl-9"
                :placeholder="referencePlaceholder" 
                required
              />
            </div>
            <p class="text-xs text-slate-500">
              Example: {{ referencePlaceholder }}
            </p>
          </div>

          <Button type="submit" class="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" />
            {{ loading ? 'Processing...' : 'Confirm Purchase' }}
          </Button>

        </form>
      </div>

      <div v-if="message || error" class="p-6 pt-0 flex flex-col gap-2">
        <div v-if="message" class="p-4 rounded-md bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
          ✅ {{ message }}
        </div>
        
        <div v-if="error" class="p-4 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm font-medium">
          ❌ {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>