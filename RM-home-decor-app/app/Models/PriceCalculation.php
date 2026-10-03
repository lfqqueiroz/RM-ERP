<?php

namespace App\Models;

use App\Support\Money;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
 * @property-read Product|null $product
 * @property-read ExpenseRecord|null $expenseRecord
 * @property-read bool $is_outdated
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

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ExpenseRecord, $this>
     */
    public function expenseRecord(): BelongsTo
    {
        return $this->belongsTo(ExpenseRecord::class);
    }

    /**
     * Indica se o custo do produto ou o custo da viagem mudou desde que o
     * cálculo foi salvo. Produto ou registro excluídos não contam.
     *
     * Carregue `product` e `expenseRecord` antes (eager loading) ou passe o
     * produto já carregado, para não gerar uma consulta por cálculo.
     */
    public function hasOutdatedCosts(?Product $product = null): bool
    {
        $product ??= $this->product;
        $expenseRecord = $this->expenseRecord;

        return ($product !== null
                && Money::toCents($product->cost_price) !== Money::toCents($this->product_cost))
            || ($expenseRecord !== null
                && Money::toCents($expenseRecord->cost_per_product) !== Money::toCents($this->trip_cost_per_product));
    }

    /**
     * @return Attribute<bool, never>
     */
    protected function isOutdated(): Attribute
    {
        return Attribute::get(fn (): bool => $this->hasOutdatedCosts());
    }
}
