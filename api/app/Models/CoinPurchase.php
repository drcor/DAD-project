<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    use HasFactory;

    public $timestamps = false; 

    protected $fillable = [
        'purchase_datetime', 
        'user_id',
        'coin_transaction_id',
        'euros',
        'payment_type',
        'payment_reference',
        'custom'
    ];

    protected $casts = [
        'purchase_datetime' => 'datetime',
        'euros' => 'decimal:2',
        'payment_reference' => 'encrypted',  // Encrypt sensitive payment data
        'custom' => 'array'
    ];
}