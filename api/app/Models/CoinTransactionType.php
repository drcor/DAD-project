<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CoinTransactionType extends Model
{
    use HasFactory, SoftDeletes;

    public $timestamps = false;

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
