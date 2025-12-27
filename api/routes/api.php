<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StatisticsController;



Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);
    
    // Coins transactions
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions', [TransactionController::class, 'index']);


    // Persistence routes for WebSocket server (no auth required for internal calls)
    Route::post('/games/persist', [GameController::class, 'persist']);
    Route::post('/matches/persist', [MatchController::class, 'persist']);
    
    // Match routes with auth
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}', [MatchController::class, 'show']);
});

Route::get('/statistics', [StatisticsController::class, 'index']);

Route::apiResource('games', GameController::class);
