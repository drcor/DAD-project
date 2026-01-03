<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CoinTransaction;
use App\Models\Game;
use App\Models\GameMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /**
     * Validate and sanitize the 'days' parameter to prevent performance issues
     * 
     * @param Request $request
     * @param int $default Default value (default: 30)
     * @param int $min Minimum allowed value (default: 1)
     * @param int $max Maximum allowed value (default: 365)
     * @return int Validated days value
     */
    private function validateDaysParameter(Request $request, int $default = 30, int $min = 1, int $max = 365): int
    {
        $days = (int) $request->input('days', $default);
        
        // Ensure days is within a reasonable range to avoid performance issues
        if ($days < $min) {
            $days = $min;
        } elseif ($days > $max) {
            $days = $max;
        }
        
        return $days;
    }

    /**
     * Get all users (players and administrators)
     * Optimized to prevent N+1 query problems
     */
    public function getAllUsers(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        // Eager load relationship counts to prevent N+1 queries
        $query = User::withTrashed()
            ->withCount([
                'gamesAsPlayer1',
                'gamesAsPlayer2',
                'matchesAsPlayer1',
                'matchesAsPlayer2',
                'transactions',
                'gamesWon',
            ]);

        // Optional filters
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('blocked')) {
            $query->where('blocked', $request->blocked === 'true' || $request->blocked === '1');
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nickname', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $users = $query->orderBy('nickname')->paginate($perPage);

        // Enhance user data with pre-loaded statistics
        $enhancedUsers = $users->getCollection()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nickname' => $user->nickname,
                'type' => $user->type,
                'blocked' => $user->blocked,
                'coins_balance' => $user->coins_balance,
                'photo_avatar_filename' => $user->photo_avatar_filename,
                'photo_url' => $user->photo_url,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'deleted_at' => $user->deleted_at,
                // Statistics - using pre-loaded counts (no additional queries!)
                'statistics' => [
                    'total_games' => $user->games_as_player1_count + $user->games_as_player2_count,
                    'total_matches' => $user->matches_as_player1_count + $user->matches_as_player2_count,
                    'total_transactions' => $user->transactions_count,
                    'games_won' => $user->games_won_count,
                    'matches_won' => $user->games_won_count, // Approximation - games_won is typically match-based
                ],
            ];
        });

        return response()->json([
            'data' => $enhancedUsers,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    /**
     * Get a specific user's details with comprehensive statistics
     */
    public function getUser($userId)
    {
        if (!request()->user() || !request()->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $user = User::withTrashed()->find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Get comprehensive user statistics for admin view
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'nickname' => $user->nickname,
            'type' => $user->type,
            'blocked' => $user->blocked,
            'coins_balance' => $user->coins_balance,
            'photo_avatar_filename' => $user->photo_avatar_filename,
            'photo_url' => $user->photo_url,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'deleted_at' => $user->deleted_at,
            'custom' => $user->custom,
            
            // Detailed statistics
            'statistics' => [
                'games' => [
                    'total' => $user->gamesAsPlayer1()->count() + $user->gamesAsPlayer2()->count(),
                    'as_player1' => $user->gamesAsPlayer1()->count(),
                    'as_player2' => $user->gamesAsPlayer2()->count(),
                    'won' => $user->gamesWon()->count(),
                    'lost' => $user->gamesLost()->count(),
                ],
                'matches' => [
                    'total' => $user->matchesAsPlayer1()->count() + $user->matchesAsPlayer2()->count(),
                    'as_player1' => $user->matchesAsPlayer1()->count(),
                    'as_player2' => $user->matchesAsPlayer2()->count(),
                    'won' => $user->matchesWon()->count(),
                    'lost' => $user->matchesLost()->count(),
                ],
                'transactions' => [
                    'total_count' => $user->transactions()->count(),
                    'total_coins_earned' => $user->transactions()->where('coins', '>', 0)->sum('coins'),
                    'total_coins_spent' => abs($user->transactions()->where('coins', '<', 0)->sum('coins')),
                    'last_transaction' => $user->transactions()->orderBy('transaction_datetime', 'desc')->first(),
                ],
            ],
        ];

        return response()->json($userData);
    }

    /**
     * Block a player
     */
    public function blockUser(Request $request, $userId)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Cannot block administrator accounts.',
            ], 403);
        }

        $user->blocked = true;
        $user->save();

        return response()->json([
            'message' => 'User blocked successfully.',
            'user' => $user,
        ]);
    }

    /**
     * Unblock a player
     */
    public function unblockUser(Request $request, $userId)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        $user->blocked = false;
        $user->save();

        return response()->json([
            'message' => 'User unblocked successfully.',
            'user' => $user,
        ]);
    }

    /**
     * Create a new administrator account
     */
    public function createAdmin(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'nickname' => 'required|string|min:3|max:20|unique:users,nickname',
            'password' => 'required|string|min:3',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'nickname' => $validated['nickname'],
            'password' => Hash::make($validated['password']),
            'type' => 'A',
            'coins_balance' => 0,
            'blocked' => false,
        ]);

        return response()->json([
            'message' => 'Administrator account created successfully.',
            'user' => $admin,
        ], 201);
    }

    /**
     * Delete a user account (soft delete for players with activity, hard delete otherwise)
     */
    public function deleteUser($userId)
    {
        if (!request()->user() || !request()->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $currentUser = auth()->user();
        $user = User::withTrashed()->find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        // Cannot delete own account
        if ($user->id === $currentUser->id) {
            return response()->json([
                'message' => 'Administrators cannot delete their own accounts.',
            ], 403);
        }

        // Check if user has prior activity (games, matches, or transactions)
        $hasActivity = $user->gamesAsPlayer1()->exists() 
            || $user->gamesAsPlayer2()->exists()
            || $user->matchesAsPlayer1()->exists()
            || $user->matchesAsPlayer2()->exists()
            || $user->transactions()->exists();

        if ($hasActivity) {
            // Soft delete
            $user->delete();
            $deleteType = 'soft-deleted';
        } else {
            // Hard delete
            $user->forceDelete();
            $deleteType = 'permanently deleted';
        }

        return response()->json([
            'message' => "User account {$deleteType} successfully.",
            'delete_type' => $deleteType,
        ]);
    }

    /**
     * Get all transactions (read-only for admins)
     */
    public function getAllTransactions(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $query = CoinTransaction::with(['type', 'user:id,nickname,name,email,photo_avatar_filename']);

        // Optional user filter
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $query->orderBy('transaction_datetime', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    /**
     * Get transactions for a specific user
     */
    public function getUserTransactions(Request $request, $userId)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        $query = $user->transactions()
            ->with('type')
            ->orderBy('transaction_datetime', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'data' => $transactions->items(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'email' => $user->email,
                'coins_balance' => $user->coins_balance,
            ],
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    /**
     * Get platform statistics
     */
    public function getPlatformStatistics()
    {
        if (!request()->user() || !request()->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $stats = [
            'users' => [
                'total' => User::count(),
                'players' => User::where('type', 'P')->count(),
                'administrators' => User::where('type', 'A')->count(),
                'blocked' => User::where('blocked', true)->count(),
                'active' => User::where('blocked', false)->count(),
            ],
            'games' => [
                'total' => Game::count(),
                'completed' => Game::where('status', 'E')->count(),
                'in_progress' => Game::where('status', 'P')->count(),
            ],
            'matches' => [
                'total' => GameMatch::count(),
                'completed' => GameMatch::where('status', 'E')->count(),
                'in_progress' => GameMatch::where('status', 'P')->count(),
            ],
            'transactions' => [
                'total' => CoinTransaction::count(),
                'total_coins' => CoinTransaction::sum('coins'),
            ],
            'economy' => [
                'total_coins_in_circulation' => User::where('type', 'P')->sum('coins_balance'),
                'average_balance' => User::where('type', 'P')->avg('coins_balance'),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Get timeline statistics for charts (admin only)
     */
    public function getTimeline(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // User registrations timeline
        $userTimeline = User::selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Games played timeline - use began_at instead of created_at
        $gamesTimeline = Game::selectRaw("DATE(began_at) as date, COUNT(*) as count")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Matches played timeline - use began_at instead of created_at
        $matchesTimeline = GameMatch::selectRaw("DATE(began_at) as date, COUNT(*) as count")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Transactions timeline
        $transactionsTimeline = CoinTransaction::selectRaw("DATE(transaction_datetime) as date, COUNT(*) as count, SUM(coins) as total_coins")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Coin circulation timeline (daily snapshots would require a separate table in production)
        // For now, we'll calculate cumulative from transactions
        $runningTotal = User::where('type', 'P')->sum('coins_balance');
        
        return response()->json([
            'user_registrations' => $userTimeline,
            'games_played' => $gamesTimeline,
            'matches_played' => $matchesTimeline,
            'transactions' => $transactionsTimeline,
            'current_coin_circulation' => $runningTotal,
        ]);
    }

    /**
     * Get transactions breakdown by period (admin only)
     */
    public function getTransactionsByPeriod(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        $transactions = CoinTransaction::selectRaw("
                DATE(transaction_datetime) as period,
                COUNT(*) as count,
                SUM(coins) as total_coins,
                SUM(CASE WHEN coins > 0 THEN 1 ELSE 0 END) as earning_count,
                SUM(CASE WHEN coins < 0 THEN 1 ELSE 0 END) as spending_count,
                SUM(CASE WHEN coins > 0 THEN coins ELSE 0 END) as total_earned,
                SUM(CASE WHEN coins < 0 THEN ABS(coins) ELSE 0 END) as total_spent
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'transactions_by_period' => $transactions,
        ]);
    }

    /**
     * Get transactions breakdown by user (admin only)
     */
    public function getTransactionsByUser(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $limit = $request->input('limit', 20);
        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // Top spenders (most coins spent)
        $topSpenders = CoinTransaction::selectRaw("
                user_id,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN coins < 0 THEN ABS(coins) ELSE 0 END) as total_spent
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('user_id')
            ->having('total_spent', '>', 0)
            ->orderByDesc('total_spent')
            ->limit($limit)
            ->with('user:id,nickname,email,type')
            ->get();

        // Top earners (most coins earned)
        $topEarners = CoinTransaction::selectRaw("
                user_id,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN coins > 0 THEN coins ELSE 0 END) as total_earned
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('user_id')
            ->having('total_earned', '>', 0)
            ->orderByDesc('total_earned')
            ->limit($limit)
            ->with('user:id,nickname,email,type')
            ->get();

        // Most active (most transactions)
        $mostActive = CoinTransaction::selectRaw("
                user_id,
                COUNT(*) as transaction_count,
                SUM(coins) as net_balance
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('user_id')
            ->orderByDesc('transaction_count')
            ->limit($limit)
            ->with('user:id,nickname,email,type')
            ->get();

        return response()->json([
            'top_spenders' => $topSpenders,
            'top_earners' => $topEarners,
            'most_active' => $mostActive,
        ]);
    }

    /**
     * Get games breakdown by period (admin only)
     */
    public function getGamesByPeriod(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        $games = Game::selectRaw("
                DATE(began_at) as period,
                COUNT(*) as total_games,
                SUM(CASE WHEN status = 'E' THEN 1 ELSE 0 END) as completed_games,
                SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END) as in_progress_games,
                SUM(CASE WHEN status = 'Interrupted' THEN 1 ELSE 0 END) as interrupted_games,
                SUM(CASE WHEN is_capote = 1 THEN 1 ELSE 0 END) as capote_count,
                SUM(CASE WHEN is_bandeira = 1 THEN 1 ELSE 0 END) as bandeira_count,
                AVG(CASE WHEN total_time IS NOT NULL THEN total_time ELSE NULL END) as average_duration,
                SUM(CASE WHEN type = '3' THEN 1 ELSE 0 END) as bisca3_count,
                SUM(CASE WHEN type = '9' THEN 1 ELSE 0 END) as bisca9_count
            ")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'games_by_period' => $games,
        ]);
    }

    /**
     * Get matches breakdown by period (admin only)
     */
    public function getMatchesByPeriod(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        $matches = GameMatch::selectRaw("
                DATE(began_at) as period,
                COUNT(*) as total_matches,
                SUM(CASE WHEN status = 'E' THEN 1 ELSE 0 END) as completed_matches,
                SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END) as in_progress_matches,
                SUM(CASE WHEN status = 'Interrupted' THEN 1 ELSE 0 END) as interrupted_matches,
                AVG(CASE WHEN total_time IS NOT NULL THEN total_time ELSE NULL END) as average_duration,
                AVG(stake) as average_stake,
                SUM(CASE WHEN type = '3' THEN 1 ELSE 0 END) as bisca3_count,
                SUM(CASE WHEN type = '9' THEN 1 ELSE 0 END) as bisca9_count
            ")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'matches_by_period' => $matches,
        ]);
    }

    /**
     * Get user registrations breakdown by period (admin only)
     */
    public function getUserRegistrationsByPeriod(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        $registrations = User::selectRaw("
                DATE(created_at) as period,
                COUNT(*) as new_registrations,
                SUM(CASE WHEN type = 'P' THEN 1 ELSE 0 END) as new_players,
                SUM(CASE WHEN type = 'A' THEN 1 ELSE 0 END) as new_admins,
                SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted_count
            ")
            ->where('created_at', '>=', $startDate)
            ->groupBy('period')
            ->orderBy('period')
            ->withTrashed()
            ->get();

        // Calculate active users per period
        // Use UNION to avoid double-counting users who played as both player1 and player2
        $activeUsers = DB::select("
            SELECT period, COUNT(DISTINCT user_id) as active_users
            FROM (
                SELECT DATE(began_at) as period, player1_user_id as user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
                UNION
                SELECT DATE(began_at) as period, player2_user_id as user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
            ) AS user_periods
            GROUP BY period
            ORDER BY period
        ", [$startDate, $startDate]);

        return response()->json([
            'registrations_by_period' => $registrations,
            'active_users_by_period' => $activeUsers,
        ]);
    }

    /**
     * Get advanced engagement metrics (admin only)
     */
    public function getEngagementMetrics(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // Average games per user (active users only)
        $avgGamesPerUser = Game::selectRaw("
                COUNT(*) as total_games,
                COUNT(DISTINCT player1_user_id) + COUNT(DISTINCT player2_user_id) as total_participations
            ")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->first();

        $averageGamesPerUser = $avgGamesPerUser && $avgGamesPerUser->total_participations > 0
            ? $avgGamesPerUser->total_games / ($avgGamesPerUser->total_participations / 2)
            : 0;

        // Average matches per user (active users only)
        $avgMatchesPerUser = GameMatch::selectRaw("
                COUNT(*) as total_matches,
                COUNT(DISTINCT player1_user_id) + COUNT(DISTINCT player2_user_id) as total_participations
            ")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->first();

        $averageMatchesPerUser = $avgMatchesPerUser && $avgMatchesPerUser->total_participations > 0
            ? $avgMatchesPerUser->total_matches / ($avgMatchesPerUser->total_participations / 2)
            : 0;

        // DAU/WAU/MAU (Daily/Weekly/Monthly Active Users)
        // Use UNION to avoid double-counting users who played as both player1 and player2
        $dauStart = now()->subDay()->startOfDay();
        $dauQuery = DB::selectOne("
            SELECT COUNT(DISTINCT user_id) AS count
            FROM (
                SELECT player1_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
                UNION
                SELECT player2_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
            ) AS user_ids
        ", [$dauStart, $dauStart]);
        $dau = $dauQuery ? $dauQuery->count : 0;

        $wauStart = now()->subDays(7)->startOfDay();
        $wauQuery = DB::selectOne("
            SELECT COUNT(DISTINCT user_id) AS count
            FROM (
                SELECT player1_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
                UNION
                SELECT player2_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
            ) AS user_ids
        ", [$wauStart, $wauStart]);
        $wau = $wauQuery ? $wauQuery->count : 0;

        $mauStart = now()->subDays(30)->startOfDay();
        $mauQuery = DB::selectOne("
            SELECT COUNT(DISTINCT user_id) AS count
            FROM (
                SELECT player1_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
                UNION
                SELECT player2_user_id AS user_id
                FROM games
                WHERE began_at >= ? AND began_at IS NOT NULL
            ) AS user_ids
        ", [$mauStart, $mauStart]);
        $mau = $mauQuery ? $mauQuery->count : 0;

        // User retention rate (users who registered and played in the period)
        $newUsersCount = User::where('type', 'P')
            ->where('created_at', '>=', $startDate)
            ->count();

        $retainedUsersCount = User::where('type', 'P')
            ->where('created_at', '>=', $startDate)
            ->where(function ($query) use ($startDate) {
                $query->whereHas('gamesAsPlayer1', function ($gameQuery) use ($startDate) {
                    $gameQuery->where('began_at', '>=', $startDate);
                })->orWhereHas('gamesAsPlayer2', function ($gameQuery) use ($startDate) {
                    $gameQuery->where('began_at', '>=', $startDate);
                });
            })
            ->count();

        $retentionRate = $newUsersCount > 0 ? ($retainedUsersCount / $newUsersCount) * 100 : 0;

        return response()->json([
            'average_games_per_user' => round($averageGamesPerUser, 2),
            'average_matches_per_user' => round($averageMatchesPerUser, 2),
            'dau' => $dau,
            'wau' => $wau,
            'mau' => $mau,
            'retention_rate' => round($retentionRate, 2),
        ]);
    }

    /**
     * Get game performance metrics (admin only)
     */
    public function getGamePerformanceMetrics(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // Average game duration
        $avgDuration = Game::where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->whereNotNull('total_time')
            ->avg('total_time');

        // Game type popularity
        $gameTypeStats = Game::selectRaw("
                type,
                COUNT(*) as count,
                AVG(total_time) as avg_duration
            ")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('type')
            ->get();

        // Capote and Bandeira frequency
        $specialVictories = Game::selectRaw("
                SUM(CASE WHEN is_capote = 1 THEN 1 ELSE 0 END) as total_capotes,
                SUM(CASE WHEN is_bandeira = 1 THEN 1 ELSE 0 END) as total_bandeiras,
                COUNT(*) as total_completed_games
            ")
            ->where('began_at', '>=', $startDate)
            ->where('status', 'Ended')
            ->first();

        $capoteRate = $specialVictories && $specialVictories->total_completed_games > 0
            ? ($specialVictories->total_capotes / $specialVictories->total_completed_games) * 100
            : 0;

        $bandeiraRate = $specialVictories && $specialVictories->total_completed_games > 0
            ? ($specialVictories->total_bandeiras / $specialVictories->total_completed_games) * 100
            : 0;

        // Win rate distributions (per user) - Filter after loading to avoid HAVING issues with SQLite
        $winRates = User::where('type', 'P')
            ->withCount([
                'gamesWon' => function($query) use ($startDate) {
                    $query->where('began_at', '>=', $startDate);
                },
                'gamesAsPlayer1' => function($query) use ($startDate) {
                    $query->where('began_at', '>=', $startDate);
                },
                'gamesAsPlayer2' => function($query) use ($startDate) {
                    $query->where('began_at', '>=', $startDate);
                }
            ])
            ->get()
            ->filter(function($user) {
                // Only include users who played at least one game
                return ($user->games_as_player1_count + $user->games_as_player2_count) > 0;
            })
            ->map(function($user) {
                $totalGames = $user->games_as_player1_count + $user->games_as_player2_count;
                return [
                    'user_id' => $user->id,
                    'nickname' => $user->nickname,
                    'total_games' => $totalGames,
                    'wins' => $user->games_won_count,
                    'win_rate' => $totalGames > 0 ? ($user->games_won_count / $totalGames) * 100 : 0,
                ];
            })
            ->sortByDesc('win_rate')
            ->take(20)
            ->values();

        return response()->json([
            'average_game_duration' => round($avgDuration ?? 0, 2),
            'game_type_stats' => $gameTypeStats,
            'capote_frequency' => round($capoteRate, 2),
            'bandeira_frequency' => round($bandeiraRate, 2),
            'total_capotes' => $specialVictories->total_capotes ?? 0,
            'total_bandeiras' => $specialVictories->total_bandeiras ?? 0,
            'top_win_rates' => $winRates,
        ]);
    }

    /**
     * Get economy metrics (admin only)
     */
    public function getEconomyMetrics(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // Coin velocity (transactions per user per period)
        $activePlayers = User::where('type', 'P')
            ->whereHas('transactions', function($query) use ($startDate) {
                $query->where('transaction_datetime', '>=', $startDate);
            })
            ->count();

        $totalTransactions = CoinTransaction::where('transaction_datetime', '>=', $startDate)->count();
        $coinVelocity = $activePlayers > 0 ? $totalTransactions / $activePlayers : 0;

        // Purchase patterns (most common amounts)
        $purchasePatterns = CoinTransaction::selectRaw("
                ABS(coins) as amount,
                COUNT(*) as frequency
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('amount')
            ->orderByDesc('frequency')
            ->limit(10)
            ->get();

        // Spending vs earning ratios
        $spendingEarning = CoinTransaction::selectRaw("
                SUM(CASE WHEN coins < 0 THEN ABS(coins) ELSE 0 END) as total_spent,
                SUM(CASE WHEN coins > 0 THEN coins ELSE 0 END) as total_earned
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->first();

        $spendingEarningRatio = $spendingEarning && $spendingEarning->total_earned > 0
            ? ($spendingEarning->total_spent / $spendingEarning->total_earned) * 100
            : 0;

        // Wealth distribution (optimized with SQL aggregations)
        // Use SQL to calculate percentiles more efficiently
        $playerCount = User::where('type', 'P')->count();
        
        if ($playerCount > 0) {
            // Calculate percentile positions
            $p25_position = max(1, intval($playerCount * 0.25));
            $p50_position = max(1, intval($playerCount * 0.50));
            $p75_position = max(1, intval($playerCount * 0.75));
            $p90_position = max(1, intval($playerCount * 0.90));
            
            // Get min and max efficiently
            $minMax = User::where('type', 'P')
                ->selectRaw('MIN(coins_balance) as min, MAX(coins_balance) as max')
                ->first();
            
            // Get percentile values using LIMIT OFFSET
            $p25 = User::where('type', 'P')
                ->orderBy('coins_balance')
                ->offset($p25_position - 1)
                ->limit(1)
                ->value('coins_balance') ?? 0;
                
            $p50 = User::where('type', 'P')
                ->orderBy('coins_balance')
                ->offset($p50_position - 1)
                ->limit(1)
                ->value('coins_balance') ?? 0;
                
            $p75 = User::where('type', 'P')
                ->orderBy('coins_balance')
                ->offset($p75_position - 1)
                ->limit(1)
                ->value('coins_balance') ?? 0;
                
            $p90 = User::where('type', 'P')
                ->orderBy('coins_balance')
                ->offset($p90_position - 1)
                ->limit(1)
                ->value('coins_balance') ?? 0;
            
            $wealthDistribution = [
                'min' => $minMax->min ?? 0,
                'p25' => $p25,
                'p50' => $p50,
                'p75' => $p75,
                'p90' => $p90,
                'max' => $minMax->max ?? 0,
            ];
        } else {
            $wealthDistribution = [
                'min' => 0,
                'p25' => 0,
                'p50' => 0,
                'p75' => 0,
                'p90' => 0,
                'max' => 0,
            ];
        }

        return response()->json([
            'coin_velocity' => round($coinVelocity, 2),
            'purchase_patterns' => $purchasePatterns,
            'total_spent' => $spendingEarning->total_spent ?? 0,
            'total_earned' => $spendingEarning->total_earned ?? 0,
            'spending_earning_ratio' => round($spendingEarningRatio, 2),
            'wealth_distribution' => $wealthDistribution,
        ]);
    }

    /**
     * Get transaction type breakdown (admin only)
     */
    public function getTransactionTypeBreakdown(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }

        $days = $this->validateDaysParameter($request);
        $startDate = now()->subDays($days)->startOfDay();

        // Transactions by type with names
        $transactionsByType = CoinTransaction::selectRaw("
                coin_transaction_type_id,
                COUNT(*) as count,
                SUM(coins) as total_coins,
                AVG(coins) as average_coins
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('coin_transaction_type_id')
            ->with('type:id,name')
            ->get()
            ->map(function($transaction) {
                return [
                    'type_id' => $transaction->coin_transaction_type_id,
                    'type_name' => $transaction->type->name ?? 'Unknown',
                    'count' => $transaction->count,
                    'total_coins' => $transaction->total_coins,
                    'average_coins' => round($transaction->average_coins, 2),
                ];
            });

        // Transaction value distribution
        $valueDistribution = CoinTransaction::selectRaw("
                CASE 
                    WHEN ABS(coins) <= 5 THEN '0-5'
                    WHEN ABS(coins) <= 10 THEN '6-10'
                    WHEN ABS(coins) <= 20 THEN '11-20'
                    WHEN ABS(coins) <= 50 THEN '21-50'
                    WHEN ABS(coins) <= 100 THEN '51-100'
                    ELSE '100+'
                END as value_range,
                COUNT(*) as count
            ")
            ->where('transaction_datetime', '>=', $startDate)
            ->groupBy('value_range')
            ->get();

        return response()->json([
            'transactions_by_type' => $transactionsByType,
            'value_distribution' => $valueDistribution,
        ]);
    }
}
