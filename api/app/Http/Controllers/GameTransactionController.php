<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GameTransactionController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Check if request is authenticated (either user auth or internal API key)
     * @param Request $request
     * @return bool
     * @throws \Exception
     */
    private function authenticateRequest(Request $request): bool
    {
        // Check for internal API key FIRST (for WebSocket server)
        $apiKey = $request->header('X-Internal-API-Key');
        $expectedKey = config('app.internal_api_key');
        
        Log::info('[Auth] Checking authentication', [
            'has_api_key_header' => !empty($apiKey),
            'has_expected_key_config' => !empty($expectedKey),
            'api_key_matches' => $apiKey === $expectedKey,
        ]);
        
        if ($apiKey && $expectedKey && $apiKey === $expectedKey) {
            Log::info('[Auth] Internal API key authenticated successfully');
            return true;
        }

        // Check for user authentication
        $user = $request->user();
        if ($user) {
            Log::info('[Auth] User authenticated', ['user_id' => $user->id]);
            return true;
        }

        Log::error('[Auth] Authentication failed - no valid credentials');
        throw new \Exception('Authentication required');
    }

    /**
     * Deduct game entry fee from both players
     * POST /api/games/transactions/fee
     */
    public function deductFee(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);
            $user = $request->user(); // May be null for internal API calls

            // Common validation for both endpoints
            $validated = $request->validate([
                'game_id' => 'required|integer|exists:games,id',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
            ]);

            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $gameId = $validated['game_id'];

            // Load game and enforce server-side consistency
            $game = Game::findOrFail($gameId);

            // Ensure the supplied player IDs match the actual game participants
            if (
                ($game->player1_user_id ?? null) !== $player1->id ||
                ($game->player2_user_id ?? null) !== $player2->id
            ) {
                throw new \Exception('Player IDs do not match the game participants');
            }

            // Ensure the acting user is one of the participants (prevents arbitrary callers)
            // Skip this check for internal API calls (user will be null)
            if ($user && !in_array($user->id, [$player1->id, $player2->id], true)) {
                throw new \Exception('You are not a participant of this game');
            }

            // Prevent double deduction: require a server-side flag/column on Game
            // (adjust property name to match your schema; common names: fees_deducted / fee_taken)
            if (!empty($game->fees_deducted)) {
                throw new \Exception('Game fees have already been deducted for this game');
            }

            // Deduct fee from both players (service should also be idempotent/verify)
            $transaction1 = $this->transactionService->deductGameFee($player1, $gameId);
            $transaction2 = $this->transactionService->deductGameFee($player2, $gameId);

            // Mark fees as deducted on the game to prevent replay
            $game->fees_deducted = true;
            $game->save();

            Log::info('Game fees deducted', [
                'game_id' => $gameId,
                'player1' => $player1->id,
                'player2' => $player2->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Game fees deducted successfully',
                'transactions' => [
                    'player1' => $transaction1,
                    'player2' => $transaction2,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to deduct game fees', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Award game payout to winner
     * POST /api/games/transactions/payout
     */
    public function awardPayout(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);
            $user = $request->user(); // May be null for internal API calls

            $validated = $request->validate([
                'game_id' => 'required|integer|exists:games,id',
                'winner_id' => 'required|integer|exists:users,id',
                'points' => 'required|integer|min:61|max:120',
            ]);

            $winner = User::findOrFail($validated['winner_id']);
            $gameId = $validated['game_id'];
            $points = $validated['points'];

            // Load game and validate server-side state
            $game = Game::findOrFail($gameId);

            // Verify that the winner is actually a participant of the game
            if (!in_array($winner->id, [($game->player1_user_id ?? null), ($game->player2_user_id ?? null)], true)) {
                throw new \Exception('Winner does not belong to the specified game');
            }

            // Only a participant (or internal service) may request payout for that game
            // Skip this check for internal API calls (user will be null)
            if ($user && !in_array($user->id, [($game->player1_user_id ?? null), ($game->player2_user_id ?? null)], true)) {
                throw new \Exception('You are not authorized to award payout for this game');
            }

            // Ensure the game is completed (adjust status field name as needed)
            if (!empty($game->status) && !in_array($game->status, ['Ended', 'completed'])) {
                throw new \Exception('Game is not completed; payout cannot be awarded');
            }

            // Prevent double payout (adjust property name to match your schema: payout_awarded / paid_out)
            if (!empty($game->payout_awarded)) {
                throw new \Exception('Payout has already been awarded for this game');
            }

            // If the game stores the final points on the server, validate them match the request
            // Determine winner's points from server-side records
            $winnerPoints = null;
            if ($game->winner_user_id === $game->player1_user_id) {
                $winnerPoints = $game->player1_points;
            } elseif ($game->winner_user_id === $game->player2_user_id) {
                $winnerPoints = $game->player2_points;
            }

            if ($winnerPoints !== null && $winnerPoints !== $points) {
                throw new \Exception('Supplied points do not match the recorded game result');
            }

            // Award payout to winner (service should also perform its own checks)
            $transaction = $this->transactionService->awardGamePayout($winner, $points, $gameId);

            // Mark payout awarded on the game to prevent replay
            $game->payout_awarded = true;
            $game->winner_user_id = $winner->id;
            $game->save();

            Log::info('Game payout awarded', [
                'game_id' => $gameId,
                'winner' => $winner->id,
                'points' => $points,
                'payout' => $transaction->coins,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Game payout awarded successfully',
                'transaction' => $transaction,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to award game payout', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Refund game fees on draw (1 coin each player)
     * POST /api/games/transactions/refund
     */
    public function refundDraw(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);
            $user = $request->user(); // May be null for internal API calls

            $validated = $request->validate([
                'game_id' => 'required|integer|exists:games,id',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
            ]);

            $game = Game::findOrFail($validated['game_id']);
            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $gameId = $validated['game_id'];

            // Verify player IDs match game
            if ($game->player1_user_id !== $player1->id || 
                $game->player2_user_id !== $player2->id) {
                throw new \Exception('Player IDs do not match game participants');
            }

            // Verify requesting user is a participant (skip for internal API calls)
            if ($user && !in_array($user->id, [$player1->id, $player2->id], true)) {
                throw new \Exception('You are not a participant of this game');
            }

            // Verify game is actually a draw
            if (!$game->is_draw) {
                throw new \Exception('Game is not a draw');
            }

            // Verify game is completed
            if ($game->status !== 'completed') {
                throw new \Exception('Game is not completed');
            }

            // Prevent replay
            if ($game->refund_issued) {
                throw new \Exception('Refund already issued for this game');
            }

            // Refund both players
            $transaction1 = $this->transactionService->refundGameDraw($player1, $gameId);
            $transaction2 = $this->transactionService->refundGameDraw($player2, $gameId);

            // Mark refund as issued
            $game->refund_issued = true;
            $game->save();

            Log::info('Game draw refunded', [
                'game_id' => $gameId,
                'player1' => $player1->id,
                'player2' => $player2->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Game draw refunded successfully',
                'transactions' => [
                    'player1' => $transaction1,
                    'player2' => $transaction2,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to refund game draw', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
