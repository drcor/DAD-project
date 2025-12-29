import axios from 'axios'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || ''

/**
 * HTTP client for communicating with Laravel API
 */
class ApiClient {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Internal-API-Key': INTERNAL_API_KEY
            }
        })
    }

    /**
     * Save a completed game to the database
     * @param {Object} gameData 
     * @returns {Promise}
     */
    async saveGame(gameData) {
        try {
            const payload = this.formatGameData(gameData)
            const response = await this.client.post('/games/persist', payload, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Game saved successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to save game:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Save or update a match to the database
     * @param {Object} matchData 
     * @returns {Promise}
     */
    async saveMatch(matchData) {
        try {
            const payload = this.formatMatchData(matchData)
            const response = await this.client.post('/matches/persist', payload, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Match saved successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to save match:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Deduct game entry fee from both players (2 coins each)
     * @param {number} gameId 
     * @param {number} player1Id 
     * @param {number} player2Id 
     * @returns {Promise}
     */
    async deductGameFee(gameId, player1Id, player2Id) {
        try {
            const response = await this.client.post('/games/transactions/fee', {
                game_id: gameId,
                player1_id: player1Id,
                player2_id: player2Id
            }, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Game fees deducted successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to deduct game fees:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Award game payout to winner (3/4/6 coins based on points)
     * @param {number} gameId 
     * @param {number} winnerId 
     * @param {number} points 
     * @returns {Promise}
     */
    async awardGamePayout(gameId, winnerId, points) {
        try {
            const response = await this.client.post('/games/transactions/payout', {
                game_id: gameId,
                winner_id: winnerId,
                points: points
            }, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Game payout awarded successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to award game payout:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Refund game fees on draw (1 coin each player)
     * @param {number} gameId 
     * @param {number} player1Id 
     * @param {number} player2Id 
     * @returns {Promise}
     */
    async refundGameDraw(gameId, player1Id, player2Id) {
        try {
            const response = await this.client.post('/games/transactions/refund', {
                game_id: gameId,
                player1_id: player1Id,
                player2_id: player2Id
            }, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Game draw refunded successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to refund game draw:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Deduct match stake from both players (3-100 coins each)
     * @param {number} matchId 
     * @param {number} player1Id 
     * @param {number} player2Id 
     * @param {number} stake 
     * @returns {Promise}
     */
    async deductMatchStake(matchId, player1Id, player2Id, stake) {
        try {
            const response = await this.client.post('/matches/transactions/stake', {
                match_id: matchId,
                player1_id: player1Id,
                player2_id: player2Id,
                stake: stake
            }, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Match stakes deducted successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to deduct match stakes:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Award match payout to winner (total stake - 1 coin commission)
     * @param {number} matchId 
     * @param {number} winnerId 
     * @param {number} totalStake 
     * @returns {Promise}
     */
    async awardMatchPayout(matchId, winnerId, totalStake) {
        try {
            const response = await this.client.post('/matches/transactions/payout', {
                match_id: matchId,
                winner_id: winnerId,
                total_stake: totalStake
            }, {
                headers: {
                    'X-Internal-API-Key': INTERNAL_API_KEY
                }
            })
            console.log('[ApiClient] Match payout awarded successfully:', response.data)
            return response.data
        } catch (error) {
            console.error('[ApiClient] Failed to award match payout:', error.message)
            if (error.response) {
                console.error('[ApiClient] Error details:', error.response.data)
            }
            throw error
        }
    }

    /**
     * Format game data for API
     * @param {Object} game 
     * @returns {Object}
     */
    formatGameData(game) {
        // Calculate points from spoils
        const player1Points = this.calculatePoints(game.player1Spoils)
        const player2Points = this.calculatePoints(game.player2Spoils)

        return {
            variant: game.variant,
            type: game.type,
            player1: game.player1,
            player2: game.player2,
            player1Points,
            player2Points,
            beganAt: game.beganAt,
            endedAt: game.endedAt,
            moves: game.moves,
            matchId: game.dbMatchId || null, // Database match ID
            resigned: game.resigned || false,
            timeout: game.timeout || false
        }
    }

    /**
     * Format match data for API
     * @param {Object} game 
     * @returns {Object}
     */
    formatMatchData(game) {
        // Calculate total points across all games in the match
        const player1Points = this.calculatePoints(game.player1Spoils)
        const player2Points = this.calculatePoints(game.player2Spoils)

        return {
            variant: game.variant,
            player1: game.player1,
            player2: game.player2,
            player1Marks: game.player1Marks,
            player2Marks: game.player2Marks,
            player1TotalPoints: game.player1TotalPoints || player1Points,
            player2TotalPoints: game.player2TotalPoints || player2Points,
            matchWinner: game.matchWinner,
            matchOver: game.matchOver,
            matchId: game.matchId, // WebSocket match ID
            dbMatchId: game.dbMatchId, // Database match ID (if exists)
            beganAt: game.matchBeganAt || game.beganAt,
            endedAt: game.matchEndedAt || game.endedAt,
            currentGameNumber: game.currentGameNumber,
            stake: 3 // Default stake
        }
    }

    /**
     * Calculate points from cards
     * @param {Array} cards 
     * @returns {number}
     */
    calculatePoints(cards) {
        const cardPoints = {
            'A': 11,
            '7': 10,
            'K': 4,
            'J': 3,
            'Q': 2,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0
        }

        return (cards || []).reduce((sum, card) => {
            return sum + (cardPoints[card.rank] || 0)
        }, 0)
    }
}

export const apiClient = new ApiClient()
