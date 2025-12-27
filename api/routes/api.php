<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;



Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);
});

Route::apiResource('games', GameController::class);

// Persistence routes for WebSocket server (no auth required for internal calls)
Route::post('/games/persist', [GameController::class, 'persist']);
Route::post('/matches/persist', [MatchController::class, 'persist']);

// Match routes with auth
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}', [MatchController::class, 'show']);
});
