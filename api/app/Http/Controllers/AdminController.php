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
     * Check if the current user is an admin
     */
    private function checkAdminAccess(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Administrator access required.',
            ], 403);
        }
        return null;
    }

    /**
     * Get all users (players and administrators)
     */
    public function getAllUsers(Request $request)
    {
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
        }

        $query = User::withTrashed();

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

        // Enhance user data with statistics for admin view
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
                // Statistics
                'statistics' => [
                    'total_games' => $user->gamesAsPlayer1()->count() + $user->gamesAsPlayer2()->count(),
                    'total_matches' => $user->matchesAsPlayer1()->count() + $user->matchesAsPlayer2()->count(),
                    'total_transactions' => $user->transactions()->count(),
                    'games_won' => $user->gamesWon()->count(),
                    'matches_won' => Game::where('winner_user_id', $user->id)
                        ->distinct('match_id')
                        ->whereNotNull('match_id')
                        ->count(),
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
        if ($error = $this->checkAdminAccess(request())) {
            return $error;
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
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
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
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
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
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
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
        if ($error = $this->checkAdminAccess(request())) {
            return $error;
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
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
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
        if ($error = $this->checkAdminAccess($request)) {
            return $error;
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
        if ($error = $this->checkAdminAccess(request())) {
            return $error;
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
}
