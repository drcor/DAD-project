<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinTransactionType extends Model
{
    use HasFactory;

    protected $table = 'coin_transaction_types';
    
    public $timestamps = false;
    
    // Transaction type constants - must match database seeder values
    const BONUS = 1;
    const COIN_PURCHASE = 2;
    const GAME_FEE = 3;
    const MATCH_STAKE = 4;
    const GAME_PAYOUT = 5;
    const MATCH_PAYOUT = 6;
}
