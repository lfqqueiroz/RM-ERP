<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
