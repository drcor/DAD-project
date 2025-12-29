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
        Schema::table('games', function (Blueprint $table) {
            $table->boolean('fees_deducted')->default(false)->after('custom');
            $table->boolean('payout_awarded')->default(false)->after('fees_deducted');
            $table->boolean('refund_issued')->default(false)->after('payout_awarded');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->boolean('stakes_deducted')->default(false)->after('custom');
            $table->boolean('payout_awarded')->default(false)->after('stakes_deducted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['fees_deducted', 'payout_awarded', 'refund_issued']);
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn(['stakes_deducted', 'payout_awarded']);
        });
    }
};
