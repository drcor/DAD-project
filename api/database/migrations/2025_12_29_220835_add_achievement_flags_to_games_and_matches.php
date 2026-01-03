<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add achievement flags to games table
        Schema::table('games', function (Blueprint $table) {
            // Capote: winner scored >= 91 points
            $table->boolean('is_capote')->default(false)->after('player2_points');
            
            // Bandeira: winner scored 120 points (clean sweep)
            $table->boolean('is_bandeira')->default(false)->after('is_capote');
            
            // Forfeit: game ended due to resignation/timeout
            $table->boolean('is_forfeit')->default(false)->after('is_bandeira');
            
            // Forfeit reason: 'resignation' or 'timeout'
            $table->enum('forfeit_reason', ['resignation', 'timeout'])->nullable()->after('is_forfeit');
        });

        // Add aggregate achievement counters to matches table
        Schema::table('matches', function (Blueprint $table) {
            // Player 1 achievements
            $table->integer('player1_capotes')->default(0)->after('player2_points');
            $table->integer('player1_bandeiras')->default(0)->after('player1_capotes');
            
            // Player 2 achievements
            $table->integer('player2_capotes')->default(0)->after('player1_bandeiras');
            $table->integer('player2_bandeiras')->default(0)->after('player2_capotes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn([
                'is_capote',
                'is_bandeira',
                'is_forfeit',
                'forfeit_reason'
            ]);
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn([
                'player1_capotes',
                'player1_bandeiras',
                'player2_capotes',
                'player2_bandeiras'
            ]);
        });
    }
};
