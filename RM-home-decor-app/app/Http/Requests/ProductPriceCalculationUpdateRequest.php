<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductPriceCalculationUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'price_calculation_id' => ['nullable', 'integer', 'exists:price_calculations,id'],
        ];
    }
}
