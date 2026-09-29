<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('expense_record_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('expense_record_description');
            $table->decimal('product_cost', 12, 2);
            $table->decimal('trip_cost_per_product', 12, 2);
            $table->decimal('profit_margin', 5, 2);
            $table->decimal('final_price', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_calculations');
    }
};
