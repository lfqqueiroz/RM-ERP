<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleStoreRequest;
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
        $this->saveSale($request);

        $this->toast('Venda registrada com sucesso.');

        return back();
    }

    public function update(SaleStoreRequest $request, Sale $sale): RedirectResponse
    {
        $this->saveSale($request, $sale);

        $this->toast('Venda atualizada com sucesso.');

        return back();
    }

    private function saveSale(SaleStoreRequest $request, ?Sale $sale = null): void
    {
        $items = $request->items()
            ->groupBy('product_id')
            ->map(fn ($items) => [
                'quantity' => $items->sum('quantity'),
                'price_calculation_id' => $items->first()['price_calculation_id'],
            ]);

        $products = Product::query()
            ->whereKey($items->keys())
            ->get()
            ->keyBy('id');
        $priceCalculations = PriceCalculation::query()
            ->whereKey($items->pluck('price_calculation_id'))
            ->get()
            ->keyBy('id');

        DB::transaction(function () use ($items, $products, $priceCalculations, $request, $sale): void {
            if ($sale) {
                $sale->update([
                    'customer_name' => $request->validated('customer_name'),
                    'customer_phone' => $request->validated('customer_phone'),
                    'total_amount' => 0,
                ]);
                $sale->items()->delete();
            } else {
                $sale = Sale::create([
                    'customer_name' => $request->validated('customer_name'),
                    'customer_phone' => $request->validated('customer_phone'),
                    'total_amount' => 0,
                ]);
            }
            $totalAmountCents = 0;

            foreach ($items as $productId => $item) {
                $product = $products->get($productId);
                $priceCalculation = $priceCalculations->get($item['price_calculation_id']);
                $itemTotalCents = Money::toCents($priceCalculation->final_price) * $item['quantity'];

                $sale->items()->create([
                    'product_id' => $product->id,
                    'price_calculation_id' => $priceCalculation->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $priceCalculation->final_price,
                    'total_amount' => Money::fromCents($itemTotalCents),
                ]);

                $totalAmountCents += $itemTotalCents;
            }

            $sale->update(['total_amount' => Money::fromCents($totalAmountCents)]);
        });
    }
}
