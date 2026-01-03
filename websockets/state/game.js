import { apiClient } from '../api/client.js'

const games = new Map()
let currentGameID = 0

// Point values for scoring
const cardPoints = {
    'A': 11,  // Ace
    '7': 10,  // Seven (Bisca/Manilha)
    'K': 4,   // King
    'J': 3,   // Jack
    'Q': 2,   // Queen
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0
}

// Rank values for comparison (higher = stronger)
const cardRanks = {
    'A': 8,   // Ace is highest
    '7': 7,   // Seven is second highest
    'K': 6,   // King
    'J': 5,   // Jack
    'Q': 4,   // Queen
    '6': 3,
    '5': 2,
    '4': 1,
    '3': 0,
    '2': -1
}

const suits = [
    { sym: '♠', color: 'text-black-200' },
    { sym: '♥', color: 'text-red-500' },
    { sym: '♦', color: 'text-red-500' },
    { sym: '♣', color: 'text-black-200' }
]

export const shuffleCards = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
}

const generateCards = () => {
    const cards = []

    let idCounter = 0

    // Create cards
    suits.forEach(s => {
        Object.keys(cardPoints).forEach(r => {
            cards.push({
                id: idCounter++,
                rank: r,
                suit: s.sym,
                color: s.color
            })
        })
    })

    // Shuffle cards
    shuffleCards(cards)

    return cards
}

export const createGame = (user, options = {}) => {
    // Limit: Check how many "waiting" games this player already has
    const MAX_PENDING_GAMES = 3; // Maximum pending games per player
    const userPendingGames = Array.from(games.values()).filter(
        g => g.status === 'waiting' && g.creator === user.id
    );

    if (userPendingGames.length >= MAX_PENDING_GAMES) {
        throw new Error(`You already have ${MAX_PENDING_GAMES} pending games. Please join or cancel existing games first.`);
    }

    currentGameID++

    const variant = options.variant || 9 // 3 or 9 cards
    const type = options.type || 'standalone' // 'standalone' or 'match'
    const stake = options.stake || null // Match stake (3-100 coins), null for standalone

    const game = {
        id: currentGameID,
        creator: user.id,
        creatorName: user.name,
        player1: user.id,
        player1Name: user.name,
        player2: null,
        player2Name: null,
        winner: null,
        currentPlayer: user.id,
        status: 'waiting', // 'waiting', 'in-progress', 'Ended'
        variant: variant,
        type: type,
        stake: stake, // Match stake amount
        // Cards
        deck: generateCards(),
        player1Hand: [],
        player2Hand: [],
        trump: null,
        player1Played: null,
        player2Played: null,
        firstPlayerOfTrick: null, // Track who played first in current trick
        player1Spoils: [],
        player2Spoils: [],
        // Match state
        isMatch: type === 'match',
        currentGameNumber: 1,
        player1Marks: 0,
        player2Marks: 0,
        matchWinner: null,
        matchOver: false,
        // Timer state
        moveTimer: null,          // setTimeout reference for timeout
        moveTimerInterval: null,  // setInterval reference for countdown
        moveStartTime: null,
        timeRemaining: 20, // seconds
        // Stats
        started: false,
        complete: false,
        moves: 0,
        beganAt: null,
        endedAt: null
    }

    games.set(currentGameID, game)
    return game
}

export const dealCards = (gameID) => {
    const game = games.get(gameID)

    if (!game) return null
    if (game.started) return game // Already dealt

    const variant = game.variant || 9

    // Deal hands
    game.player1Hand = game.deck.splice(0, variant)
    game.player2Hand = game.deck.splice(0, variant)

    // Set trump (last card)
    game.trump = game.deck.pop()

    game.started = true
    game.status = 'in-progress'
    game.beganAt = new Date()

    // Process coin transactions when game starts
    // Note: We handle match creation and stake deduction asynchronously
    if (game.isMatch) {
        // For matches, create match in DB first and deduct stake only on the first game
        if (game.currentGameNumber === 1) {
            // Use an async IIFE to handle the async operations without blocking
            (async () => {
                try {
                    // Create match in database to get proper DB match ID
                    const matchData = await apiClient.saveMatch(game)
                    if (matchData && matchData.id) {
                        game.dbMatchId = matchData.id
                        console.log(`[dealCards] Match created in DB - ID: ${matchData.id}`)

                        // Now deduct stakes using the correct DB match ID
                        const stake = game.stake || 3
                        await apiClient.deductMatchStake(matchData.id, game.player1, game.player2, stake)
                        console.log(`[dealCards] Match stakes deducted successfully for match ${matchData.id}`)
                    }
                } catch (err) {
                    console.error(`[dealCards] Failed to create match or deduct stakes for game ${gameID}:`, err.message)
                }
            })()
        }
        // Note: No game entry fee for match games - only the match stake
    } else {
        // For standalone games, deduct the 2-coin entry fee
        apiClient.deductGameFee(gameID, game.player1, game.player2)
            .catch(err => console.error(`[dealCards] Failed to deduct game fees for game ${gameID}:`, err.message))
    }

    return game
}

export const getGames = () => {
    return Array.from(games.values()).filter(g => g.status === 'waiting')
}

export const getGame = (gameID) => {
    return games.get(gameID)
}

export const joinGame = (gameID, user) => {
    const game = games.get(gameID)
    if (!game || game.player2) return null

    game.player2 = user.id
    game.player2Name = user.name

    return game
}

export const playCard = (gameID, cardId, playerId) => {
    console.log(`[playCard] Called with gameID: ${gameID}, cardId: ${cardId}, playerId: ${playerId}`)

    const game = games.get(gameID)
    if (!game) {
        console.log(`[playCard] Game ${gameID} not found`)
        return null
    }

    // Determine which player is playing
    const isPlayer1 = game.player1 === playerId
    const isPlayer2 = game.player2 === playerId

    console.log(`[playCard] Player check - isPlayer1: ${isPlayer1}, isPlayer2: ${isPlayer2}`)
    console.log(`[playCard] Game players - player1: ${game.player1}, player2: ${game.player2}`)

    if (!isPlayer1 && !isPlayer2) {
        console.log(`[playCard] Player ${playerId} not in game`)
        return null
    }

    // Validate it's their turn
    console.log(`[playCard] Current player: ${game.currentPlayer}, Requesting player: ${playerId}`)
    if (game.currentPlayer !== playerId) {
        console.log(`[playCard] Not player's turn`)
        return null
    }

    // Find and remove card from hand
    const hand = isPlayer1 ? game.player1Hand : game.player2Hand
    console.log(`[playCard] Hand:`, hand.map(c => ({ id: c.id, rank: c.rank, suit: c.suit })))
    const cardIndex = hand.findIndex(c => c.id === cardId)

    if (cardIndex === -1) {
        console.log(`[playCard] Card ${cardId} not found in hand`)
        return null
    }

    const card = hand.splice(cardIndex, 1)[0]
    console.log(`[playCard] Playing card:`, { id: card.id, rank: card.rank, suit: card.suit })

    // Place card in played position
    if (isPlayer1) {
        game.player1Played = card
        // Track if this is the first card of the trick
        if (!game.player2Played) {
            game.firstPlayerOfTrick = game.player1
        }
    } else {
        game.player2Played = card
        // Track if this is the first card of the trick
        if (!game.player1Played) {
            game.firstPlayerOfTrick = game.player2
        }
    }

    // If both players have played, resolve trick
    if (game.player1Played && game.player2Played) {
        console.log(`[playCard] Both players played - will resolve trick`)
        return { game, shouldResolveTrick: true }
    } else {
        // Switch turn to other player
        game.currentPlayer = isPlayer1 ? game.player2 : game.player1
        console.log(`[playCard] Turn switched to player ${game.currentPlayer}`)
        return { game, shouldResolveTrick: false }
    }
}

export const getCardPoints = (card) => {
    return cardPoints[card.rank] || 0
}

const getCardRank = (card) => {
    return cardRanks[card.rank] || 0
}

const cardBeats = (cardA, cardB, trump) => {
    if (!cardA || !cardB) return false

    // Same suit: higher rank wins (not points!)
    if (cardA.suit === cardB.suit) {
        return getCardRank(cardA) > getCardRank(cardB)
    }

    // If A is trump and B is not, A wins
    if (trump && cardA.suit === trump.suit && cardB.suit !== trump.suit) {
        return true
    }

    // If B is trump and A is not, B wins (A loses)
    if (trump && cardB.suit === trump.suit && cardA.suit !== trump.suit) {
        return false
    }

    // Different suits, neither is trump: first card (cardA) wins
    return true
}

export const resolveTrick = (gameID) => {
    const game = games.get(gameID)
    if (!game) return null

    const card1 = game.player1Played
    const card2 = game.player2Played

    if (!card1 || !card2) return null

    // Determine which card was played first
    const player1PlayedFirst = game.firstPlayerOfTrick === game.player1
    const firstCard = player1PlayedFirst ? card1 : card2
    const secondCard = player1PlayedFirst ? card2 : card1

    console.log(`[resolveTrick] First player: ${game.firstPlayerOfTrick === game.player1 ? 'Player1' : 'Player2'}`)
    console.log(`[resolveTrick] First card: ${firstCard.rank}${firstCard.suit}`)
    console.log(`[resolveTrick] Second card: ${secondCard.rank}${secondCard.suit}`)
    console.log(`[resolveTrick] Trump: ${game.trump ? game.trump.rank + game.trump.suit : 'none'}`)

    // Determine winner using first card as reference
    const firstCardWins = cardBeats(firstCard, secondCard, game.trump)
    const player1Wins = player1PlayedFirst ? firstCardWins : !firstCardWins

    console.log(`[resolveTrick] First card wins: ${firstCardWins}, Player1 wins: ${player1Wins}`)

    game.moves++

    // Award spoils to winner
    if (player1Wins) {
        game.player1Spoils.push(card1, card2)
        game.currentPlayer = game.player1 // Winner starts next trick
        console.log(`[resolveTrick] Player1 wins trick`)
    } else {
        game.player2Spoils.push(card1, card2)
        game.currentPlayer = game.player2
        console.log(`[resolveTrick] Player2 wins trick`)
    }

    // Clear played cards and first player tracker
    game.player1Played = null
    game.player2Played = null
    game.firstPlayerOfTrick = null

    // Deal new cards if deck is not empty
    if (game.deck.length > 0) {
        if (game.deck.length === 1) {
            // Last card - one player gets deck card, other gets trump
            if (player1Wins) {
                game.player1Hand.push(game.deck.shift())
                game.player2Hand.push(game.trump)
            } else {
                game.player2Hand.push(game.deck.shift())
                game.player1Hand.push(game.trump)
            }
            game.trump = null
        } else {
            // Normal deal
            if (player1Wins) {
                game.player1Hand.push(game.deck.shift())
                game.player2Hand.push(game.deck.shift())
            } else {
                game.player2Hand.push(game.deck.shift())
                game.player1Hand.push(game.deck.shift())
            }
        }
    }

    // Check for game end
    checkForGameEnd(game)

    return game
}

const computePoints = (spoils) => {
    return spoils.reduce((sum, card) => sum + getCardPoints(card), 0)
}

const startNextGameInMatch = (game) => {
    console.log(`[startNextGameInMatch] Starting next game. Current game number: ${game.currentGameNumber}`)

    // Store previous winner to determine who starts next game
    const previousWinner = game.winner
    console.log(`[startNextGameInMatch] Previous winner: ${previousWinner}`)

    // Reset game state for next game in the match
    game.currentGameNumber++
    game.winner = null
    game.complete = false

    // Generate and shuffle new deck
    game.deck = generateCards()
    console.log(`[startNextGameInMatch] Generated new deck with ${game.deck.length} cards`)

    // Clear hands, played cards, and spoils
    game.player1Hand = []
    game.player2Hand = []
    game.player1Played = null
    game.player2Played = null
    game.firstPlayerOfTrick = null
    game.player1Spoils = []
    game.player2Spoils = []
    game.trump = null

    // Deal cards for the new game
    const cardsPerPlayer = game.variant
    console.log(`[startNextGameInMatch] Dealing ${cardsPerPlayer} cards to each player`)
    for (let i = 0; i < cardsPerPlayer; i++) {
        game.player1Hand.push(game.deck.shift())
        game.player2Hand.push(game.deck.shift())
    }

    // Set trump card
    if (game.deck.length > 0) {
        game.trump = game.deck[game.deck.length - 1]
        console.log(`[startNextGameInMatch] Trump card set: ${game.trump.rank}${game.trump.suit}`)
    }

    // Winner of previous game starts (or player1 if draw)
    game.currentPlayer = previousWinner !== 'draw' ? previousWinner : game.player1
    console.log(`[startNextGameInMatch] Current player set to: ${game.currentPlayer}`)

    console.log(`[startNextGameInMatch] Started game ${game.currentGameNumber} in match ${game.id}`)
    console.log(`[startNextGameInMatch] Player1 hand: ${game.player1Hand.length} cards, Player2 hand: ${game.player2Hand.length} cards`)
}

const checkForGameEnd = (game) => {
    // Game ends when both hands are empty and deck is empty
    if (game.player1Hand.length === 0 && game.player2Hand.length === 0 && game.deck.length === 0) {
        console.log(`[checkForGameEnd] Game ${game.id} ended - calculating winner`)
        const p1Points = computePoints(game.player1Spoils)
        const p2Points = computePoints(game.player2Spoils)
        console.log(`[checkForGameEnd] Points - Player1: ${p1Points}, Player2: ${p2Points}`)

        if (p1Points > p2Points) {
            game.winner = game.player1
        } else if (p2Points > p1Points) {
            game.winner = game.player2
        } else {
            game.winner = 'draw'
        }
        console.log(`[checkForGameEnd] Winner: ${game.winner}`)

        // Handle match logic
        if (game.isMatch) {
            console.log(`[checkForGameEnd] This is a match - game ${game.currentGameNumber}`)

            // Calculate marks based on points according to Bisca rules:
            // 61-90 points = 1 mark (risca/moca)
            // 91-119 points = 2 marks (capote)
            // 120 points = 4 marks (bandeira - clean match win)
            // Draw = 0 marks to each player

            if (game.winner !== 'draw') {
                const winnerPoints = game.winner === game.player1 ? p1Points : p2Points
                let marksAwarded = 0

                if (winnerPoints === 120) {
                    marksAwarded = 4  // Bandeira - clean sweep
                    console.log(`[checkForGameEnd] Bandeira! Winner got all 120 points`)
                } else if (winnerPoints >= 91) {
                    marksAwarded = 2  // Capote
                    console.log(`[checkForGameEnd] Capote! Winner got ${winnerPoints} points`)
                } else if (winnerPoints >= 61) {
                    marksAwarded = 1  // Risca/Moca
                    console.log(`[checkForGameEnd] Winner got ${winnerPoints} points`)
                }

                if (game.winner === game.player1) {
                    game.player1Marks += marksAwarded
                    console.log(`[checkForGameEnd] Player1 awarded ${marksAwarded} mark(s) - total marks: ${game.player1Marks}`)
                } else {
                    game.player2Marks += marksAwarded
                    console.log(`[checkForGameEnd] Player2 awarded ${marksAwarded} mark(s) - total marks: ${game.player2Marks}`)
                }
            } else {
                console.log(`[checkForGameEnd] Draw - no marks awarded`)
            }

            // Mark this game as complete
            game.complete = true

            // Check if match is over (first player to reach 4 marks wins)
            if (game.player1Marks >= 4 || game.player2Marks >= 4) {
                console.log(`[checkForGameEnd] Match complete - a player reached 4 marks`)
                if (game.player1Marks > game.player2Marks) {
                    game.matchWinner = game.player1
                } else if (game.player2Marks > game.player1Marks) {
                    game.matchWinner = game.player2
                } else {
                    game.matchWinner = 'draw'
                }
                game.matchOver = true
                game.status = 'Ended'
                console.log(`[checkForGameEnd] Match winner: ${game.matchWinner}`)
            } else {
                console.log(`[checkForGameEnd] Match continues - setting needsNextGame flag`)
                // Match continues - prepare next game after a delay
                // We'll start the next game when the frontend is ready
                // (this gives time to show the game result modal)
                game.needsNextGame = true
            }
        } else {
            console.log(`[checkForGameEnd] Standalone game - marking as complete`)
            game.complete = true
            game.status = 'Ended'
        }

        game.endedAt = new Date()
        console.log(`[checkForGameEnd] Game end processing complete - complete: ${game.complete}, needsNextGame: ${game.needsNextGame}`)

        // Persist game to database (async, non-blocking)
        persistGameToDatabase(game)
    }
}

export const prepareNextMatchGame = (gameID) => {
    console.log(`[prepareNextMatchGame] Called for game ${gameID}`)
    const game = games.get(gameID)
    if (!game) {
        console.log(`[prepareNextMatchGame] Game ${gameID} not found`)
        return null
    }

    console.log(`[prepareNextMatchGame] Game state - isMatch: ${game.isMatch}, matchOver: ${game.matchOver}, needsNextGame: ${game.needsNextGame}`)

    if (!game.isMatch || game.matchOver) {
        console.log('[prepareNextMatchGame] Cannot start next game - not a match or match is over')
        return null
    }

    if (!game.needsNextGame) {
        console.log('[prepareNextMatchGame] Cannot start next game - current game not finished or flag not set')
        return null
    }

    console.log(`[prepareNextMatchGame] All checks passed. Resetting needsNextGame flag and starting next game`)
    game.needsNextGame = false
    startNextGameInMatch(game)

    console.log(`[prepareNextMatchGame] Next game ready - Game ${game.currentGameNumber}, complete: ${game.complete}`)
    return game
}

export const resignGame = (gameID, playerId) => {
    console.log(`[resignGame] Player ${playerId} resigning from game ${gameID}`)
    const game = games.get(gameID)
    if (!game) {
        console.log(`[resignGame] Game ${gameID} not found`)
        return null
    }

    // Opponent wins by resignation
    game.winner = game.player1 === playerId ? game.player2 : game.player1
    const isPlayer1Resigned = playerId === game.player1
    console.log(`[resignGame] Winner by resignation: ${game.winner}`)

    // Award all remaining cards to the opponent (including trump)
    const resignedHand = isPlayer1Resigned ? game.player1Hand : game.player2Hand
    const opponentHand = isPlayer1Resigned ? game.player2Hand : game.player1Hand

    const allRemainingCards = [
        ...resignedHand,
        ...opponentHand,
        ...game.deck
    ]

    // Include trump card if it exists
    if (game.trump) {
        allRemainingCards.push(game.trump)
    }

    const remainingPoints = allRemainingCards.reduce((sum, card) => {
        return sum + getCardPoints(card)
    }, 0)

    console.log(`[resignGame] ${allRemainingCards.length} cards worth ${remainingPoints} points awarded to ${game.winner}`)

    // Add all cards to opponent's spoils
    if (isPlayer1Resigned) {
        game.player2Spoils.push(...allRemainingCards)
        game.player1Hand = []
        game.player2Hand = []
    } else {
        game.player1Spoils.push(...allRemainingCards)
        game.player1Hand = []
        game.player2Hand = []
    }
    game.deck = []
    game.trump = null // Clear trump since it's been awarded

    game.complete = true
    game.status = 'Ended'
    game.endedAt = new Date()

    // In a match, award marks to the winner
    if (game.isMatch) {
        console.log(`[resignGame] This is a match - awarding marks to winner`)

        // Resignation gives opponent 4 marks (bandeira - forfeit)
        if (game.winner === game.player1) {
            game.player1Marks += 4
            console.log(`[resignGame] Player1 awarded 4 marks for opponent resignation - total: ${game.player1Marks}`)
        } else {
            game.player2Marks += 4
            console.log(`[resignGame] Player2 awarded 4 marks for opponent resignation - total: ${game.player2Marks}`)
        }

        // Resignation forfeits the entire match
        game.matchWinner = game.winner
        game.matchOver = true
        console.log(`[resignGame] Match forfeited - winner: ${game.matchWinner}`)
    }

    // Persist resigned game to database
    persistGameToDatabase(game, { resigned: true })

    return game
}

/**
 * Start the move timer for the current player
 * @param {Object} game - The game object
 * @param {Object} io - Socket.IO instance for emitting events
 */
function startMoveTimer(game, io) {
    // Clear any existing timer
    clearMoveTimer(game)

    game.moveStartTime = Date.now()
    game.timeRemaining = 20

    console.log(`[startMoveTimer] Started 20s timer for game ${game.id}, player: ${game.currentPlayer}`)

    // Emit initial timer state
    if (io) {
        io.to(`game-${game.id}`).emit('timer-tick', {
            gameId: game.id,
            timeRemaining: game.timeRemaining
        })
    }

    // Start countdown interval
    game.moveTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - game.moveStartTime) / 1000)
        game.timeRemaining = Math.max(0, 20 - elapsed)

        if (io) {
            io.to(`game-${game.id}`).emit('timer-tick', {
                gameId: game.id,
                timeRemaining: game.timeRemaining
            })

            // Warning at 5 seconds
            if (game.timeRemaining === 5) {
                io.to(`game-${game.id}`).emit('timer-warning', {
                    gameId: game.id,
                    timeRemaining: game.timeRemaining
                })
            }
        }

        if (game.timeRemaining === 0) {
            clearInterval(game.moveTimerInterval)
            game.moveTimerInterval = null
        }
    }, 1000)

    // Set timeout for forfeit
    game.moveTimer = setTimeout(() => {
        console.log(`[startMoveTimer] Timeout! Game ${game.id}, player ${game.currentPlayer} forfeits`)
        handleTimeout(game, io)
    }, 20000)
}

/**
 * Clear the move timer
 * @param {Object} game - The game object
 */
function clearMoveTimer(game) {
    if (game.moveTimer) {
        clearTimeout(game.moveTimer)
        game.moveTimer = null
    }
    if (game.moveTimerInterval) {
        clearInterval(game.moveTimerInterval)
        game.moveTimerInterval = null
    }
    if (game.moveTimer || game.moveTimerInterval) {
        console.log(`[clearMoveTimer] Timer cleared for game ${game.id}`)
    }
}

/**
 * Handle timeout - award all remaining cards to opponent
 * @param {Object} game - The game object
 * @param {Object} io - Socket.IO instance
 */
function handleTimeout(game, io) {
    console.log(`[handleTimeout] Player ${game.currentPlayer} timed out in game ${game.id}`)

    // Clear the timer
    clearMoveTimer(game)

    // Determine opponent
    const timedOutPlayer = game.currentPlayer
    const opponent = timedOutPlayer === game.player1 ? game.player2 : game.player1
    const isPlayer1TimedOut = timedOutPlayer === game.player1

    console.log(`[handleTimeout] Awarding all remaining cards to ${opponent}`)

    // Get hands based on which player timed out
    const timedOutHand = isPlayer1TimedOut ? game.player1Hand : game.player2Hand
    const opponentHand = isPlayer1TimedOut ? game.player2Hand : game.player1Hand

    // Award all remaining cards to opponent (including trump)
    // Opponent gets: their hand + timed-out player's hand + remaining deck + trump
    const allRemainingCards = [
        ...timedOutHand,
        ...opponentHand,
        ...game.deck
    ]

    // Include trump card if it exists
    if (game.trump) {
        allRemainingCards.push(game.trump)
    }

    // Calculate points from all remaining cards
    const remainingPoints = allRemainingCards.reduce((sum, card) => {
        return sum + getCardPoints(card)
    }, 0)

    console.log(`[handleTimeout] ${allRemainingCards.length} cards worth ${remainingPoints} points awarded to ${opponent}`)

    // Add all cards to opponent's spoils
    if (isPlayer1TimedOut) {
        game.player2Spoils.push(...allRemainingCards)
        game.player1Hand = []
        game.player2Hand = []
    } else {
        game.player1Spoils.push(...allRemainingCards)
        game.player1Hand = []
        game.player2Hand = []
    }
    game.deck = []
    game.trump = null // Clear trump since it's been awarded

    // Force game to end
    game.complete = true
    game.endedAt = new Date()

    // Calculate final scores and determine winner
    const player1Points = game.player1Spoils.reduce((sum, card) => sum + getCardPoints(card), 0)
    const player2Points = game.player2Spoils.reduce((sum, card) => sum + getCardPoints(card), 0)

    console.log(`[handleTimeout] Final scores - ${game.player1}: ${player1Points}, ${game.player2}: ${player2Points}`)

    game.winner = opponent

    // Award marks for timeout forfeit (4 marks - bandeira/maximum penalty)
    if (game.isMatch) {
        if (isPlayer1TimedOut) {
            game.player2Marks += 4
        } else {
            game.player1Marks += 4
        }

        console.log(`[handleTimeout] Timeout forfeit - ${opponent} receives 4 marks`)
        console.log(`[handleTimeout] Current marks: ${game.player1}=${game.player1Marks}, ${game.player2}=${game.player2Marks}`)

        // Check if match is over (4 marks wins)
        const opponentMarks = isPlayer1TimedOut ? game.player2Marks : game.player1Marks
        if (opponentMarks >= 4) {
            game.matchWinner = opponent
            game.matchOver = true
            console.log(`[handleTimeout] Match over - ${opponent} wins by timeout forfeit`)
        }
    }

    // Emit timeout event
    if (io) {
        io.to(`game-${game.id}`).emit('timeout', {
            gameId: game.id,
            timedOutPlayer,
            winner: opponent
        })

        // Emit updated game state to each player with their perspective
        const socketsInRoom = io.sockets.adapter.rooms.get(`game-${game.id}`)
        if (socketsInRoom) {
            socketsInRoom.forEach(socketId => {
                const playerSocket = io.sockets.sockets.get(socketId)
                if (playerSocket) {
                    const playerId = playerSocket.data?.userId
                    const isPlayer1 = playerId === game.player1

                    const state = {
                        id: game.id,
                        variant: game.variant,
                        type: game.type,
                        complete: game.complete,
                        winner: game.winner,
                        player1: game.player1,
                        player2: game.player2,
                        player1Name: game.player1Name,
                        player2Name: game.player2Name,
                        currentPlayer: game.currentPlayer,
                        // Cards (all empty now)
                        myHand: [],
                        opponentHandCount: 0,
                        deck: [],
                        trump: null, // Trump has been awarded
                        myPlayed: null,
                        opponentPlayed: null,
                        // Send actual spoils so points can be calculated
                        mySpoils: isPlayer1 ? game.player1Spoils : game.player2Spoils,
                        opponentSpoils: isPlayer1 ? game.player2Spoils : game.player1Spoils,
                        // Match state
                        isMatch: game.isMatch,
                        currentGameNumber: game.currentGameNumber,
                        player1Marks: game.player1Marks,
                        player2Marks: game.player2Marks,
                        myMarks: isPlayer1 ? game.player1Marks : game.player2Marks,
                        opponentMarks: isPlayer1 ? game.player2Marks : game.player1Marks,
                        matchWinner: game.matchWinner,
                        matchOver: game.matchOver,
                        // Timer
                        timeRemaining: 0,
                    }
                    playerSocket.emit('game-state', state)
                }
            })
        }

        // Emit game-over event
        io.to(`game-${game.id}`).emit('game-over', {
            gameId: game.id,
            winner: game.winner,
            reason: 'timeout',
            player1Marks: game.player1Marks,
            player2Marks: game.player2Marks,
            matchOver: game.matchOver,
            matchWinner: game.matchWinner
        })

        // Persist timeout game to database
        persistGameToDatabase(game, { timeout: true })
    }
}

/**
 * Persist game to database
 * @param {Object} game - Game state object
 * @param {Object} options - Additional options (resigned, timeout, etc.)
 */
export const persistGameToDatabase = async (game, options = {}) => {
    if (!game.player1 || !game.player2) {
        console.log('[Persistence] Skipping game - missing players')
        return
    }

    try {
        console.log(`[Persistence] Saving game ${game.id} to database...`)

        // Save or update match first if this is a match game
        if (game.isMatch) {
            // Only save/update if dbMatchId exists (it should have been created in dealCards)
            if (game.dbMatchId) {
                const matchData = await apiClient.saveMatch(game)
                if (matchData && matchData.id) {
                    console.log(`[Persistence] Match updated - DB ID: ${matchData.id}`)
                }
            } else {
                console.warn(`[Persistence] Match game ${game.id} has no dbMatchId - this should not happen`)
            }
        }

        // Save the game
        const gameData = await apiClient.saveGame({
            ...game,
            resigned: options.resigned || false,
            timeout: options.timeout || false
        })

        let dbGameId = null
        if (gameData && gameData.id) {
            dbGameId = gameData.id
            console.log(`[Persistence] Game saved successfully - DB ID: ${dbGameId}`)
        }

        // Process coin transactions after successful game save
        if (dbGameId) {
            // Calculate points for transaction processing
            const player1Points = computePoints(game.player1Spoils)
            const player2Points = computePoints(game.player2Spoils)

            // For match games, only award match payout when match is over
            // For standalone games, award game payout or refund
            if (game.isMatch) {
                // Match game - only process match payout when match is complete
                if (game.matchOver && game.matchWinner && game.matchWinner !== 'draw') {
                    if (!game.dbMatchId) {
                        console.error(`[Persistence] Match game ${game.id} completed but no dbMatchId - cannot award match payout`)
                    } else {
                        const stake = game.stake || 3
                        const totalStake = stake * 2
                        console.log(`[Persistence] Match ${game.dbMatchId} over - winner ${game.matchWinner} - stake ${stake} - processing match payout (${totalStake} total)`)
                        apiClient.awardMatchPayout(game.dbMatchId, game.matchWinner, totalStake)
                            .catch(err => console.error(`[Persistence] Failed to award match payout for match ${game.dbMatchId}:`, err.message))
                    }
                } else {
                    console.log(`[Persistence] Match game ${dbGameId} ended but match not over yet - no payout`)
                }
            } else {
                // Standalone game - award game payout or refund
                if (game.winner === 'draw') {
                    // Refund 1 coin to each player on draw
                    console.log(`[Persistence] Game ${dbGameId} was a draw - processing refunds`)
                    apiClient.refundGameDraw(dbGameId, game.player1, game.player2)
                        .catch(err => console.error(`[Persistence] Failed to refund draw for game ${dbGameId}:`, err.message))
                } else if (game.winner) {
                    // Award payout to winner based on points
                    const winnerId = game.winner
                    const winnerPoints = winnerId === game.player1 ? player1Points : player2Points

                    console.log(`[Persistence] Game ${dbGameId} won by ${winnerId} with ${winnerPoints} points - processing payout`)
                    apiClient.awardGamePayout(dbGameId, winnerId, winnerPoints)
                        .catch(err => console.error(`[Persistence] Failed to award payout for game ${dbGameId}:`, err.message))
                }
            }
        }
    } catch (error) {
        console.error(`[Persistence] Failed to persist game ${game.id}:`, error.message)
    }
}

/**
 * Cancel a pending game (only creator can cancel, only if still waiting)
 * @param {number} gameID 
 * @param {number} userId 
 * @returns {boolean} true if cancelled, false otherwise
 */
export const cancelGame = (gameID, userId) => {
    const game = games.get(gameID)

    if (!game) {
        console.log(`[cancelGame] Game ${gameID} not found`)
        return false
    }

    // Only allow cancellation if game is still waiting
    if (game.status !== 'waiting') {
        console.log(`[cancelGame] Game ${gameID} cannot be cancelled - status: ${game.status}`)
        return false
    }

    // Only creator can cancel
    if (game.creator !== userId) {
        console.log(`[cancelGame] User ${userId} cannot cancel game ${gameID} - not creator`)
        return false
    }

    // Remove game from the map
    games.delete(gameID)
    console.log(`[cancelGame] Game ${gameID} cancelled by user ${userId}`)
    return true
}

/**
 * Get count of pending games for a user
 * @param {number} userId 
 * @returns {number}
 */
export const getUserPendingGamesCount = (userId) => {
    return Array.from(games.values()).filter(
        g => g.status === 'waiting' && g.creator === userId
    ).length
}

/**
 * Get list of pending games for a user
 * @param {number} userId 
 * @returns {Array}
 */
export const getUserPendingGames = (userId) => {
    return Array.from(games.values()).filter(
        g => g.status === 'waiting' && g.creator === userId
    )
}

// Export timer functions
export { startMoveTimer, clearMoveTimer, handleTimeout }
