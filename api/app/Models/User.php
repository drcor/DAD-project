<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Match as MatchModel;
use App\Models\Game;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'nickname',
        'type',
        'photo_avatar_filename',
        'coins_balance',
        'blocked',
        'custom',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'blocked' => 'boolean',
            'coins_balance' => 'integer',
            'custom' => 'array',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['photo_url'];

    /**
     * Check if user is an administrator
     */
    public function isAdmin(): bool
    {
        return $this->type === 'A';
    }

    /**
     * Check if user is a player
     */
    public function isPlayer(): bool
    {
        return $this->type === 'P';
    }

    /**
     * Get the photo URL accessor
     */
    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo_avatar_filename) {
            return null;
        }
        // Assumes photos are stored in storage/app/public/photos_avatars
        return url('storage/photos_avatars/' . $this->photo_avatar_filename);
    }

    /**
     * Games where this user is player 1
     */
    public function gamesAsPlayer1()
    {
        return $this->hasMany(Game::class, 'player1_user_id');
    }

    /**
     * Games where this user is player 2
     */
    public function gamesAsPlayer2()
    {
        return $this->hasMany(Game::class, 'player2_user_id');
    }

    /**
     * User transactions
     */
    public function transactions()
    {
        return $this->hasMany(CoinTransaction::class);
    }

    /**
     * Games where this user is the winner
     */
    public function gamesWon()
    {
        return $this->hasMany(Game::class, 'winner_user_id');
    }

    /**
     * Games where this user is the loser
     */
    public function gamesLost()
    {
        return $this->hasMany(Game::class, 'loser_user_id');
    }

    /**
     * Matches where this user is player 1
     */
    public function matchesAsPlayer1()
    {
        return $this->hasMany(MatchModel::class, 'player1_user_id');
    }

    /**
     * Matches where this user is player 2
     */
    public function matchesAsPlayer2()
    {
        return $this->hasMany(MatchModel::class, 'player2_user_id');
    }

    /**
     * Matches where this user is the winner
     */
    public function matchesWon()
    {
        return $this->hasMany(MatchModel::class, 'winner_user_id');
    }

    /**
     * Matches where this user is the loser
     */
    public function matchesLost()
    {
        return $this->hasMany(MatchModel::class, 'loser_user_id');
    }

    /**
     * All coin transactions for this user
     */
    public function coinTransactions()
    {
        return $this->hasMany(CoinTransaction::class, 'user_id');
    }

    /**
     * All coin purchases for this user
     */
    public function coinPurchases()
    {
        return $this->hasMany(CoinPurchase::class, 'user_id');
    }

    /**
     * Check if user can be hard deleted
     * User can only be hard deleted if they have no transactions or games
     */
    public function canBeHardDeleted(): bool
    {
        return $this->coinTransactions()->count() === 0 &&
               $this->gamesAsPlayer1()->count() === 0 &&
               $this->gamesAsPlayer2()->count() === 0 &&
               $this->matchesAsPlayer1()->count() === 0 &&
               $this->matchesAsPlayer2()->count() === 0;
    }
}
