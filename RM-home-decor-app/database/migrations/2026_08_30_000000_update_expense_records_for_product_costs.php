<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('expense_records', 'product_quantity')) {
            Schema::table('expense_records', function ($table) {
                $table->unsignedInteger('product_quantity')->default(1);
            });
        }

        if (! Schema::hasColumn('expense_records', 'cost_per_product')) {
            Schema::table('expense_records', function ($table) {
                $table->decimal('cost_per_product', 12, 2)->default(0);
            });
        }

        DB::table('expense_records')
            ->where('product_quantity', '<', 1)
            ->update(['product_quantity' => 1]);

        DB::table('expense_records')->update([
            'cost_per_product' => DB::raw('total_cost / product_quantity'),
        ]);

        Schema::table('expense_records', function ($table) {
            if (Schema::hasColumn('expense_records', 'acquisition_cost')) {
                $table->dropColumn('acquisition_cost');
            }

            if (Schema::hasColumn('expense_records', 'profit_margin')) {
                $table->dropColumn('profit_margin');
            }

            if (Schema::hasColumn('expense_records', 'suggested_price')) {
                $table->dropColumn('suggested_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('expense_records', function ($table) {
            if (! Schema::hasColumn('expense_records', 'acquisition_cost')) {
                $table->decimal('acquisition_cost', 12, 2)->default(0);
            }

            if (! Schema::hasColumn('expense_records', 'profit_margin')) {
                $table->decimal('profit_margin', 5, 2)->default(0);
            }

            if (! Schema::hasColumn('expense_records', 'suggested_price')) {
                $table->decimal('suggested_price', 12, 2)->default(0);
            }
        });

        DB::table('expense_records')->update([
            'suggested_price' => DB::raw('cost_per_product'),
        ]);

        Schema::table('expense_records', function ($table) {
            if (Schema::hasColumn('expense_records', 'cost_per_product')) {
                $table->dropColumn('cost_per_product');
            }

            if (Schema::hasColumn('expense_records', 'product_quantity')) {
                $table->dropColumn('product_quantity');
            }
        });
    }
};
