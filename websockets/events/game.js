import { getUser } from "../state/connection.js"
import {
    createGame,
    getGames,
    getGame,
    joinGame,
    dealCards,
    playCard,
    resolveTrick,
    getCardPoints,
    resignGame,
    prepareNextMatchGame,
    startMoveTimer,
    clearMoveTimer,
    cancelGame,
    getUserPendingGamesCount,
    getUserPendingGames
} from "../state/game.js"

/**
 * Get game state for a specific player
 * Hides opponent's hand
 */
const getGameStateForPlayer = (game, playerId) => {
    if (!game) return null

    return {
        id: game.id,
        variant: game.variant,
        type: game.type,
        status: game.status,
        currentPlayer: game.currentPlayer,
        isMyTurn: game.currentPlayer === playerId,
        creator: game.creator, // Add creator ID

        // Cards - hide opponent's hand
        deck: game.deck.map(c => ({ ...c })), // Just show count, not actual cards
        deckCount: game.deck.length,
        myHand: playerId === game.player1 ? game.player1Hand : game.player2Hand,
        opponentHandCount: playerId === game.player1 ? game.player2Hand.length : game.player1Hand.length,
        trump: game.trump,
        myPlayed: playerId === game.player1 ? game.player1Played : game.player2Played,
        opponentPlayed: playerId === game.player1 ? game.player2Played : game.player1Played,
        mySpoils: playerId === game.player1 ? game.player1Spoils : game.player2Spoils,
        opponentSpoils: playerId === game.player1 ? game.player2Spoils : game.player1Spoils,

        // Players
        player1: game.player1,
        player1Name: game.player1Name,
        player2: game.player2,
        player2Name: game.player2Name,
        opponentName: playerId === game.player1 ? game.player2Name : game.player1Name,

        // Game state
        winner: game.winner,
        complete: game.complete,
        moves: game.moves,

        // Match state
        isMatch: game.isMatch,
        currentGameNumber: game.currentGameNumber,
        myMarks: playerId === game.player1 ? game.player1Marks : game.player2Marks,
        opponentMarks: playerId === game.player1 ? game.player2Marks : game.player1Marks,
        matchWinner: game.matchWinner,
        matchOver: game.matchOver,

        // Timer state
        timeRemaining: game.timeRemaining,
        moveStartTime: game.moveStartTime,
    }
}

export const handleGameEvents = (io, socket) => {

    /**
     * Create a new game
     * Expects: { variant: 3|9, type: 'standalone'|'match' }
     */
    socket.on("create-game", (options) => {
        try {
            const user = getUser(socket.id)
            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            // Administrators cannot create games
            if (user.type === 'A') {
                socket.emit('error', { message: 'Administrators cannot play games' })
                return
            }

            const game = createGame(user, options)
            socket.join(`game-${game.id}`)

            console.log(`[Game] ${user.name} created game ${game.id} - Variant: ${game.variant}, Type: ${game.type}, Stake: ${game.stake || 'N/A'}`)

            // Emit to creator
            socket.emit('game-created', {
                id: game.id,
                variant: game.variant,
                type: game.type,
                stake: game.stake,
                creatorName: game.creatorName
            })

            // Broadcast updated game list to all clients
            io.emit('games', getGames())
        } catch (error) {
            console.error('[Game] Error creating game:', error)
            socket.emit('error', { message: 'Failed to create game' })
        }
    })

    /**
     * Get list of available games
     */
    socket.on("get-games", () => {
        try {
            const games = getGames()
            socket.emit("games", games)
            console.log(`[Game] Sent ${games.length} available games to ${socket.id}`)
        } catch (error) {
            console.error('[Game] Error getting games:', error)
            socket.emit('error', { message: 'Failed to get games' })
        }
    })

    /**
     * Get current state of a specific game
     * Expects: gameId (number)
     */
    socket.on("get-game-state", (gameId) => {
        try {
            const user = getUser(socket.id)
            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            const game = getGame(gameId)
            if (!game) {
                socket.emit('error', { message: 'Game not found' })
                return
            }

            // Check if user is a player in this game
            if (game.player1 !== user.id && game.player2 !== user.id) {
                socket.emit('error', { message: 'You are not a player in this game' })
                return
            }

            const state = getGameStateForPlayer(game, user.id)
            socket.emit('game-state', state)
            console.log(`[Game] Sent game state for game ${gameId} to ${user.name}`)
        } catch (error) {
            console.error('[Game] Error getting game state:', error)
            socket.emit('error', { message: 'Failed to get game state' })
        }
    })

    /**
     * Join an existing game
     * Expects: { gameId: number }
     */
    socket.on('join-game', (data) => {
        try {
            const { gameId } = data
            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            // Administrators cannot join games
            if (user.type === 'A') {
                socket.emit('error', { message: 'Administrators cannot play games' })
                return
            }

            const game = joinGame(gameId, user)

            if (!game) {
                socket.emit('error', { message: 'Game not found or already full' })
                return
            }

            socket.join(`game-${gameId}`)
            console.log(`[Game] ${user.name} joined game ${gameId}`)

            // Deal cards now that both players are present
            dealCards(gameId)

            // Start the move timer for the first player
            startMoveTimer(game, io)

            // Emit to joiner
            socket.emit('game-joined', {
                id: game.id,
                variant: game.variant,
                type: game.type
            })

            // Emit to both players that game is starting
            io.to(`game-${gameId}`).emit('game-started', {
                gameId: game.id,
                player1Name: game.player1Name,
                player2Name: game.player2Name
            })

            // Send initial game state to both players
            const socketsInRoom = io.sockets.adapter.rooms.get(`game-${gameId}`)
            if (socketsInRoom) {
                socketsInRoom.forEach(socketId => {
                    const playerSocket = io.sockets.sockets.get(socketId)
                    const playerUser = getUser(socketId)
                    if (playerSocket && playerUser) {
                        const state = getGameStateForPlayer(game, playerUser.id)
                        playerSocket.emit('game-state', state)
                    }
                })
            }

            // Update lobby - remove game from available list
            io.emit('games', getGames())

        } catch (error) {
            console.error('[Game] Error joining game:', error)
            socket.emit('error', { message: 'Failed to join game' })
        }
    })

    /**
     * Play a card
     * Expects: { gameId: number, cardId: number }
     */
    socket.on('play-card', (data) => {
        console.log('[Game] play-card event received. Data:', data)
        try {
            const { gameId, cardId } = data
            const user = getUser(socket.id)

            console.log('[Game] User:', user, 'GameId:', gameId, 'CardId:', cardId)

            if (!user) {
                console.log('[Game] User not authenticated')
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            const result = playCard(gameId, cardId, user.id)

            if (!result) {
                console.log('[Game] playCard returned null - invalid move')
                socket.emit('error', { message: 'Invalid move' })
                return
            }

            const { game, shouldResolveTrick } = result

            console.log(`[Game] ${user.name} played card ${cardId} in game ${gameId}. Should resolve trick:`, shouldResolveTrick)

            // Clear and restart timer after valid move (if not both cards played)
            if (!shouldResolveTrick && !game.complete) {
                clearMoveTimer(game)
                startMoveTimer(game, io)
            } else if (shouldResolveTrick) {
                // Stop timer while trick is being resolved
                clearMoveTimer(game)
            }

            // Emit updated state to both players
            const socketsInRoom = io.sockets.adapter.rooms.get(`game-${gameId}`)
            if (socketsInRoom) {
                socketsInRoom.forEach(socketId => {
                    const playerSocket = io.sockets.sockets.get(socketId)
                    const playerUser = getUser(socketId)
                    if (playerSocket && playerUser) {
                        const state = getGameStateForPlayer(game, playerUser.id)
                        playerSocket.emit('game-state', state)
                    }
                })
            }

            // If both players played, resolve trick after a delay
            if (shouldResolveTrick) {
                setTimeout(() => {
                    const resolvedGame = resolveTrick(gameId)

                    if (resolvedGame) {
                        console.log(`[Game] Trick resolved in game ${gameId}`)

                        // Restart timer if game continues
                        if (!resolvedGame.complete) {
                            startMoveTimer(resolvedGame, io)
                        }

                        // Emit updated state after trick resolution
                        const socketsInRoom = io.sockets.adapter.rooms.get(`game-${gameId}`)
                        if (socketsInRoom) {
                            socketsInRoom.forEach(socketId => {
                                const playerSocket = io.sockets.sockets.get(socketId)
                                const playerUser = getUser(socketId)
                                if (playerSocket && playerUser) {
                                    const state = getGameStateForPlayer(resolvedGame, playerUser.id)
                                    playerSocket.emit('game-state', state)
                                    // If game is over, send game-over event
                                    if (resolvedGame.complete) {
                                        playerSocket.emit('game-over', {
                                            winner: resolvedGame.winner,
                                            player1Points: resolvedGame.player1Spoils.reduce((sum, c) => sum + getCardPoints(c), 0),
                                            player2Points: resolvedGame.player2Spoils.reduce((sum, c) => sum + getCardPoints(c), 0),
                                            matchOver: resolvedGame.matchOver,
                                            matchWinner: resolvedGame.matchWinner
                                        })
                                    }
                                }
                            })
                        }

                        // Log if match continues - next game will be started manually by players
                        if (resolvedGame.complete && resolvedGame.isMatch && !resolvedGame.matchOver && resolvedGame.needsNextGame) {
                            console.log(`[Game] Match game ${resolvedGame.currentGameNumber} complete. Waiting for players to start next game.`)
                        }
                    }
                }, 1500) // 1.5 second delay to see the cards
            }

        } catch (error) {
            console.error('[Game] Error playing card:', error)
            socket.emit('error', { message: 'Failed to play card' })
        }
    })

    /**
     * Resign from game
     * Expects: { gameId: number }
     */
    socket.on('resign', (data) => {
        try {
            console.log('[Game] Resign event received. Data:', data)
            let { gameId } = data

            // Ensure gameId is a number
            gameId = parseInt(gameId)
            console.log('[Game] Parsed gameId:', gameId, 'Type:', typeof gameId)

            if (isNaN(gameId)) {
                console.log('[Game] Invalid gameId - not a number')
                socket.emit('error', { message: 'Invalid game ID' })
                return
            }

            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            console.log(`[Game] User ${user.name} (${user.id}) attempting to resign from game ${gameId}`)

            const game = resignGame(gameId, user.id)

            if (!game) {
                console.log(`[Game] resignGame returned null for gameId: ${gameId}`)
                socket.emit('error', { message: 'Game not found' })
                return
            }

            // Clear timer on resignation
            clearMoveTimer(game)

            console.log(`[Game] ${user.name} resigned from game ${gameId}`)

            // Emit updated game state to both players first
            const socketsInRoom = io.sockets.adapter.rooms.get(`game-${gameId}`)
            if (socketsInRoom) {
                socketsInRoom.forEach(socketId => {
                    const playerSocket = io.sockets.sockets.get(socketId)
                    const playerUser = getUser(socketId)
                    if (playerSocket && playerUser) {
                        const state = getGameStateForPlayer(game, playerUser.id)
                        playerSocket.emit('game-state', state)
                    }
                })
            }

            // Then emit game-over to both players
            io.to(`game-${gameId}`).emit('game-over', {
                winner: game.winner,
                resigned: true,
                resignedPlayer: user.id,
                matchOver: game.matchOver,
                matchWinner: game.matchWinner
            })

        } catch (error) {
            console.error('[Game] Error resigning:', error)
            socket.emit('error', { message: 'Failed to resign' })
        }
    })

    /**
     * Leave game (before it starts or after it ends)
     * Expects: { gameId: number }
     */
    socket.on('leave-game', (data) => {
        try {
            const { gameId } = data
            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            socket.leave(`game-${gameId}`)
            console.log(`[Game] ${user.name} left game ${gameId}`)

            // If game hasn't started, could remove it or allow someone else to join
            // For now, just confirm they left
            socket.emit('left-game', { gameId })

        } catch (error) {
            console.error('[Game] Error leaving game:', error)
            socket.emit('error', { message: 'Failed to leave game' })
        }
    })

    /**
     * Start next game in match
     * Expects: { gameId: number }
     */
    socket.on('start-next-match-game', (data) => {
        try {
            const { gameId } = data
            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            console.log(`[Game] ${user.name} requesting to start next game in match ${gameId}`)

            const nextGame = prepareNextMatchGame(gameId)

            if (!nextGame) {
                socket.emit('error', { message: 'Cannot start next game - match may be over or game not finished' })
                return
            }

            console.log(`[Game] Next game prepared - Game ${nextGame.currentGameNumber}`)

            // Start timer for the new game
            startMoveTimer(nextGame, io)

            // Emit new game state to both players
            const socketsInRoom = io.sockets.adapter.rooms.get(`game-${gameId}`)
            if (socketsInRoom) {
                socketsInRoom.forEach(socketId => {
                    const playerSocket = io.sockets.sockets.get(socketId)
                    const playerUser = getUser(socketId)
                    if (playerSocket && playerUser) {
                        const state = getGameStateForPlayer(nextGame, playerUser.id)
                        console.log(`[Game] Emitting next game state to player ${playerUser.id}`)
                        playerSocket.emit('game-state', state)
                    }
                })
            }

        } catch (error) {
            console.error('[Game] Error starting next match game:', error)
            socket.emit('error', { message: 'Failed to start next game' })
        }
    })

    /**
     * Cancel a pending game
     * Expects: { gameId: number }
     */
    socket.on('cancel-game', (data) => {
        try {
            const { gameId } = data
            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            const success = cancelGame(gameId, user.id)

            if (!success) {
                socket.emit('error', { message: 'Cannot cancel game - it may have already started or you are not the creator' })
                return
            }

            console.log(`[Game] ${user.name} cancelled game ${gameId}`)

            // Leave the game room
            socket.leave(`game-${gameId}`)

            // Notify the user
            socket.emit('game-cancelled', { gameId })

            // Broadcast updated game list to all clients
            io.emit('games', getGames())

        } catch (error) {
            console.error('[Game] Error cancelling game:', error)
            socket.emit('error', { message: 'Failed to cancel game' })
        }
    })

    /**
     * Get user's pending games count
     */
    socket.on('get-pending-games-count', () => {
        try {
            const user = getUser(socket.id)

            if (!user) {
                socket.emit('error', { message: 'User not authenticated' })
                return
            }

            const count = getUserPendingGamesCount(user.id)
            const games = getUserPendingGames(user.id)

            socket.emit('pending-games-count', {
                count,
                games: games.map(g => ({
                    id: g.id,
                    variant: g.variant,
                    type: g.type,
                    stake: g.stake,
                    createdAt: g.beganAt
                }))
            })

        } catch (error) {
            console.error('[Game] Error getting pending games count:', error)
            socket.emit('error', { message: 'Failed to get pending games count' })
        }
    })
}