<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Game;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function index()
    {
        // 1. Top players by coins
        $topCoins = User::where('type', 'P')
            ->orderBy('coins_balance', 'desc')
            ->orderBy('created_at', 'asc') // Tie-breaker: earlier user ranks higher
            ->take(10)
            ->get(['id', 'nickname', 'coins_balance', 'photo_avatar_filename', 'created_at']);

        // 2. Top players by game victories
        $topGameWins = User::where('type', 'P')
            ->withCount(['gamesWon as total_victories'])
            ->orderBy('total_victories', 'desc')
            ->orderBy('created_at', 'asc') // Tie-breaker
            ->take(10)
            ->get(['id', 'nickname', 'photo_avatar_filename', 'created_at']);

        // 3. Top players by match victories
        $topMatchWins = User::where('type', 'P')
            ->withCount(['matchesWon as total_match_wins'])
            ->orderBy('total_match_wins', 'desc')
            ->orderBy('created_at', 'asc') // Tie-breaker
            ->take(10)
            ->get(['id', 'nickname', 'photo_avatar_filename', 'created_at']);

        // 4. Top players by capotes
        $topCapotes = User::where('type', 'P')
            ->withCount(['gamesWon as total_capotes' => function($query) {
                $query->where('is_capote', true);
            }])
            ->orderBy('total_capotes', 'desc')
            ->orderBy('created_at', 'asc') // Tie-breaker
            ->take(10)
            ->get(['id', 'nickname', 'photo_avatar_filename', 'created_at']);

        // 5. Top players by bandeiras
        $topBandeiras = User::where('type', 'P')
            ->withCount(['gamesWon as total_bandeiras' => function($query) {
                $query->where('is_bandeira', true);
            }])
            ->orderBy('total_bandeiras', 'desc')
            ->orderBy('created_at', 'asc') // Tie-breaker
            ->take(10)
            ->get(['id', 'nickname', 'photo_avatar_filename', 'created_at']);

        return response()->json([
            'top_coins' => $topCoins,
            'top_game_wins' => $topGameWins,
            'top_match_wins' => $topMatchWins,
            'top_capotes' => $topCapotes,
            'top_bandeiras' => $topBandeiras,
        ]);
    }

    /**
     * Get public activity timeline for charts (no auth required - anonymized data)
     */
    public function timeline(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = now()->subDays($days)->startOfDay();

        // Games played timeline (public data) - use began_at instead of created_at
        $gamesTimeline = Game::selectRaw("DATE(began_at) as date, COUNT(*) as count")
            ->where('began_at', '>=', $startDate)
            ->whereNotNull('began_at')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'games_played' => $gamesTimeline,
        ]);
    }
}