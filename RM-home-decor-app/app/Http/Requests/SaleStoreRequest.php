<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;

class SaleStoreRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price_calculation_id' => ['required', 'integer', 'exists:price_calculations,id'],
        ];
    }

    /**
     * Itens validados, com IDs e quantidade normalizados para inteiro.
     *
     * @return Collection<int, array{product_id: int, quantity: int, price_calculation_id: int}>
     */
    public function items(): Collection
    {
        $items = $this->validated('items');

        return collect(is_array($items) ? $items : [])
            ->values()
            ->map(fn (mixed $item): array => [
                'product_id' => (int) $item['product_id'],
                'quantity' => (int) $item['quantity'],
                'price_calculation_id' => (int) $item['price_calculation_id'],
            ]);
    }
}
