<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinTransactionType extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'coin_transaction_types';
    
    public $timestamps = false;
    
    // Transaction type constants - must match database seeder values
    const BONUS = 1;
    const COIN_PURCHASE = 2;
    const GAME_FEE = 3;
    const MATCH_STAKE = 4;
    const GAME_PAYOUT = 5;
    const MATCH_PAYOUT = 6;

    protected $fillable = [
        'name',
        'type',
        'custom',
    ];

    protected $casts = [
        'custom' => 'array',
    ];

    /**
     * Check if this is a credit transaction type
     */
    public function isCredit(): bool
    {
        return $this->type === 'C';
    }

    /**
     * Check if this is a debit transaction type
     */
    public function isDebit(): bool
    {
        return $this->type === 'D';
    }

    /**
     * Get all transactions of this type
     */
    public function transactions()
    {
        return $this->hasMany(CoinTransaction::class, 'coin_transaction_type_id');
    }   
}
