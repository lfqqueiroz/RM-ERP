<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceCalculation extends Model
{
    public const PRICING_MODE_MARGIN = 'margin';

    public const PRICING_MODE_MANUAL = 'manual';

    protected $fillable = [
        'product_id',
        'expense_record_id',
        'product_name',
        'expense_record_description',
        'pricing_mode',
        'product_cost',
        'trip_cost_per_product',
        'profit_margin',
        'final_price',
    ];

    protected function casts(): array
    {
        return [
            'product_cost' => 'decimal:2',
            'trip_cost_per_product' => 'decimal:2',
            'profit_margin' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }
}
