<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('price_calculations', function (Blueprint $table) {
            $table->string('pricing_mode', 20)
                ->default('margin')
                ->after('expense_record_description');
        });

        Schema::table('price_calculations', function (Blueprint $table) {
            $table->decimal('profit_margin', 5, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('price_calculations')
            ->whereNull('profit_margin')
            ->update(['profit_margin' => 0]);

        Schema::table('price_calculations', function (Blueprint $table) {
            $table->decimal('profit_margin', 5, 2)->nullable(false)->change();
        });

        Schema::table('price_calculations', function (Blueprint $table) {
            $table->dropColumn('pricing_mode');
        });
    }
};
