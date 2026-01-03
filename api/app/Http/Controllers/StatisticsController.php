<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StatisticsController extends Controller
{
    public function index()
    {
        // Cache leaderboards for 5 minutes to reduce database load
        return Cache::remember('public_statistics_leaderboards', 300, function () {
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

            return [
                'top_coins' => $topCoins,
                'top_game_wins' => $topGameWins,
                'top_match_wins' => $topMatchWins,
                'top_capotes' => $topCapotes,
                'top_bandeiras' => $topBandeiras,
            ];
        });
    }

    /**
     * Get public activity timeline for charts (no auth required - anonymized data)
     * Rate limited and with restricted date ranges to prevent abuse
     */
    public function timeline(Request $request)
    {
        // Validate and restrict date range to prevent abuse
        $validated = $request->validate([
            'days' => 'integer|min:1|max:365', // Maximum 1 year of data
        ]);

        $days = $validated['days'] ?? 30; // Default to 30 days
        
        // Cache timeline data for 5 minutes per day range to reduce database load
        return Cache::remember("public_statistics_timeline_{$days}", 300, function () use ($days) {
            $startDate = now()->subDays($days)->startOfDay();

            // Games played timeline (public data) - use began_at instead of created_at
            $gamesTimeline = Game::selectRaw("DATE(began_at) as date, COUNT(*) as count")
                ->where('began_at', '>=', $startDate)
                ->whereNotNull('began_at')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return [
                'games_played' => $gamesTimeline,
                'days' => $days,
                'start_date' => $startDate->toDateString(),
            ];
        });
    }
}