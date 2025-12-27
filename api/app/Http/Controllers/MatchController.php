<?php

namespace App\Http\Controllers;

use App\Models\Match as MatchModel;
use App\Services\GamePersistenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MatchController extends Controller
{
    protected $persistenceService;

    public function __construct(GamePersistenceService $persistenceService)
    {
        $this->persistenceService = $persistenceService;
    }

    /**
     * Persist a match from WebSocket server
     * 
     * POST /api/matches/persist
     */
    public function persist(Request $request)
    {
        try {
            $validated = $request->validate([
                'variant' => 'required|in:3,9',
                'player1' => 'required|integer',
                'player2' => 'required|integer',
                'player1Marks' => 'required|integer|min:0',
                'player2Marks' => 'required|integer|min:0',
                'player1TotalPoints' => 'nullable|integer|min:0',
                'player2TotalPoints' => 'nullable|integer|min:0',
                'matchWinner' => 'nullable|integer',
                'matchOver' => 'required|boolean',
                'matchId' => 'nullable|string',
                'dbMatchId' => 'nullable|integer',
                'beganAt' => 'nullable|date',
                'endedAt' => 'nullable|date',
                'currentGameNumber' => 'nullable|integer|min:1',
                'stake' => 'nullable|integer|min:1'
            ]);

            $match = $this->persistenceService->saveMatch($validated);

            if ($match) {
                return response()->json([
                    'success' => true,
                    'message' => 'Match persisted successfully',
                    'id' => $match->id
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to persist match'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Match persistence endpoint error:', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation or persistence error',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display a listing of matches
     */
    public function index(Request $request)
    {
        $query = MatchModel::with(['player1', 'player2', 'winner']);

        if ($request->has('user_id')) {
            $userId = $request->user_id;
            $query->where(function($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                  ->orWhere('player2_user_id', $userId);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $matches = $query->orderBy('began_at', 'desc')->paginate(15);

        return response()->json($matches);
    }

    /**
     * Display the specified match
     */
    public function show($id)
    {
        $match = MatchModel::with(['player1', 'player2', 'winner', 'loser', 'games'])->findOrFail($id);
        return response()->json($match);
    }
}
