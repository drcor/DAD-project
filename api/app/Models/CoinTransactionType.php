<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinTransactionType extends Model
{
    use HasFactory;

    protected $table = 'coin_transaction_types';
    
    public $timestamps = false; 
}