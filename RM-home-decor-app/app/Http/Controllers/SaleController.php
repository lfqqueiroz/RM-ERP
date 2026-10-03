<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleStoreRequest;
use App\Http\Requests\SaleUpdateRequest;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Support\ListQuery;
use App\Support\Money;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $query = ListQuery::fromRequest($request);
        $sales = Sale::query()
            ->with('items')
            ->when($query->hasSearch(), fn (Builder $builder) => $builder->where(
                fn (Builder $where) => $where
                    ->where('customer_name', 'like', $query->likePattern())
                    ->orWhere('customer_phone', 'like', $query->likePattern())
                    ->orWhereHas('items', fn (Builder $items) => $items
                        ->where('product_name', 'like', $query->likePattern())),
            ))
            ->latest()
            ->orderByDesc('id')
            ->paginate(ListQuery::PER_PAGE, pageName: ListQuery::PAGE_NAME)
            ->withQueryString();

        if ($redirect = ListQuery::redirectIfPastLastPage($sales)) {
            return $redirect;
        }

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'filters' => $query->toArray(),
            'products' => fn () => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'sku']),
            'priceCalculations' => fn () => PriceCalculation::query()
                ->latest()
                ->get(['id', 'product_id', 'final_price']),
        ]);
    }

    public function store(SaleStoreRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $sale = Sale::create([
                'customer_name' => $request->validated('customer_name'),
                'customer_phone' => $request->validated('customer_phone'),
                'total_amount' => 0,
            ]);
            $totalCents = 0;

            foreach ($request->items() as $item) {
                $attributes = $this->pricedItem($item['product_id'], $item['price_calculation_id'], $item['quantity']);
                $sale->items()->create($attributes);
                $totalCents += Money::toCents($attributes['total_amount']);
            }

            $sale->update(['total_amount' => Money::fromCents($totalCents)]);
        });

        $this->toast('Venda registrada com sucesso.');

        return back();
    }

    /**
     * Itens existentes sem preço escolhido mantêm o que foi gravado (só a
     * quantidade muda); com preço escolhido são repreçados; itens novos são
     * criados e os ausentes, removidos. Nada aqui altera o estoque.
     */
    public function update(SaleUpdateRequest $request, Sale $sale): RedirectResponse
    {
        DB::transaction(function () use ($request, $sale): void {
            $sale->update([
                'customer_name' => $request->validated('customer_name'),
                'customer_phone' => $request->validated('customer_phone'),
            ]);
            $storedItems = $sale->items()->get()->keyBy('id');
            $keptItemIds = [];
            $totalCents = 0;

            foreach ($request->items() as $item) {
                $saleItem = $item['id'] === null ? null : $storedItems->get($item['id']);

                if ($saleItem !== null && $item['price_calculation_id'] === null) {
                    $lineCents = Money::toCents($saleItem->unit_price) * $item['quantity'];
                    $saleItem->update([
                        'quantity' => $item['quantity'],
                        'total_amount' => Money::fromCents($lineCents),
                    ]);
                } else {
                    // O SaleUpdateRequest garante produto e preço salvo para itens repreçados ou novos.
                    $attributes = $this->pricedItem(
                        (int) $item['product_id'],
                        (int) $item['price_calculation_id'],
                        $item['quantity'],
                    );
                    $saleItem === null
                        ? $saleItem = $sale->items()->create($attributes)
                        : $saleItem->update($attributes);
                    $lineCents = Money::toCents($attributes['total_amount']);
                }

                $keptItemIds[] = $saleItem->id;
                $totalCents += $lineCents;
            }

            $sale->items()->whereKeyNot($keptItemIds)->delete();
            $sale->update(['total_amount' => Money::fromCents($totalCents)]);
        });

        $this->toast('Venda atualizada com sucesso.');

        return back();
    }

    /**
     * Item com o preço atual do cálculo e o snapshot atual do produto.
     *
     * @return array{product_id: int, price_calculation_id: int, product_name: string, product_sku: string, quantity: int, unit_price: string, total_amount: string}
     */
    private function pricedItem(int $productId, int $priceCalculationId, int $quantity): array
    {
        $product = Product::findOrFail($productId);
        $priceCalculation = PriceCalculation::findOrFail($priceCalculationId);

        return [
            'product_id' => $product->id,
            'price_calculation_id' => $priceCalculation->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => $quantity,
            'unit_price' => $priceCalculation->final_price,
            'total_amount' => Money::fromCents(Money::toCents($priceCalculation->final_price) * $quantity),
        ];
    }
}
