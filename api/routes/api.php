<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile management
    Route::get('/profile', [UserController::class, 'show']);
    Route::put('/profile', [UserController::class, 'update']);
    Route::put('/profile/password', [UserController::class, 'updatePassword']);
    Route::post('/profile/photo', [UserController::class, 'uploadPhoto']);
    Route::delete('/profile/photo', [UserController::class, 'deletePhoto']);
    Route::delete('/profile', [UserController::class, 'destroy']);

    // Matches
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}', [MatchController::class, 'show']);
});

Route::apiResource('games', GameController::class);

// Persistence routes for WebSocket server (no auth required for internal calls)
Route::post('/games/persist', [GameController::class, 'persist']);
Route::post('/matches/persist', [MatchController::class, 'persist']);

