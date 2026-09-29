<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_records', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->unsignedInteger('product_quantity');
            $table->decimal('fixed_expenses', 12, 2)->default(0);
            $table->decimal('gasoline', 12, 2)->default(0);
            $table->decimal('vehicle_maintenance', 12, 2)->default(0);
            $table->decimal('tolls', 12, 2)->default(0);
            $table->decimal('other_variable_expenses', 12, 2)->default(0);
            $table->decimal('total_cost', 12, 2);
            $table->decimal('cost_per_product', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expense_records');
    }
};
