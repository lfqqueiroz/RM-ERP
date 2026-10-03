<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductPriceCalculationUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // O preço salvo precisa ser do próprio produto da rota.
            'price_calculation_id' => [
                'nullable',
                'integer',
                Rule::exists('price_calculations', 'id')
                    ->where('product_id', $this->product()->id),
            ],
        ];
    }

    public function product(): Product
    {
        $product = $this->route('product');

        if (! $product instanceof Product) {
            abort(404);
        }

        return $product;
    }
}
