<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\GameTransactionController;
use App\Http\Controllers\MatchTransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StatisticsController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Persistence routes for WebSocket server (no auth required for internal calls)
Route::post('/games/persist', [GameController::class, 'persist']);
Route::post('/matches/persist', [MatchController::class, 'persist']);

// Transaction routes for WebSocket server (no auth required for internal calls)
Route::post('/games/transactions/fee', [GameTransactionController::class, 'deductFee']);
Route::post('/games/transactions/payout', [GameTransactionController::class, 'awardPayout']);
Route::post('/games/transactions/refund', [GameTransactionController::class, 'refundDraw']);
Route::post('/matches/transactions/stake', [MatchTransactionController::class, 'deductStake']);
Route::post('/matches/transactions/payout', [MatchTransactionController::class, 'awardPayout']);

// Public statistics/leaderboards (no auth required - anyone can view)
Route::get('/statistics', [StatisticsController::class, 'index']);

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
    Route::post('logout', [AuthController::class, 'logout']);
    
    // Coins transactions
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    
    // Game routes with auth
    Route::get('/games', [GameController::class, 'index']);
    Route::get('/games/{id}', [GameController::class, 'show']);
    
    // Match routes with auth
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}', [MatchController::class, 'show']);
});
