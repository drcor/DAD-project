<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinTransaction extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'transaction_datetime',
        'user_id',
        'match_id',
        'game_id',
        'coin_transaction_type_id',
        'coins',
        'custom',
    ];

    protected $casts = [
        'transaction_datetime' => 'datetime',
        'coins' => 'integer',
        'custom' => 'array',
    ];

    /**
     * Get the user that owns the transaction
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the match associated with the transaction
     */
    public function match()
    {
        return $this->belongsTo(Match::class);
    }

    /**
     * Get the game associated with the transaction
     */
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Get the transaction type
     */
    public function transactionType()
    {
        return $this->belongsTo(CoinTransactionType::class, 'coin_transaction_type_id');
    }

    /**
     * Get the coin purchase associated with this transaction (if any)
     */
    public function purchase()
    {
        return $this->hasOne(CoinPurchase::class, 'coin_transaction_id');
    }
}
