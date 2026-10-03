<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $product_id
 * @property int|null $expense_record_id
 * @property string $product_name
 * @property string $expense_record_description
 * @property string $pricing_mode
 * @property string $product_cost
 * @property string $trip_cost_per_product
 * @property string|null $profit_margin
 * @property string $final_price
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class PriceCalculation extends Model
{
    /**
     * Preço por percentual sobre o custo base. Apesar do nome (mantido para
     * não exigir migration), `profit_margin` guarda um markup sobre o custo,
     * não a margem sobre a venda: final = base × (1 + profit_margin / 100).
     */
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
