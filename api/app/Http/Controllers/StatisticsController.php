<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function index()
    {
        // 1. Top players by coins (this column EXISTS in the USERS table)
        $totalCoins = User::where('type', 'P') // Players only
            ->orderBy('coins_balance', 'desc') //
            ->take(10)
            ->get(['id', 'nickname', 'coins_balance', 'photo_filename']);

        // 2. Top players by victories (column does NOT exist, we have to count)
        $totalVictories = User::where('type', 'P')
            // 'gamesWon as total_victories' creates a virtual column with the count
            ->withCount(['gamesWon as total_victories']) 
            ->orderBy('total_victories', 'desc')
            ->take(10)
            ->get(['id', 'nickname', 'photo_filename']); // We don't need to select total_victories here, withCount already adds it

        return response()->json([
            'top_coins' => $totalCoins,
            'top_victories' => $totalVictories
        ]);
    }
}