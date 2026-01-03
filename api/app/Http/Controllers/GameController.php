<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Services\GamePersistenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
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
        
        Log::info('[Auth] Checking game persist authentication', [
            'has_api_key_header' => !empty($apiKey),
            'has_expected_key' => !empty($expectedKey),
            'keys_match' => $apiKey === $expectedKey,
            'has_user_auth' => $request->user() !== null
        ]);
        
        if ($apiKey && $expectedKey && $apiKey === $expectedKey) {
            Log::info('[Auth] Internal API key authenticated successfully (Game Persist)');
            return true;
        }

        // Check for user authentication
        $user = $request->user();
        if ($user) {
            Log::info('[Auth] User authenticated (Game Persist)', ['user_id' => $user->id]);
            return true;
        }

        Log::error('[Auth] Authentication failed (Game Persist)');
        throw new \Exception('Authentication required');
    }

    /**
     * Persist a game from WebSocket server
     * 
     * POST /api/games/persist
     */
    public function persist(Request $request)
    {
        try {
            // Authenticate request (user or internal API key)
            $this->authenticateRequest($request);

            $validated = $request->validate([
                'variant' => 'required|in:3,9',
                'type' => 'required|in:standalone,match',
                'player1' => 'required|integer',
                'player2' => 'required|integer',
                'player1Points' => 'required|integer|min:0|max:120',
                'player2Points' => 'required|integer|min:0|max:120',
                'beganAt' => 'nullable|date',
                'endedAt' => 'nullable|date',
                'moves' => 'nullable|integer|min:0',
                'matchId' => 'nullable|integer',
                'resigned' => 'nullable|boolean',
                'timeout' => 'nullable|boolean'
            ]);

            $game = $this->persistenceService->saveGame($validated);

            if ($game) {
                return response()->json([
                    'success' => true,
                    'message' => 'Game persisted successfully',
                    'id' => $game->id
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to persist game'
            ], 500);

        } catch (\Exception $e) {
            Log::error('Game persistence endpoint error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation or persistence error'
            ], 400);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Build query - players see their own games, admins see all
        if ($user && $user->type === 'A') {
            // Admin sees all games
            $query = Game::query();
        } elseif ($user) {
            // Players see only their own games
            $query = Game::where(function($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            });
        } else {
            // Unauthenticated users cannot view games
            return response()->json([
                'error' => 'Authentication required'
            ], 401);
        }

        // Include relationships
        $query->with(['winner', 'loser', 'player1', 'player2', 'gameMatch']);

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
            'status'
        ];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $games = $query->paginate($perPage);

        return response()->json([
            'data' => $games->items(),
            'meta' => [
                'current_page' => $games->currentPage(),
                'last_page' => $games->lastPage(),
                'per_page' => $games->perPage(),
                'total' => $games->total()
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        $game = Game::with(['winner', 'loser', 'player1', 'player2', 'gameMatch'])->findOrFail($id);
        
        $user = $request->user();
        
        // Access control: only participants and admins can view details
        if ($user && $user->type !== 'A' && 
            $game->player1_user_id !== $user->id && 
            $game->player2_user_id !== $user->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }
        
        return response()->json([
            'data' => $game
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        //
    }
}
