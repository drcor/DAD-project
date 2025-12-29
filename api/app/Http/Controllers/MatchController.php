<?php

namespace App\Http\Controllers;

use App\Models\GameMatch;
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
            Log::info('[Auth] Internal API key authenticated successfully (Match Persist)');
            return true;
        }

        // Check for user authentication
        $user = $request->user();
        if ($user) {
            Log::info('[Auth] User authenticated (Match Persist)', ['user_id' => $user->id]);
            return true;
        }

        Log::error('[Auth] Authentication failed (Match Persist)');
        throw new \Exception('Authentication required');
    }

    /**
     * Persist a match from WebSocket server
     * 
     * POST /api/matches/persist
     */
    public function persist(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);

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
        $query = GameMatch::with(['player1', 'player2', 'winner']);

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
        $match = GameMatch::with(['player1', 'player2', 'winner', 'loser', 'games'])->findOrFail($id);
        return response()->json($match);
    }
}
