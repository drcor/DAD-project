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
    currentGameID++

    const variant = options.variant || 9 // 3 or 9 cards
    const type = options.type || 'standalone' // 'standalone' or 'match'

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
        status: 'waiting', // 'waiting', 'in-progress', 'completed'
        variant: variant,
        type: type,
        // Cards
        deck: generateCards(),
        player1Hand: [],
        player2Hand: [],
        trump: null,
        player1Played: null,
        player2Played: null,
        player1Spoils: [],
        player2Spoils: [],
        // Match state
        isMatch: type === 'match',
        currentGameNumber: 1,
        player1Marks: 0,
        player2Marks: 0,
        matchWinner: null,
        matchOver: false,
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
    } else {
        game.player2Played = card
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

const getCardPoints = (card) => {
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

    // Determine winner
    const player1Wins = cardBeats(card1, card2, game.trump)

    game.moves++

    // Award spoils to winner
    if (player1Wins) {
        game.player1Spoils.push(card1, card2)
        game.currentPlayer = game.player1 // Winner starts next trick
    } else {
        game.player2Spoils.push(card1, card2)
        game.currentPlayer = game.player2
    }

    // Clear played cards
    game.player1Played = null
    game.player2Played = null

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
                game.status = 'completed'
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
            game.status = 'completed'
        }

        game.endedAt = new Date()
        console.log(`[checkForGameEnd] Game end processing complete - complete: ${game.complete}, needsNextGame: ${game.needsNextGame}`)
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
    console.log(`[resignGame] Winner by resignation: ${game.winner}`)

    game.complete = true
    game.status = 'completed'
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

    return game
}
