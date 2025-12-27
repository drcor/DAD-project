import { defineStore } from 'pinia'
import axios from 'axios'
import { ref } from 'vue'

export const useGamesStore = defineStore('games', () => {
    const games = ref([])
    const loading = ref(false)
    const error = ref(null)

    async function fetchMyGames() {
        loading.value = true
        error.value = null
        try {
            // GET /api/games (O Laravel normalmente filtra os jogos do user logado ou retorna todos)
            // Se retornar todos, teremos de filtrar no front, mas vamos assumir que a API filtra.
            const response = await axios.get('/api/games')
            
            // Ajusta aqui se os dados vierem noutro formato (ex: response.data)
            games.value = response.data.data 
        } catch (e) {
            console.error("Erro jogos:", e)
            error.value = 'Não foi possível carregar o histórico de jogos.'
        } finally {
            loading.value = false
        }
    }

    return { games, loading, error, fetchMyGames }
})