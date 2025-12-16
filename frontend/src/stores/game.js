import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useGameStore = defineStore('game', () => {

  const TRICK_CLEAR_DELAY_MS = 1000

  const ranks = {
    'A': 11, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, 'J': 3, 'Q': 2, 'K': 4
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
  const played1 = ref({})
  const played2 = ref({})
  const spoils1 = ref([])
  const spoils2 = ref([])
  const moves = ref(0)
  const beganAt = ref(undefined)
  // const endedAt = ref(undefined)
  // currentPlayer: 'player' or 'bot' (explicit instead of a boolean)
  const currentPlayer = ref('player')
  // Game mode: 'single' (bot) or 'multi' (human vs human)
  const mode = ref('single')
  // Variant: number of cards per hand (3 or 9)
  const handSize = ref(9)
  // Bot scheduled action timer id (for canceling/rescheduling)
  const botTimer = ref(null)
  // Game end state
  const gameOver = ref(false)
  const winner = ref(null) // 'player' | 'bot' | 'draw'
  const endedAt = ref(undefined)

  /**
   * Shuffle array of cards
   * @param {Array} a 
   */
  const shuffleCards = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
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
   */
  const setBoard = () => {
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
      // If same suit, higher points wins. In case of equal points the first player (who led)
      // should win the trick — use >= to award ties to the leader.
      return cardPoints(c1) >= cardPoints(c2);

    if (c1.suit === trump.value.suit) return true;
    if (c2.suit === trump.value.suit) return false;

    return true; // quem joga primeiro ganha se não houver trunfo
  };

  const clearPlayedCards = () => {
    const isPlayer1Winner = wins();

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
      trump.value = {}
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
    // replaced by currentPlayer below
    // end state
    gameOver,
    winner,
    endedAt,
    // mode & variant
    mode,
    handSize,
    currentPlayer,
    // methods
    setBoard,
    dealCards,
    playCard,
    cardPoints
  }
})
