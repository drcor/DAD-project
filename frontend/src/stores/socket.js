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

        socket.on('game-rejoined', (data) => {
            console.log(`[Socket] Game rejoined:`, data)
            // This event indicates successful rejoin
        })

        socket.on('game-cancelled', (data) => {
            console.log(`[Socket] Game cancelled:`, data)
            // Refresh the game list to remove the cancelled game
            socket.emit('get-games')
        })

        socket.on('game-state', (state) => {
            console.log(`[Socket] Game state received:`, state)
            gameStore.setMultiplayerGame(state)
        })

        socket.on('game-over', (data) => {
            console.log(`[Socket] Game over:`, data)
            // The game state will be updated via game-state event
            // This event can be used for additional handling if needed

            // Refresh user data to update coin balance after game transactions
            authStore.refreshUserData()
                .catch(err => console.error('[Socket] Failed to refresh user data after game over:', err))
        })

        // Timer events
        socket.on('timer-tick', (data) => {
            console.log(`[Socket] Timer tick:`, data)
            gameStore.setTimeRemaining(data.timeRemaining)
        })

        socket.on('timer-warning', (data) => {
            console.log(`[Socket] Timer warning - ${data.timeRemaining} seconds remaining`)
            gameStore.setTimerWarning(true)
        })

        socket.on('timeout', (data) => {
            console.log(`[Socket] Player timeout:`, data)
            gameStore.handleTimeout(data)
        })
    }

    const emitJoinGame = (game) => {
        console.log(`[Socket] Joining Game ${game.id}`)
        socket.emit('join-game', { gameId: game.id })
    }

    const emitCreateGame = (variant, type, stake = null) => {
        const gameConfig = { variant, type }
        if (type === 'match' && stake !== null) {
            gameConfig.stake = stake
        }
        console.log(`[Socket] Creating Game - Variant: ${variant}, Type: ${type}, Stake: ${stake || 'N/A'}`)
        socket.emit('create-game', gameConfig)
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

    const emitCancelGame = (gameID) => {
        console.log(`[Socket] Cancelling game ${gameID}`)
        socket.emit('cancel-game', { gameId: gameID })
    }

    const emitGetActiveGames = () => {
        console.log(`[Socket] Requesting active games`)
        socket.emit('get-active-games')
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
        emitCancelGame,
        emitGetActiveGames,
        emitFlipCard,
    }
})