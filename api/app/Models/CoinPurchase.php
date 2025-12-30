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

    /**
     * Get the user that made the purchase
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the coin transaction associated with this purchase
     */
    public function coinTransaction()
    {
        return $this->belongsTo(CoinTransaction::class, 'coin_transaction_id');
    }
}
