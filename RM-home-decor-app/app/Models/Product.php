<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $sku
 * @property string $cost_price
 * @property string $sale_price
 * @property int|null $price_calculation_id
 * @property int $stock
 * @property int $minimum_stock
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Product extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'cost_price',
        'sale_price',
        'price_calculation_id',
        'stock',
        'minimum_stock',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'price_calculation_id' => 'integer',
            'stock' => 'integer',
            'minimum_stock' => 'integer',
        ];
    }
}
