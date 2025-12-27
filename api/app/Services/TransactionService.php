<?php

namespace App\Services;

use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionService
{
    /**
     * Transaction type IDs (as seeded in migration)
     */
    const TYPE_BONUS = 1;           // Credit
    const TYPE_COIN_PURCHASE = 2;   // Credit
    const TYPE_GAME_FEE = 3;        // Debit
    const TYPE_MATCH_STAKE = 4;     // Debit
    const TYPE_GAME_PAYOUT = 5;     // Credit
    const TYPE_MATCH_PAYOUT = 6;    // Credit

    /**
     * Give welcome bonus to a new user
     * 
     * @param User $user
     * @param int $coins Default 10 coins
     * @return CoinTransaction
     */
    public function giveWelcomeBonus(User $user, int $coins = 10): CoinTransaction
    {
        return DB::transaction(function () use ($user, $coins) {
            // Create the transaction record
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => self::TYPE_BONUS,
                'coins' => $coins,
                'custom' => ['reason' => 'Welcome bonus'],
            ]);

            // Update user's coin balance
            $user->increment('coins_balance', $coins);

            return $transaction;
        });
    }

    /**
     * Create a coin purchase transaction
     * 
     * @param User $user
     * @param float $euros Amount in euros
     * @param string $paymentType MBWAY, PAYPAL, IBAN, MB, VISA
     * @param string $paymentReference
     * @return array ['transaction' => CoinTransaction, 'purchase' => CoinPurchase]
     */
    public function createPurchase(
        User $user,
        float $euros,
        string $paymentType,
        string $paymentReference
    ): array {
        return DB::transaction(function () use ($user, $euros, $paymentType, $paymentReference) {
            // Calculate coins: €1 = 10 coins
            $coins = (int) ($euros * 10);

            // Create the transaction record
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'coin_transaction_type_id' => self::TYPE_COIN_PURCHASE,
                'coins' => $coins,
            ]);

            // Create the purchase record
            $purchase = \App\Models\CoinPurchase::create([
                'purchase_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros' => $euros,
                'payment_type' => $paymentType,
                'payment_reference' => $paymentReference,
            ]);

            // Update user's coin balance
            $user->increment('coins_balance', $coins);

            return [
                'transaction' => $transaction,
                'purchase' => $purchase,
            ];
        });
    }

    /**
     * Deduct game entry fee (2 coins)
     * 
     * @param User $user
     * @param int|null $gameId
     * @return CoinTransaction
     * @throws \Exception if insufficient balance
     */
    public function deductGameFee(User $user, ?int $gameId = null): CoinTransaction
    {
        $fee = 2;

        if ($user->coins_balance < $fee) {
            throw new \Exception("Insufficient coins. Required: {$fee}, Available: {$user->coins_balance}");
        }

        return DB::transaction(function () use ($user, $gameId, $fee) {
            // Create the transaction record (negative amount for debit)
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'game_id' => $gameId,
                'coin_transaction_type_id' => self::TYPE_GAME_FEE,
                'coins' => -$fee,
            ]);

            // Update user's coin balance
            $user->decrement('coins_balance', $fee);

            return $transaction;
        });
    }

    /**
     * Deduct match stake (3-100 coins)
     * 
     * @param User $user
     * @param int $stake Amount to stake
     * @param int|null $matchId
     * @return CoinTransaction
     * @throws \Exception if insufficient balance or invalid stake
     */
    public function deductMatchStake(User $user, int $stake, ?int $matchId = null): CoinTransaction
    {
        if ($stake < 3 || $stake > 100) {
            throw new \Exception("Invalid stake amount. Must be between 3 and 100 coins.");
        }

        if ($user->coins_balance < $stake) {
            throw new \Exception("Insufficient coins. Required: {$stake}, Available: {$user->coins_balance}");
        }

        return DB::transaction(function () use ($user, $stake, $matchId) {
            // Create the transaction record (negative amount for debit)
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'match_id' => $matchId,
                'coin_transaction_type_id' => self::TYPE_MATCH_STAKE,
                'coins' => -$stake,
            ]);

            // Update user's coin balance
            $user->decrement('coins_balance', $stake);

            return $transaction;
        });
    }

    /**
     * Award game payout based on outcome
     * 
     * @param User $user
     * @param int $points Final points
     * @param int|null $gameId
     * @return CoinTransaction
     */
    public function awardGamePayout(User $user, int $points, ?int $gameId = null): CoinTransaction
    {
        // Determine payout based on points
        // Basic win (≥61): 3 coins
        // Capote (≥91): 4 coins
        // Bandeira (120): 6 coins
        $payout = 0;
        $outcome = '';

        if ($points == 120) {
            $payout = 6;
            $outcome = 'Bandeira';
        } elseif ($points >= 91) {
            $payout = 4;
            $outcome = 'Capote';
        } elseif ($points >= 61) {
            $payout = 3;
            $outcome = 'Basic win';
        }

        if ($payout === 0) {
            throw new \Exception("Invalid points for payout: {$points}");
        }

        return DB::transaction(function () use ($user, $payout, $gameId, $outcome) {
            // Create the transaction record
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'game_id' => $gameId,
                'coin_transaction_type_id' => self::TYPE_GAME_PAYOUT,
                'coins' => $payout,
                'custom' => ['outcome' => $outcome],
            ]);

            // Update user's coin balance
            $user->increment('coins_balance', $payout);

            return $transaction;
        });
    }

    /**
     * Refund game fee on draw (1 coin each player)
     * 
     * @param User $user
     * @param int|null $gameId
     * @return CoinTransaction
     */
    public function refundGameDraw(User $user, ?int $gameId = null): CoinTransaction
    {
        $refund = 1;

        return DB::transaction(function () use ($user, $refund, $gameId) {
            // Create the transaction record
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $user->id,
                'game_id' => $gameId,
                'coin_transaction_type_id' => self::TYPE_GAME_PAYOUT,
                'coins' => $refund,
                'custom' => ['outcome' => 'Draw refund'],
            ]);

            // Update user's coin balance
            $user->increment('coins_balance', $refund);

            return $transaction;
        });
    }

    /**
     * Award match payout to winner (combined stake - 1 coin commission)
     * 
     * @param User $winner
     * @param int $totalStake Combined stake from both players
     * @param int|null $matchId
     * @return CoinTransaction
     */
    public function awardMatchPayout(User $winner, int $totalStake, ?int $matchId = null): CoinTransaction
    {
        // Deduct 1 coin commission
        $payout = $totalStake - 1;

        return DB::transaction(function () use ($winner, $payout, $matchId) {
            // Create the transaction record
            $transaction = CoinTransaction::create([
                'transaction_datetime' => Carbon::now(),
                'user_id' => $winner->id,
                'match_id' => $matchId,
                'coin_transaction_type_id' => self::TYPE_MATCH_PAYOUT,
                'coins' => $payout,
                'custom' => ['commission_deducted' => 1],
            ]);

            // Update user's coin balance
            $winner->increment('coins_balance', $payout);

            return $transaction;
        });
    }

    /**
     * Get transaction history for a user
     * 
     * @param User $user
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getUserTransactionHistory(User $user, int $perPage = 20)
    {
        return CoinTransaction::where('user_id', $user->id)
            ->with(['transactionType', 'game', 'match', 'purchase'])
            ->orderBy('transaction_datetime', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get all transactions (admin only)
     * 
     * @param int $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAllTransactions(int $perPage = 20)
    {
        return CoinTransaction::with(['user', 'transactionType', 'game', 'match', 'purchase'])
            ->orderBy('transaction_datetime', 'desc')
            ->paginate($perPage);
    }
}
