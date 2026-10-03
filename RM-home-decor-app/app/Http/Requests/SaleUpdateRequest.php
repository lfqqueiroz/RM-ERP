<?php

namespace App\Http\Requests;

use App\Models\PriceCalculation;
use App\Models\Sale;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Edição de pedido. Item com `id` e sem preço salvo mantém o que foi gravado
 * (produto, nome, SKU e preço unitário); só a quantidade pode mudar. Escolher
 * um preço salvo repreça o item. Item sem `id` é novo.
 */
class SaleUpdateRequest extends FormRequest
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
            'items.*.id' => ['nullable', 'integer', 'distinct'],
            'items.*.product_id' => ['nullable', 'required_without:items.*.id', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price_calculation_id' => ['nullable', 'required_without:items.*.id', 'integer', 'exists:price_calculations,id'],
        ];
    }

    /**
     * Regras que dependem dos itens já gravados no pedido.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $storedItems = $this->sale()->items()->get()->keyBy('id');
                $items = $this->items();
                $productIdByCalculation = PriceCalculation::query()
                    ->whereKey(array_filter(array_column($items, 'price_calculation_id')))
                    ->pluck('product_id', 'id');
                $productIds = [];

                foreach ($items as $index => $item) {
                    $storedItem = $item['id'] === null ? null : $storedItems->get($item['id']);

                    if ($item['id'] !== null && $storedItem === null) {
                        $validator->errors()->add("items.{$index}.id", 'Este item não pertence ao pedido.');

                        continue;
                    }

                    if ($storedItem !== null && $item['price_calculation_id'] === null) {
                        // Mantém o item gravado: o produto não pode ser trocado sem escolher um preço.
                        if ($item['product_id'] !== null && $item['product_id'] !== $storedItem->product_id) {
                            $validator->errors()->add(
                                "items.{$index}.price_calculation_id",
                                'Selecione um preço salvo para o novo produto.',
                            );
                        }

                        $productIds[$index] = $storedItem->product_id;

                        continue;
                    }

                    if ($item['product_id'] === null
                        || $productIdByCalculation->get($item['price_calculation_id']) !== $item['product_id']) {
                        $validator->errors()->add(
                            "items.{$index}.price_calculation_id",
                            'Selecione um preço salvo que pertença ao produto escolhido.',
                        );
                    }

                    $productIds[$index] = $item['product_id'];
                }

                $this->rejectRepeatedProducts($validator, $productIds);
            },
        ];
    }

    public function sale(): Sale
    {
        $sale = $this->route('sale');

        if (! $sale instanceof Sale) {
            abort(404);
        }

        return $sale;
    }

    /**
     * Itens enviados, com IDs e quantidade normalizados (vazio vira null).
     *
     * @return list<array{id: int|null, product_id: int|null, quantity: int, price_calculation_id: int|null}>
     */
    public function items(): array
    {
        $input = $this->input('items');
        $items = [];

        foreach (is_array($input) ? $input : [] as $item) {
            $items[] = [
                'id' => self::nullableInt($item['id'] ?? null),
                'product_id' => self::nullableInt($item['product_id'] ?? null),
                'quantity' => (int) ($item['quantity'] ?? 0),
                'price_calculation_id' => self::nullableInt($item['price_calculation_id'] ?? null),
            ];
        }

        return $items;
    }

    private static function nullableInt(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
    }

    /**
     * @param  array<int, int|null>  $productIds  produto efetivo de cada item (null = excluído)
     */
    private function rejectRepeatedProducts(Validator $validator, array $productIds): void
    {
        $seen = [];

        foreach ($productIds as $index => $productId) {
            if ($productId === null) {
                continue;
            }

            if (isset($seen[$productId])) {
                $validator->errors()->add("items.{$index}.product_id", 'Este produto já está no pedido.');
            }

            $seen[$productId] = true;
        }
    }
}
