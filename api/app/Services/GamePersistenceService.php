<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameMatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GamePersistenceService
{
    /**
     * Save a completed game to the database
     * 
     * @param array $gameData Game data from WebSocket server
     * @return Game|null
     */
    public function saveGame(array $gameData)
    {
        try {
            DB::beginTransaction();

            // Calculate total time if both timestamps exist
            $totalTime = null;
            if (isset($gameData['beganAt']) && isset($gameData['endedAt'])) {
                $beganAt = new \DateTime($gameData['beganAt']);
                $endedAt = new \DateTime($gameData['endedAt']);
                $totalTime = $endedAt->getTimestamp() - $beganAt->getTimestamp();
            }

            // Determine winner and loser
            $isDraw = $gameData['player1Points'] === $gameData['player2Points'];
            $winnerId = null;
            $loserId = null;
            $winnerPoints = 0;

            if (!$isDraw) {
                if ($gameData['player1Points'] > $gameData['player2Points']) {
                    $winnerId = $gameData['player1'];
                    $loserId = $gameData['player2'];
                    $winnerPoints = $gameData['player1Points'];
                } else {
                    $winnerId = $gameData['player2'];
                    $loserId = $gameData['player1'];
                    $winnerPoints = $gameData['player2Points'];
                }
            }

            // Determine achievement flags
            $isCapote = false;
            $isBandeira = false;
            
            if (!$isDraw && $winnerPoints >= 91) {
                $isCapote = true;
            }
            
            if (!$isDraw && $winnerPoints === 120) {
                $isBandeira = true;
            }

            // Determine forfeit status
            $isForfeit = ($gameData['resigned'] ?? false) || ($gameData['timeout'] ?? false);
            $forfeitReason = null;
            
            if ($isForfeit) {
                if ($gameData['resigned'] ?? false) {
                    $forfeitReason = 'resignation';
                } elseif ($gameData['timeout'] ?? false) {
                    $forfeitReason = 'timeout';
                }
            }

            // Create game record
            $game = Game::create([
                'type' => (string)$gameData['variant'], // '3' or '9'
                'player1_user_id' => $gameData['player1'],
                'player2_user_id' => $gameData['player2'],
                'is_draw' => $isDraw,
                'winner_user_id' => $winnerId,
                'loser_user_id' => $loserId,
                'match_id' => $gameData['matchId'] ?? null,
                'status' => 'Ended',
                'began_at' => $gameData['beganAt'] ?? null,
                'ended_at' => $gameData['endedAt'] ?? null,
                'total_time' => $totalTime,
                'player1_points' => $gameData['player1Points'],
                'player2_points' => $gameData['player2Points'],
                'is_capote' => $isCapote,
                'is_bandeira' => $isBandeira,
                'is_forfeit' => $isForfeit,
                'forfeit_reason' => $forfeitReason,
                'custom' => [
                    'moves' => $gameData['moves'] ?? 0,
                    'game_type' => $gameData['type'] ?? 'standalone',
                    'resigned' => $gameData['resigned'] ?? false,
                    'timeout' => $gameData['timeout'] ?? false
                ]
            ]);

            DB::commit();

            Log::info('Game saved to database', [
                'game_id' => $game->id,
                'websocket_id' => $gameData['id'] ?? null,
                'player1' => $gameData['player1'],
                'player2' => $gameData['player2']
            ]);

            return $game;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save game to database', [
                'error' => $e->getMessage(),
                'gameData' => $gameData
            ]);
            return null;
        }
    }

    /**
     * Save or update a match to the database
     * 
     * @param array $matchData Match data from WebSocket server
     * @return GameMatch|null
     */
    public function saveMatch(array $matchData)
    {
        try {
            DB::beginTransaction();

            // Calculate total time if both timestamps exist
            $totalTime = null;
            if (isset($matchData['beganAt']) && isset($matchData['endedAt'])) {
                $beganAt = new \DateTime($matchData['beganAt']);
                $endedAt = new \DateTime($matchData['endedAt']);
                $totalTime = $endedAt->getTimestamp() - $beganAt->getTimestamp();
            }

            // Determine winner and loser
            $winnerId = null;
            $loserId = null;

            if (isset($matchData['matchWinner'])) {
                $winnerId = $matchData['matchWinner'];
                $loserId = $matchData['player1'] === $winnerId 
                    ? $matchData['player2'] 
                    : $matchData['player1'];
            }

            // Check if match already exists in DB
            $match = null;
            if (isset($matchData['dbMatchId'])) {
                $match = GameMatch::find($matchData['dbMatchId']);
            }

            // Calculate capotes and bandeiras from match games
            $player1Capotes = 0;
            $player1Bandeiras = 0;
            $player2Capotes = 0;
            $player2Bandeiras = 0;

            if ($match) {
                // Count achievements from all games in this match
                $games = Game::where('match_id', $match->id)->get();
                
                foreach ($games as $game) {
                    if ($game->winner_user_id === $matchData['player1']) {
                        if ($game->is_bandeira) {
                            $player1Bandeiras++;
                        } elseif ($game->is_capote) {
                            $player1Capotes++;
                        }
                    } elseif ($game->winner_user_id === $matchData['player2']) {
                        if ($game->is_bandeira) {
                            $player2Bandeiras++;
                        } elseif ($game->is_capote) {
                            $player2Capotes++;
                        }
                    }
                }
            }

            $matchDbData = [
                'type' => (string)$matchData['variant'], // '3' or '9'
                'player1_user_id' => $matchData['player1'],
                'player2_user_id' => $matchData['player2'],
                'winner_user_id' => $winnerId,
                'loser_user_id' => $loserId,
                'status' => $matchData['matchOver'] ? 'Ended' : 'Playing',
                'stake' => $matchData['stake'] ?? 3,
                'began_at' => $matchData['beganAt'] ?? null,
                'ended_at' => $matchData['endedAt'] ?? null,
                'total_time' => $totalTime,
                'player1_marks' => $matchData['player1Marks'] ?? 0,
                'player2_marks' => $matchData['player2Marks'] ?? 0,
                'player1_points' => $matchData['player1TotalPoints'] ?? 0,
                'player2_points' => $matchData['player2TotalPoints'] ?? 0,
                'player1_capotes' => $player1Capotes,
                'player1_bandeiras' => $player1Bandeiras,
                'player2_capotes' => $player2Capotes,
                'player2_bandeiras' => $player2Bandeiras,
                'custom' => [
                    'current_game_number' => $matchData['currentGameNumber'] ?? 1,
                    'websocket_match_id' => $matchData['matchId'] ?? null
                ]
            ];

            if ($match) {
                // Update existing match
                $match->update($matchDbData);
            } else {
                // Create new match
                $match = GameMatch::create($matchDbData);
            }

            DB::commit();

            Log::info('Match saved to database', [
                'match_id' => $match->id,
                'websocket_match_id' => $matchData['matchId'] ?? null,
                'player1' => $matchData['player1'],
                'player2' => $matchData['player2'],
                'is_complete' => $matchData['matchOver'] ?? false
            ]);

            return $match;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save match to database', [
                'error' => $e->getMessage(),
                'matchData' => $matchData
            ]);
            return null;
        }
    }

    /**
     * Save game and associate it with a match
     * 
     * @param array $gameData
     * @param int $matchDbId Database ID of the match
     * @return Game|null
     */
    public function saveGameWithMatch(array $gameData, int $matchDbId)
    {
        $gameData['matchId'] = $matchDbId;
        return $this->saveGame($gameData);
    }
}
