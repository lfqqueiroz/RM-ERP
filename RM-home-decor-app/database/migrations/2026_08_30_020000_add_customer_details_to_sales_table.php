<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (! Schema::hasColumn('sales', 'customer_name')) {
                $table->string('customer_name')->default('Cliente não informado');
            }

            if (! Schema::hasColumn('sales', 'customer_phone')) {
                $table->string('customer_phone', 30)->default('Não informado');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'customer_name')) {
                $table->dropColumn('customer_name');
            }

            if (Schema::hasColumn('sales', 'customer_phone')) {
                $table->dropColumn('customer_phone');
            }
        });
    }
};
