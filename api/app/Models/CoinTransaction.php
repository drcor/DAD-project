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
        'coin_transaction_type_id',
        'coins',
        'game_id',
        'match_id',
        'custom'
    ];

    protected $casts = [
        'transaction_datetime' => 'datetime',
        'custom' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}