<?php

namespace App\Http\Requests;

use App\Models\PriceCalculation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PriceCalculationStoreRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'expense_record_id' => ['required', 'integer', 'exists:expense_records,id'],
            'pricing_mode' => [
                'required',
                'string',
                Rule::in([
                    PriceCalculation::PRICING_MODE_MARGIN,
                    PriceCalculation::PRICING_MODE_MANUAL,
                ]),
            ],
            'profit_margin' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999.99',
                'required_if:pricing_mode,'.PriceCalculation::PRICING_MODE_MARGIN,
            ],
            'final_price' => [
                'nullable',
                'numeric',
                'min:0',
                'max:9999999999.99',
                'required_if:pricing_mode,'.PriceCalculation::PRICING_MODE_MANUAL,
            ],
        ];
    }
}
