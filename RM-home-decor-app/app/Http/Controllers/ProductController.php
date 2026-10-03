<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductPriceCalculationUpdateRequest;
use App\Http\Requests\ProductStoreRequest;
use App\Http\Requests\ProductUpdateRequest;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Support\ListQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $query = ListQuery::fromRequest($request);
        $products = Product::query()
            ->with([
                'priceCalculation:id,expense_record_id,product_cost,trip_cost_per_product',
                'priceCalculation.expenseRecord:id,cost_per_product',
            ])
            ->when($query->hasSearch(), fn (Builder $builder) => $builder->where(
                fn (Builder $where) => $where
                    ->where('name', 'like', $query->likePattern())
                    ->orWhere('sku', 'like', $query->likePattern()),
            ))
            ->latest()
            ->orderByDesc('id')
            ->paginate(ListQuery::PER_PAGE, pageName: ListQuery::PAGE_NAME)
            ->withQueryString();

        if ($redirect = ListQuery::redirectIfPastLastPage($products)) {
            return $redirect;
        }

        $products->through(fn (Product $product) => $product
            ->makeHidden('priceCalculation')
            ->append('is_price_outdated'));

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => $query->toArray(),
            // Listas de apoio (selects): completas e enxutas; closures para não
            // serem recalculadas em recargas parciais da listagem.
            'productOptions' => fn () => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'stock']),
            'priceCalculations' => fn () => PriceCalculation::query()
                ->latest()
                ->get(['id', 'product_id', 'product_name', 'final_price', 'created_at']),
            'defaultMinimumStock' => Product::DEFAULT_MINIMUM_STOCK,
        ]);
    }

    public function store(ProductStoreRequest $request): RedirectResponse
    {
        Product::create($request->validated());

        return back()->with('success', 'Produto cadastrado com sucesso');
    }

    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        return back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Produto excluído com sucesso.');
    }

    public function updatePriceCalculation(ProductPriceCalculationUpdateRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $priceCalculationId = $data['price_calculation_id'] ?? null;

        if (! $priceCalculationId) {
            $product->update([
                'price_calculation_id' => null,
                'sale_price' => 0,
            ]);

            return back()->with('success', 'Preço salvo removido com sucesso.');
        }

        // O Form Request já garante que o cálculo é deste produto.
        $priceCalculation = PriceCalculation::findOrFail($request->integer('price_calculation_id'));

        $product->update([
            'price_calculation_id' => $priceCalculation->id,
            'sale_price' => $priceCalculation->final_price,
        ]);

        return back()->with('success', 'Preço salvo selecionado com sucesso.');
    }

    public function sell(Product $product): RedirectResponse
    {
        $sold = Product::query()
            ->whereKey($product->getKey())
            ->where('stock', '>', 0)
            ->decrement('stock');

        if ($sold === 0) {
            return back()->withErrors([
                'sale' => "O produto {$product->name} está com o estoque vazio.",
            ]);
        }

        return back()->with('success', 'Venda registrada com sucesso.');
    }
}
