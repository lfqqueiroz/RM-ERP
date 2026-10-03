<?php

namespace App\Http\Requests;

use App\Models\PriceCalculation;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Validator;

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
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price_calculation_id' => ['required', 'integer', 'exists:price_calculations,id'],
        ];
    }

    /**
     * Cada item deve usar um preço salvo do próprio produto.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $items = $this->input('items');

                // Só verifica a combinação depois que as regras básicas passaram.
                if ($validator->errors()->isNotEmpty() || ! is_array($items)) {
                    return;
                }

                $productIdByCalculation = PriceCalculation::query()
                    ->whereKey(array_column($items, 'price_calculation_id'))
                    ->pluck('product_id', 'id');

                foreach ($items as $index => $item) {
                    $calculationProductId = $productIdByCalculation->get((int) $item['price_calculation_id']);

                    if ($calculationProductId !== (int) $item['product_id']) {
                        $validator->errors()->add(
                            "items.{$index}.price_calculation_id",
                            'Selecione um preço salvo que pertença ao produto escolhido.',
                        );
                    }
                }
            },
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
