<?php

namespace App\Http\Controllers;

use App\Models\Match;
use App\Models\User;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MatchTransactionController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Deduct match stake from both players
     * POST /api/matches/transactions/stake
     */
    public function deductStake(Request $request)
    {
        try {
            $validated = $request->validate([
                'match_id' => 'required|integer',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
                'stake' => 'required|integer|min:3|max:100',
            ]);

            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $matchId = $validated['match_id'];
            $stake = $validated['stake'];

            // Deduct stake from both players
            $transaction1 = $this->transactionService->deductMatchStake($player1, $stake, $matchId);
            $transaction2 = $this->transactionService->deductMatchStake($player2, $stake, $matchId);

            Log::info('Match stakes deducted', [
                'match_id' => $matchId,
                'player1' => $player1->id,
                'player2' => $player2->id,
                'stake' => $stake,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Match stakes deducted successfully',
                'transactions' => [
                    'player1' => $transaction1,
                    'player2' => $transaction2,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to deduct match stakes', [
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
     * Award match payout to winner (total stake minus 1 coin commission)
     * POST /api/matches/transactions/payout
     */
    public function awardPayout(Request $request)
    {
        try {
            $validated = $request->validate([
                'match_id' => 'required|integer',
                'winner_id' => 'required|integer|exists:users,id',
                'total_stake' => 'required|integer|min:6|max:200',
            ]);

            $winner = User::findOrFail($validated['winner_id']);
            $matchId = $validated['match_id'];
            $totalStake = $validated['total_stake'];

            // Award payout to winner
            $transaction = $this->transactionService->awardMatchPayout($winner, $totalStake, $matchId);

            Log::info('Match payout awarded', [
                'match_id' => $matchId,
                'winner' => $winner->id,
                'total_stake' => $totalStake,
                'payout' => $transaction->coins,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Match payout awarded successfully',
                'transaction' => $transaction,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to award match payout', [
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
