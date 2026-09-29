<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseRecord extends Model
{
    protected $fillable = [
        'description',
        'product_quantity',
        'fixed_expenses',
        'gasoline',
        'vehicle_maintenance',
        'tolls',
        'other_variable_expenses',
        'total_cost',
        'cost_per_product',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'product_quantity' => 'integer',
            'fixed_expenses' => 'decimal:2',
            'gasoline' => 'decimal:2',
            'vehicle_maintenance' => 'decimal:2',
            'tolls' => 'decimal:2',
            'other_variable_expenses' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'cost_per_product' => 'decimal:2',
        ];
    }
}
