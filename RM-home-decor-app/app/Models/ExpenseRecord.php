<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $description
 * @property int $product_quantity
 * @property string $fixed_expenses
 * @property string $gasoline
 * @property string $vehicle_maintenance
 * @property string $tolls
 * @property string $other_variable_expenses
 * @property string $total_cost
 * @property string $cost_per_product
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
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
