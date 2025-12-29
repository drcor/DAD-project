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
        
        if ($apiKey && $expectedKey && $apiKey === $expectedKey) {
            Log::info('[Auth] Internal API key authenticated successfully (Match)');
            return true;
        }

        // Check for user authentication
        $user = $request->user();
        if ($user) {
            Log::info('[Auth] User authenticated (Match)', ['user_id' => $user->id]);
            return true;
        }

        Log::error('[Auth] Authentication failed (Match)');
        throw new \Exception('Authentication required');
    }

    /**
     * Deduct match stake from both players
     * POST /api/matches/transactions/stake
     */
    public function deductStake(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);
            $user = $request->user(); // May be null for internal API calls

            $validated = $request->validate([
                'match_id' => 'required|integer|exists:matches,id',
                'player1_id' => 'required|integer|exists:users,id',
                'player2_id' => 'required|integer|exists:users,id',
                'stake' => 'required|integer|min:3|max:100',
            ]);

            $match = Match::findOrFail($validated['match_id']);
            $player1 = User::findOrFail($validated['player1_id']);
            $player2 = User::findOrFail($validated['player2_id']);
            $matchId = $validated['match_id'];
            $stake = $validated['stake'];

            // Verify player IDs match match
            if ($match->player1_user_id !== $player1->id || 
                $match->player2_user_id !== $player2->id) {
                throw new \Exception('Player IDs do not match match participants');
            }

            // Verify requesting user is a participant (skip for internal API calls)
            if ($user && !in_array($user->id, [$player1->id, $player2->id], true)) {
                throw new \Exception('You are not a participant of this match');
            }

            // Prevent replay
            if ($match->stakes_deducted) {
                throw new \Exception('Stakes already deducted for this match');
            }

            // Verify stake matches server-side agreement (if stored)
            if (isset($match->stake) && $match->stake !== $stake) {
                throw new \Exception('Stake does not match agreed amount');
            }

            // Deduct stake from both players
            $transaction1 = $this->transactionService->deductMatchStake($player1, $stake, $matchId);
            $transaction2 = $this->transactionService->deductMatchStake($player2, $stake, $matchId);

            // Mark stakes as deducted
            $match->stakes_deducted = true;
            $match->save();

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
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);
            $user = $request->user(); // May be null for internal API calls

            $validated = $request->validate([
                'match_id' => 'required|integer|exists:matches,id',
                'winner_id' => 'required|integer|exists:users,id',
                'total_stake' => 'required|integer|min:6|max:200',
            ]);

            $match = Match::findOrFail($validated['match_id']);
            $winner = User::findOrFail($validated['winner_id']);
            $matchId = $validated['match_id'];
            $totalStake = $validated['total_stake'];

            // Verify winner is a participant
            if (!in_array($winner->id, [$match->player1_user_id, $match->player2_user_id], true)) {
                throw new \Exception('Winner is not a participant of this match');
            }

            // Verify requesting user is a participant (skip for internal API calls)
            if ($user && !in_array($user->id, [$match->player1_user_id, $match->player2_user_id], true)) {
                throw new \Exception('You are not a participant of this match');
            }

            // Verify match is completed
            if ($match->status !== 'completed') {
                throw new \Exception('Match is not completed');
            }

            // Prevent replay
            if ($match->payout_awarded) {
                throw new \Exception('Payout already awarded for this match');
            }

            // Verify total stake matches server records
            $expectedStake = ($match->stake ?? 3) * 2; // stake per player * 2 players
            if ($totalStake !== $expectedStake) {
                throw new \Exception('Total stake does not match server records');
            }

            // Award payout to winner
            $transaction = $this->transactionService->awardMatchPayout($winner, $totalStake, $matchId);

            // Mark payout as awarded
            $match->payout_awarded = true;
            $match->winner_user_id = $winner->id;
            $match->save();

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
