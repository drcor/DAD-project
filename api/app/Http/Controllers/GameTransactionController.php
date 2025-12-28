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
     * Deduct game entry fee from both players
     * POST /api/games/transactions/fee
     */
    public function deductFee(Request $request)
    {
        try {
            $validated = $request->validate([
                'game_id' => 'required|integer',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
            ]);

            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $gameId = $validated['game_id'];

            // Deduct fee from both players
            $transaction1 = $this->transactionService->deductGameFee($player1, $gameId);
            $transaction2 = $this->transactionService->deductGameFee($player2, $gameId);

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
            $validated = $request->validate([
                'game_id' => 'required|integer',
                'winner_id' => 'required|integer|exists:users,id',
                'points' => 'required|integer|min:61|max:120',
            ]);

            $winner = User::findOrFail($validated['winner_id']);
            $gameId = $validated['game_id'];
            $points = $validated['points'];

            // Award payout to winner
            $transaction = $this->transactionService->awardGamePayout($winner, $points, $gameId);

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
            $validated = $request->validate([
                'game_id' => 'required|integer',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
            ]);

            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $gameId = $validated['game_id'];

            // Refund both players
            $transaction1 = $this->transactionService->refundGameDraw($player1, $gameId);
            $transaction2 = $this->transactionService->refundGameDraw($player2, $gameId);

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
