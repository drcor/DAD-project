import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import { useAuthStore } from './auth'

export const useGameStore = defineStore('game', () => {
  const authStore = useAuthStore()

  const TRICK_CLEAR_DELAY_MS = 1000

  const ranks = {
    'A': 11, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 10, 'J': 3, 'Q': 2, 'K': 4
  }
  const suits = [
    { sym: '♠', color: 'text-black-200' },
    { sym: '♥', color: 'text-red-500' },
    { sym: '♦', color: 'text-red-500' },
    { sym: '♣', color: 'text-black-200' }
  ]

  const trump = ref({})
  const deck = ref([])
  const hand1 = ref([])
  const hand2 = ref([])
  const played1 = ref(null)
  const played2 = ref(null)
  const spoils1 = ref([])
  const spoils2 = ref([])
  const moves = ref(0)
  const beganAt = ref(undefined)
  // currentPlayer: 'player' or 'bot' (explicit instead of a boolean)
  const currentPlayer = ref('player')
  // Game mode: 'single' (bot) or 'multi' (human vs human)
  const mode = ref('single')
  // Variant: number of cards per hand (3 or 9)
  const handSize = ref(9)
  // Game type: 'standalone' or 'match'
  const gameType = ref('standalone')
  // Bot scheduled action timer id (for canceling/rescheduling)
  const botTimer = ref(null)
  // Game end state
  const gameOver = ref(false)
  const winner = ref(null) // 'player' | 'bot' | 'draw'
  const endedAt = ref(undefined)

  // Match state (for best-of-4-marks matches)
  const isMatch = ref(false) // true when playing a match (not standalone)
  const matchId = ref(null) // unique match identifier
  const currentGameNumber = ref(1) // which game in the match (1, 2, 3, ...)
  const player1Marks = ref(0) // player's marks (games won)
  const player2Marks = ref(0) // opponent's marks (games won)
  const matchWinner = ref(null) // 'player' | 'bot' | null (when match ends)
  const matchOver = ref(false) // true when match is complete
  const matchBeganAt = ref(undefined)
  const matchEndedAt = ref(undefined)

  // Multiplayer state
  const availableGames = ref([]) // List of games in lobby
  const currentGameId = ref(null) // Current multiplayer game ID
  const opponentName = ref(null) // Opponent's name
  const isWaitingForOpponent = ref(false) // Waiting for second player
  const player1Id = ref(null) // User ID of player 1
  const player2Id = ref(null) // User ID of player 2
  const currentPlayerId = ref(null) // User ID of current player (whose turn it is)

  // Timer state
  const timeRemaining = ref(20) // Seconds remaining on current player's move timer
  const timerWarning = ref(false) // true when timer is below 5 seconds
  const showTimeoutModal = ref(false) // Show timeout notification modal
  const timeoutData = ref(null) // Data about the timeout event

  /**
   * Shuffle array of cards
   * @param {Array} cards 
   */
  const shuffleCards = (cards) => {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
  }

  /**
   * Generates array with all the cards
   * @returns {Array}
   */
  const generateCards = () => {
    let cards = []

    let idCounter = 0

    // Create cards
    suits.forEach(s => {
      Object.keys(ranks).forEach(r => {
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

  /**
   * Set board, decks, trump and user hands
   * @param {string} starter - Who starts the game: 'player' or 'bot' (defaults to 'player')
   */
  const setBoard = (starter = 'player') => {
    deck.value = generateCards();
    hand1.value = []
    hand2.value = []
    trump.value = {}
    played1.value = {}
    played2.value = {}
    spoils1.value = []
    spoils2.value = []
    moves.value = 0
    beganAt.value = new Date()
    // clear any pending bot action when resetting the board
    if (botTimer.value) {
      clearTimeout(botTimer.value)
      botTimer.value = null
    }
    // reset end state
    gameOver.value = false
    winner.value = null
    endedAt.value = undefined
    // set starting player (defaults to 'player', but can be 'bot' if they won previous game)
    currentPlayer.value = starter

    // Note: match state (marks, matchId, etc.) is NOT reset here
    // because setBoard() is called for each game within a match
  }

  /**
   * Initialize a new match (best-of-4-marks)
   */
  const startMatch = () => {
    isMatch.value = true
    matchId.value = `match-${Date.now()}`
    currentGameNumber.value = 1
    player1Marks.value = 0
    player2Marks.value = 0
    matchWinner.value = null
    matchOver.value = false
    matchBeganAt.value = new Date()
    matchEndedAt.value = undefined

    // Start first game
    setBoard()
  }

  /**
   * Initialize a standalone game (not part of a match)
   */
  const startStandaloneGame = () => {
    isMatch.value = false
    matchId.value = null
    currentGameNumber.value = 1
    player1Marks.value = 0
    player2Marks.value = 0
    matchWinner.value = null
    matchOver.value = false
    matchBeganAt.value = undefined
    matchEndedAt.value = undefined

    setBoard()
  }

  /**
   * Deal cards between users
   * @param {number} type Number of cards to deal
   */
  const dealCards = (type = 9) => {
    const size = type || handSize.value || 9
    hand1.value = deck.value.splice(0, size)
    hand2.value = deck.value.splice(0, size)
    trump.value = deck.value.pop()
  }

  /**
   * Play a card as a user
   * @param {object} card 
   * @param {boolean} me 
   */
  const playCard = (card, me = true) => {
    if (me) {
      const index = hand1.value.findIndex(c => c.id === card.id)
      if (index !== -1) {
        played1.value = hand1.value[index]
        hand1.value.splice(index, 1)
        // mark that player has played; bot will respond when watcher sees currentPlayer==='bot'
        currentPlayer.value = 'bot'
      }
    } else {
      const index = hand2.value.findIndex(c => c.id === card.id)
      if (index !== -1) {
        played2.value = hand2.value[index]
        hand2.value.splice(index, 1)
        // If the bot is leading (player hasn't played yet), allow the player to play next
        if (Object.keys(played1.value).length === 0) {
          currentPlayer.value = 'player'
        }
      }
    }

    if (Object.keys(played1.value).length > 0 && Object.keys(played2.value).length > 0) {
      console.log(card)
      setTimeout(() => clearPlayedCards(), TRICK_CLEAR_DELAY_MS)
    }
  }

  /**
   * Get card number of points
   * @param {object} card 
   * @returns {number}
   */
  const cardPoints = (card) => {
    return ranks[card.rank];
  };

  /**
   * Return true if cardA beats cardB under current rules and trump
   * @param {object} cardA
   * @param {object} cardB
   */
  const cardBeats = (cardA, cardB) => {
    if (!cardA || !cardB) return false
    // Same suit: higher points wins
    if (cardA.suit === cardB.suit) return cardPoints(cardA) > cardPoints(cardB)

    // If A is trump and B is not trump, A wins
    if (trump.value && cardA.suit === trump.value.suit && cardB.suit !== trump.value.suit) return true

    // If B is trump and A is not, A cannot beat B
    if (trump.value && cardB.suit === trump.value.suit && cardA.suit !== trump.value.suit) return false

    // Otherwise A cannot beat B
    return false
  }


  /**
   * Check if player1 is the winner
   * @returns {boolean}
   */
  const wins = () => {
    const c1 = played1.value
    const c2 = played2.value
    if (c1.suit === c2.suit)
      // If same suit, higher points wins; use strict comparison (>) to match cardBeats
      // so the second player cannot overturn a tie by playing an equal-value card.
      return cardPoints(c1) > cardPoints(c2);

    if (c1.suit === trump.value.suit) return true;
    if (c2.suit === trump.value.suit) return false;

    return true; // the first player wins if there is no trump
  };

  const clearPlayedCards = () => {
    const isPlayer1Winner = wins();

    // increment move counter for each completed trick
    moves.value++

    if (isPlayer1Winner) {
      clearToPlayer1()
    } else {
      clearToPlayer2()
    }

    // Set next starter according to trick winner
    // winner -> 'player' starts next, otherwise 'bot'
    currentPlayer.value = isPlayer1Winner ? 'player' : 'bot'

    dealNewTrick()

    // If the bot won the trick and is scheduled to lead next, make sure it actually gets scheduled.
    // Edge case: `currentPlayer` might already be 'bot' (player set it earlier), so the watcher
    // might not fire — schedule bot here if needed.
    if (mode.value === 'single' && !isPlayer1Winner) {
      // cancel any existing timer and schedule a bot lead
      if (botTimer.value) {
        clearTimeout(botTimer.value)
        botTimer.value = null
      }

      botTimer.value = setTimeout(() => {
        if (hand2.value.length && Object.keys(played2.value).length === 0) {
          botPlay()
        }
        botTimer.value = null
      }, TRICK_CLEAR_DELAY_MS)
    }

    // After dealing the next trick, check for game end
    if (hasGameEnded()) {
      // compute final result
      detectGameEnd()
      console.log('Game ended', winner.value)
    }
  }

  const clearToPlayer1 = () => {
    // Only push valid cards (have an id). Protect against empty objects/null.
    if (played1.value && played1.value.id != null) spoils1.value.push(played1.value)
    if (played2.value && played2.value.id != null) spoils1.value.push(played2.value)

    // Reset played slots
    played1.value = {}
    played2.value = {}

    // Sanitize spoils array to remove any falsy entries (defensive)
    spoils1.value = spoils1.value.filter(Boolean)
  }

  const clearToPlayer2 = () => {
    if (played1.value && played1.value.id != null) spoils2.value.push(played1.value)
    if (played2.value && played2.value.id != null) spoils2.value.push(played2.value)

    played1.value = {}
    played2.value = {}

    spoils2.value = spoils2.value.filter(Boolean)
  }

  const dealNewTrick = () => {
    if (deck.value.length === 0) return

    if (deck.value.length === 1) {
      hand1.value.push(deck.value.shift())
      hand2.value.push(trump.value)
      return
    }

    hand1.value.push(deck.value.shift())
    hand2.value.push(deck.value.shift())
  }


  const botPlay = () => {
    if (!hand2.value.length) return
    // Check if second in trick (player1/me already played)
    if (Object.keys(played1.value).length !== 0) {
      // Try to find the minimal card that still beats the played card
      const opponent = played1.value
      const winningCandidates = hand2.value.filter(c => cardBeats(c, opponent))

      if (winningCandidates.length > 0) {
        // choose the lowest-value card among winners to conserve strength
        const play = winningCandidates.reduce((prev, curr) => cardPoints(curr) < cardPoints(prev) ? curr : prev)
        playCard(play, false)
      } else {
        // cannot win: play the lowest-value card
        const minCard = hand2.value.reduce((prev, curr) => cardPoints(curr) < cardPoints(prev) ? curr : prev)
        playCard(minCard, false)
      }
    } else {
      // If first to play, play lowest value card
      const minCard = hand2.value.reduce((prev, curr) => cardPoints(curr) < cardPoints(prev) ? curr : prev);
      playCard(minCard, false)
    }
  }

  // Watch for turn changes so the bot can play when it's the bot's turn (only in single-player)
  watch(currentPlayer, (newVal) => {
    if (mode.value !== 'single') return

    // When currentPlayer becomes 'bot', schedule bot to play. Use a cancelable timer
    // so we don't schedule duplicate plays and so the bot can lead when appropriate.
    if (newVal === 'bot') {
      // clear any previously scheduled bot action
      if (botTimer.value) {
        clearTimeout(botTimer.value)
        botTimer.value = null
      }

      botTimer.value = setTimeout(() => {
        // guard: only play if bot still has cards and hasn't already played this trick
        if (hand2.value.length && Object.keys(played2.value).length === 0) {
          botPlay()
        }
        botTimer.value = null
      }, TRICK_CLEAR_DELAY_MS)
    } else {
      // If it becomes the player's turn, cancel any pending bot action
      if (botTimer.value) {
        clearTimeout(botTimer.value)
        botTimer.value = null
      }
    }
  })

  const hasGameEnded = () => {
    // Game ends when deck is empty and both players have no cards in hand
    return deck.value.length === 0 && hand1.value.length === 0 && hand2.value.length === 0;
  }

  const computePoints = (cards) => {
    return (cards || []).reduce((sum, c) => sum + (cardPoints(c) || 0), 0)
  }

  const detectGameEnd = () => {
    if (gameOver.value) return

    const p1 = computePoints(spoils1.value)
    const p2 = computePoints(spoils2.value)

    if (p1 > p2) winner.value = 'player'
    else if (p2 > p1) winner.value = 'bot'
    else winner.value = 'draw'

    gameOver.value = true
    endedAt.value = new Date()

    // clear any pending bot action
    if (botTimer.value) {
      clearTimeout(botTimer.value)
      botTimer.value = null
    }

    // If playing a match, award marks and check if match continues
    if (isMatch.value && !matchOver.value) {
      handleMatchGameEnd()
    }
  }

  /**
   * Handle end of a game within a match
   * Award marks to winner and check if match is complete
   * Match is best-of-4: always play 4 games, then determine winner by total marks
   */
  const handleMatchGameEnd = () => {
    // Award mark to game winner (draws don't award marks)
    if (winner.value === 'player') {
      player1Marks.value++
    } else if (winner.value === 'bot') {
      player2Marks.value++
    }

    // Check if all 4 games have been played
    if (currentGameNumber.value >= 4) {
      // Match complete - determine winner by marks
      if (player1Marks.value > player2Marks.value) {
        matchWinner.value = 'player'
      } else if (player2Marks.value > player1Marks.value) {
        matchWinner.value = 'bot'
      } else {
        // Tie in marks after 4 games - it's a draw
        matchWinner.value = 'draw'
      }
      matchOver.value = true
      matchEndedAt.value = new Date()
    }
    // else match continues to next game (game 1, 2, or 3)
  }

  /**
   * Start the next game in a match
   * The winner of the previous game starts the next game
   */
  const startNextGame = () => {
    if (!isMatch.value || matchOver.value) return

    currentGameNumber.value++
    // Winner of previous game starts next game
    const starter = winner.value === 'player' ? 'player' : winner.value === 'bot' ? 'bot' : 'player'
    setBoard(starter)
    dealCards(handSize.value)
  }

  /**
   * Set available games list (from server)
   */
  const setGames = (games) => {
    availableGames.value = games
  }

  /**
   * Set multiplayer game state (from server)
   */
  const setMultiplayerGame = (game) => {
    console.log('[GameStore] Setting multiplayer game:', game)
    console.log('[GameStore] Turn state - currentPlayer:', game.currentPlayer,
      'player1:', game.player1,
      'player2:', game.player2)

    // Update game state from server
    currentGameId.value = game.id
    deck.value = game.deck || []
    handSize.value = game.variant || 9
    gameType.value = game.type || 'standalone'

    // Backend sends myHand/opponentHand based on player perspective
    hand1.value = game.myHand || []
    hand2.value = [] // Opponent's hand is hidden

    trump.value = game.trump || {}
    played1.value = game.myPlayed || null
    played2.value = game.opponentPlayed || null
    spoils1.value = game.mySpoils || []
    spoils2.value = game.opponentSpoils || []
    moves.value = game.moves || 0
    currentPlayer.value = game.currentPlayer || 'player'
    gameOver.value = game.complete || false
    winner.value = game.winner || null

    // Set turn state - store current player ID
    currentPlayerId.value = game.currentPlayer || null

    // Set player IDs
    player1Id.value = game.player1 || null
    player2Id.value = game.player2 || null

    // Match state
    if (game.type === 'match' || game.isMatch) {
      isMatch.value = true
      currentGameNumber.value = game.currentGameNumber || 1

      // Handle both perspective-based (myMarks/opponentMarks) and raw (player1Marks/player2Marks) formats
      if (game.myMarks !== undefined || game.opponentMarks !== undefined) {
        // Perspective-based format from getGameStateForPlayer
        player1Marks.value = game.myMarks || 0
        player2Marks.value = game.opponentMarks || 0
      } else if (game.player1Marks !== undefined || game.player2Marks !== undefined) {
        // Raw format - need to determine which is "my" marks
        const myUserId = authStore.currentUserID
        if (myUserId === game.player1) {
          player1Marks.value = game.player1Marks || 0
          player2Marks.value = game.player2Marks || 0
        } else {
          player1Marks.value = game.player2Marks || 0
          player2Marks.value = game.player1Marks || 0
        }
      }

      matchWinner.value = game.matchWinner || null
      matchOver.value = game.matchOver || false
    } else {
      isMatch.value = false
    }

    // Timer state
    if (game.timeRemaining !== undefined) {
      timeRemaining.value = game.timeRemaining
    }
    // Reset warning if timer is back to high value
    if (game.timeRemaining > 5) {
      timerWarning.value = false
    }

    // Set opponent info
    opponentName.value = game.opponentName || null
    isWaitingForOpponent.value = game.status === 'waiting'
  }

  /**
   * Computed property for multiplayer game state
   * Returns a reactive object with all multiplayer game data
   */
  const multiplayerGame = computed(() => {
    if (!currentGameId.value) return null

    // Calculate isMyTurn based on current player ID
    const myUserId = authStore.currentUserID
    const isMyTurn = currentPlayerId.value === myUserId

    return {
      id: currentGameId.value,
      variant: handSize.value,
      type: gameType.value,
      deck: deck.value,
      trump: trump.value,
      myHand: hand1.value,
      opponentHandCount: hand2.value.length,
      myPlayed: played1.value,
      opponentPlayed: played2.value,
      mySpoils: spoils1.value,
      opponentSpoils: spoils2.value,
      moves: moves.value,
      isMyTurn: isMyTurn, // Calculated from currentPlayerId === myUserId
      currentPlayer: currentPlayer.value,
      currentPlayerId: currentPlayerId.value, // User ID of whose turn it is
      player1Id: player1Id.value, // User ID of player 1
      player2Id: player2Id.value, // User ID of player 2
      complete: gameOver.value,
      winner: winner.value,
      opponentName: opponentName.value,
      isWaitingForOpponent: isWaitingForOpponent.value,
      // Match state
      isMatch: isMatch.value,
      currentGameNumber: currentGameNumber.value,
      myMarks: player1Marks.value,
      opponentMarks: player2Marks.value,
      matchWinner: matchWinner.value,
      matchOver: matchOver.value,
      // Timer state
      timeRemaining: timeRemaining.value,
      timerWarning: timerWarning.value,
    }
  })

  /**
   * Set time remaining from timer tick event
   * @param {number} time - Seconds remaining
   */
  const setTimeRemaining = (time) => {
    timeRemaining.value = time
    // Clear warning if time goes back up (shouldn't happen normally)
    if (time > 5) {
      timerWarning.value = false
    }
  }

  /**
   * Set timer warning state (when time is low)
   * @param {boolean} warning - Whether to show warning
   */
  const setTimerWarning = (warning) => {
    timerWarning.value = warning
  }

  /**
   * Handle timeout event from server
   * @param {Object} data - Timeout event data
   */
  const handleTimeout = (data) => {
    console.log('[GameStore] Timeout occurred:', data)
    timeoutData.value = data
    showTimeoutModal.value = true
    // Timer will be stopped by server
    timeRemaining.value = 0
  }

  /**
   * Close timeout modal
   */
  const closeTimeoutModal = () => {
    showTimeoutModal.value = false
    timeoutData.value = null
  }

  return {
    // Cards details
    ranks,
    suits,
    // Game board data
    trump,
    deck,
    hand1,
    hand2,
    played1,
    played2,
    spoils1,
    spoils2,
    moves,
    // end state
    gameOver,
    winner,
    beganAt,
    endedAt,
    // mode & variant
    mode,
    handSize,
    gameType,
    currentPlayer,
    // match state
    isMatch,
    matchId,
    currentGameNumber,
    player1Marks,
    player2Marks,
    matchWinner,
    matchOver,
    matchBeganAt,
    matchEndedAt,
    // multiplayer state
    availableGames,
    currentGameId,
    opponentName,
    isWaitingForOpponent,
    multiplayerGame,
    // timer state
    timeRemaining,
    timerWarning,
    showTimeoutModal,
    timeoutData,
    // methods
    setBoard,
    dealCards,
    playCard,
    cardPoints,
    startMatch,
    startStandaloneGame,
    startNextGame,
    setGames,
    setMultiplayerGame,
    // timer methods
    setTimeRemaining,
    setTimerWarning,
    handleTimeout,
    closeTimeoutModal
  }
})
