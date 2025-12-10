<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/auth'
const userStore = useUserStore()


// --- Dados do Formulário ---
const paymentType = ref('MBWAY')
const reference = ref('')
const value = ref(5) // Valor inicial (5 euros)

// --- Estado da Interface ---
const loading = ref(false)
const message = ref('')
const error = ref('')

// --- Ajuda visual para o utilizador saber o formato da referência ---
const referencePlaceholder = computed(() => {
    switch (paymentType.value) {
        case 'MBWAY': return '912345678 (9 dígitos)'
        case 'VISA': return '4000000000000000 (Começa com 4, 16 dígitos)'
        case 'IBAN': return 'PT50...'
        case 'MB': return '12345-123456789'
        case 'PAYPAL': return 'email@exemplo.com'
        default: return 'Referência'
    }
})

// --- Função de Compra ---
async function buyCoins() {
    // 1. Limpar mensagens antigas
    error.value = ''
    message.value = ''
    loading.value = true

    try {
        // 2. Enviar pedido ao teu Laravel (G2)
        const response = await axios.post('/transactions', {
            type: paymentType.value,
            reference: reference.value,
            value: value.value
        })

        // 3. Sucesso! Mostrar mensagem
        const gainedCoins = response.data.coins_added
        const newBalance = response.data.balance
        message.value = `Sucesso! Compraste ${gainedCoins} moedas.`

        // 4. ATUALIZAR O PINIA (Isto atualiza o saldo no topo do site imediatamente)
        if (userStore.currentUser) {
            userStore.currentUser.coins_balance = newBalance
        }
        
        // Limpar referência para nova compra
        reference.value = ''

    } catch (e) {
        // 5. Tratamento de Erros
        if (e.response && e.response.status === 422) {
            error.value = "Dados inválidos. Verifica a referência e o valor."
            console.log(e.response.data.errors) // Para debug
        } else if (e.response && e.response.status === 401) {
            error.value = "A tua sessão expirou. Faz login novamente."
        } else {
            error.value = "Erro ao processar pagamento. Tenta novamente."
        }
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card">
        <div class="card-header bg-primary text-white">
            <h3 class="mb-0">🏪 Loja de Moedas</h3>
        </div>
        <div class="card-body">
            <div class="alert alert-info d-flex justify-content-between align-items-center">
                <span>O teu saldo atual:</span>
                <span class="fs-4 fw-bold">💰 {{ userStore.currentUser?.coins_balance ?? 0 }}</span>
            </div>

            <form @submit.prevent="buyCoins">
                <div class="mb-3">
                    <label class="form-label">Método de Pagamento</label>
                    <select v-model="paymentType" class="form-select">
                        <option value="MBWAY">MBWAY</option>
                        <option value="VISA">VISA</option>
                        <option value="IBAN">IBAN</option>
                        <option value="MB">Multibanco</option>
                        <option value="PAYPAL">PayPal</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label">Referência / Número</label>
                    <input 
                        v-model="reference" 
                        type="text" 
                        class="form-control" 
                        :placeholder="referencePlaceholder" 
                        required
                    >
                </div>

                <div class="mb-3">
                    <label class="form-label">Valor a carregar (€)</label>
                    <div class="input-group">
                        <span class="input-group-text">€</span>
                        <input v-model="value" type="number" min="1" max="99" class="form-control">
                    </div>
                    <div class="form-text text-success">
                        Vais receber <strong>{{ value * 10 }}</strong> moedas.
                    </div>
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-success btn-lg" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ loading ? 'A processar...' : 'Comprar Moedas' }}
                    </button>
                </div>

                <div v-if="message" class="alert alert-success mt-3">{{ message }}</div>
                <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            </form>
        </div>
    </div>
</template>

<style scoped>
/* Pequeno ajuste para o cartão ficar bonito */
.card {
    max-width: 500px;
    margin: 2rem auto;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
</style>