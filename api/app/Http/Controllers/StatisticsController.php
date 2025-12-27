<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function index()
    {
        // 1. Top Jogadores por Moedas (Esta coluna EXISTE na tabela USERS)
        $totalCoins = User::where('type', 'P') // Apenas Jogadores
            ->orderBy('coins_balance', 'desc') //
            ->take(10)
            ->get(['id', 'nickname', 'coins_balance', 'photo_filename']);

        // 2. Top Jogadores por Vitórias (Coluna NÃO existe, temos de contar)
        $totalVictories = User::where('type', 'P')
            // 'gamesWon as total_victories' cria uma coluna virtual com a contagem
            ->withCount(['gamesWon as total_victories']) 
            ->orderBy('total_victories', 'desc')
            ->take(10)
            ->get(['id', 'nickname', 'photo_filename']); // Não precisamos de selecionar total_victories aqui, o withCount já o adiciona

        return response()->json([
            'top_coins' => $totalCoins,
            'top_victories' => $totalVictories
        ]);
    }
}