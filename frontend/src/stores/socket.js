import { defineStore } from 'pinia'
import { inject, ref } from 'vue'
import { useAuthStore } from './auth'
import { useGameStore } from './game'

export const useSocketStore = defineStore('socket', () => {
    const socket = inject('socket')
    const authStore = useAuthStore()
    const gameStore = useGameStore()
    const joined = ref(false)

    const emitJoin = (user) => {
        if (joined.value) return
        console.log(`[Socket] Joining Server`)
        socket.emit('join', user)
        joined.value = true
    }

    const emitLeave = () => {
        socket.emit('leave')
        console.log(`[Socket] Leaving Server`)
        joined.value = false
    }

    const handleConnection = () => {
        socket.on('connect', () => {
            console.log(`[Socket] Connected -- ${socket.id}`)
            if (authStore.isLoggedIn && !joined.value) {
                emitJoin(authStore.currentUser)
            }
        })

        socket.on('disconnect', () => {
            joined.value = false
            console.log(`[Socket] Disconnected -- ${socket.id}`)
        })
    }

    const emitGetGames = () => {
        socket.emit('get-games')
    }

    const emitGetGameState = (gameID) => {
        console.log(`[Socket] Requesting game state for game ${gameID}`)
        socket.emit('get-game-state', gameID)
    }

    const handleGameEvents = () => {
        socket.on('games', (games) => {
            console.log(`[Socket] server emited games | game count ${games.length}`)
            gameStore.setGames(games) // Import and instantiate the game store
        })

        socket.on('game-change', (game) => {
            gameStore.setMultiplayerGame(game)
        })

        socket.on('game-created', (data) => {
            console.log(`[Socket] Game created:`, data)
            // This event will be handled by lobby page to redirect creator
        })

        socket.on('game-started', (data) => {
            console.log(`[Socket] Game started:`, data)
            // This event will be handled by individual pages that need to redirect
        })

        socket.on('game-state', (state) => {
            console.log(`[Socket] Game state received:`, state)
            gameStore.setMultiplayerGame(state)
        })
    }

    const emitJoinGame = (game) => {
        console.log(`[Socket] Joining Game ${game.id}`)
        socket.emit('join-game', { gameId: game.id })
    }

    const emitCreateGame = (variant, type) => {
        console.log(`[Socket] Creating Game - Variant: ${variant}, Type: ${type}`)
        socket.emit('create-game', { variant, type })
    }

    const emitPlayCard = (gameID, cardId) => {
        console.log(`[Socket] Playing Card - Game: ${gameID}, Card ID:`, cardId)
        socket.emit('play-card', { gameId: gameID, cardId: cardId })
    }

    const emitResign = (gameID) => {
        console.log(`[Socket] Resigning from Game ${gameID}`)
        socket.emit('resign', { gameId: gameID })
    }

    const emitLeaveGame = (gameID) => {
        console.log(`[Socket] Leaving Game ${gameID}`)
        socket.emit('leave-game', gameID)
    }

    const emitStartNextMatchGame = (gameID) => {
        console.log(`[Socket] Starting next game in match ${gameID}`)
        socket.emit('start-next-match-game', { gameId: gameID })
    }

    const emitFlipCard = (gameID, card) => { socket.emit('flip-card', gameID, card) }

    return {
        socket, // Expose socket instance
        emitJoin,
        emitLeave,
        handleConnection,
        emitGetGames,
        emitGetGameState,
        handleGameEvents,
        emitJoinGame,
        emitCreateGame,
        emitPlayCard,
        emitResign,
        emitLeaveGame,
        emitStartNextMatchGame,
        emitFlipCard,
    }
})