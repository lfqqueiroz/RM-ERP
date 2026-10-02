<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
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
    /**
     * Limite usado no alerta de estoque quando o produto não tem estoque
     * mínimo configurado (minimum_stock = 0).
     */
    public const DEFAULT_MINIMUM_STOCK = 2;

    /**
     * Estoque mínimo efetivo em SQL: o configurado ou, se zero, o padrão.
     */
    public const EFFECTIVE_MINIMUM_STOCK_SQL = 'CASE WHEN minimum_stock > 0 THEN minimum_stock ELSE '.self::DEFAULT_MINIMUM_STOCK.' END';

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

    /**
     * Produtos com estoque no mínimo efetivo ou abaixo dele.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function lowStock(Builder $query): void
    {
        $query->whereRaw('stock <= '.self::EFFECTIVE_MINIMUM_STOCK_SQL);
    }
}
