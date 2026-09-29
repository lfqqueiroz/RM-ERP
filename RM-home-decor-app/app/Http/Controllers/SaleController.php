<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleStoreRequest;
use App\Models\Product;
use App\Models\PriceCalculation;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('sales/index', [
            'sales' => Sale::query()
                ->with('items')
                ->latest()
                ->get(),
            'products' => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'sku']),
            'priceCalculations' => PriceCalculation::query()
                ->latest()
                ->get(['id', 'product_id', 'final_price']),
        ]);
    }

    public function store(SaleStoreRequest $request): RedirectResponse
    {
        $this->saveSale($request);

        return back()->with('success', 'Venda registrada com sucesso.');
    }

    public function update(SaleStoreRequest $request, Sale $sale): RedirectResponse
    {
        $this->saveSale($request, $sale);

        return back()->with('success', 'Venda atualizada com sucesso.');
    }

    private function saveSale(SaleStoreRequest $request, ?Sale $sale = null): void
    {
        $items = collect($request->validated('items'))
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

        foreach ($items as $productId => $item) {
            $priceCalculation = $priceCalculations->get($item['price_calculation_id']);

            if (! $priceCalculation || $priceCalculation->product_id !== (int) $productId) {
                throw ValidationException::withMessages([
                    'items' => 'Selecione um preço salvo que pertença ao produto escolhido.',
                ]);
            }
        }

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
            $totalAmount = 0;

            foreach ($items as $productId => $item) {
                $product = $products->get($productId);
                $priceCalculation = $priceCalculations->get($item['price_calculation_id']);
                $itemTotal = round(
                    (float) $priceCalculation->final_price * $item['quantity'],
                    2,
                );

                $sale->items()->create([
                    'product_id' => $product->id,
                    'price_calculation_id' => $priceCalculation->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $priceCalculation->final_price,
                    'total_amount' => $itemTotal,
                ]);

                $totalAmount += $itemTotal;
            }

            $sale->update(['total_amount' => $totalAmount]);
        });

    }
}
