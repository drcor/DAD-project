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
        $user = $request->user();
        
        // Build query - players see their own matches, admins see all
        if ($user && $user->type === 'A') {
            // Admin sees all matches
            $query = GameMatch::query();
        } elseif ($user) {
            // Players see only their own matches
            $query = GameMatch::where(function($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            });
        } else {
            // Unauthenticated users cannot view matches
            return response()->json([
                'error' => 'Authentication required'
            ], 401);
        }

        // Include relationships
        $query->with(['player1', 'player2', 'winner', 'loser']);

        // Filtering
        if ($request->has('type') && in_array($request->type, ['3', '9'])) {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && in_array($request->status, ['Pending', 'Playing', 'Ended', 'Interrupted'])) {
            $query->where('status', $request->status);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'began_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = [
            'began_at',
            'ended_at',
            'total_time',
            'type',
            'status',
            'stake'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $matches = $query->paginate($perPage);

        return response()->json([
            'data' => $matches->items(),
            'meta' => [
                'current_page' => $matches->currentPage(),
                'last_page' => $matches->lastPage(),
                'per_page' => $matches->perPage(),
                'total' => $matches->total(),
            ]
        ]);
    }

    /**
     * Display the specified match
     */
    public function show(Request $request, $id)
    {
        $match = GameMatch::with(['player1', 'player2', 'winner', 'loser', 'games' => function($query) {
            $query->with(['player1', 'player2', 'winner', 'loser'])
                  ->orderBy('began_at', 'asc');
        }])->findOrFail($id);
        
        $user = $request->user();
        
        // Access control: only participants and admins can view details
        if ($user && $user->type !== 'A' && 
            $match->player1_user_id !== $user->id && 
            $match->player2_user_id !== $user->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }
        
        return response()->json([
            'data' => $match
        ]);
    }
}
