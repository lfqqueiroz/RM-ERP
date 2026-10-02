<?php

namespace App\Http\Controllers;

use App\Http\Requests\PriceCalculationStoreRequest;
use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PriceCalculationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('price-calculations/index', [
            'products' => Product::query()
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'cost_price', 'sale_price']),
            'expenseRecords' => ExpenseRecord::query()
                ->latest()
                ->get(['id', 'description', 'cost_per_product', 'created_at']),
            'priceCalculations' => PriceCalculation::query()
                ->latest()
                ->get(),
        ]);
    }

    public function store(PriceCalculationStoreRequest $request): RedirectResponse
    {
        $this->saveCalculation($request);

        return back()->with('success', 'Preço calculado e salvo com sucesso.');
    }

    public function update(PriceCalculationStoreRequest $request, PriceCalculation $priceCalculation): RedirectResponse
    {
        $this->saveCalculation($request, $priceCalculation);

        return back()->with('success', 'Preço salvo atualizado com sucesso.');
    }

    public function destroy(PriceCalculation $priceCalculation): RedirectResponse
    {
        DB::transaction(function () use ($priceCalculation): void {
            Product::query()
                ->where('price_calculation_id', $priceCalculation->id)
                ->update([
                    'price_calculation_id' => null,
                    'sale_price' => 0,
                ]);

            $priceCalculation->delete();
        });

        return back()->with('success', 'Preço salvo excluído com sucesso.');
    }

    private function saveCalculation(
        PriceCalculationStoreRequest $request,
        ?PriceCalculation $priceCalculation = null,
    ): void {
        $data = $request->validated();
        $product = Product::findOrFail($request->integer('product_id'));
        $expenseRecord = ExpenseRecord::findOrFail($request->integer('expense_record_id'));
        $productCostCents = Money::toCents($product->cost_price);
        $tripCostPerProductCents = Money::toCents($expenseRecord->cost_per_product);
        $pricingMode = $data['pricing_mode'];
        $isManualPrice = $pricingMode === PriceCalculation::PRICING_MODE_MANUAL;
        // A margem é gravada com duas casas; o preço usa exatamente o valor gravado.
        $profitMargin = $isManualPrice
            ? null
            : Money::fromCents(Money::toCents($data['profit_margin']));
        $finalPriceCents = $profitMargin === null
            ? Money::toCents($data['final_price'])
            : Money::applyPercent($productCostCents + $tripCostPerProductCents, $profitMargin);
        $productCost = Money::fromCents($productCostCents);
        $tripCostPerProduct = Money::fromCents($tripCostPerProductCents);
        $finalPrice = Money::fromCents($finalPriceCents);

        DB::transaction(function () use (
            $product,
            $expenseRecord,
            $productCost,
            $tripCostPerProduct,
            $pricingMode,
            $profitMargin,
            $finalPrice,
            $priceCalculation,
        ): void {
            if ($priceCalculation) {
                Product::query()
                    ->where('price_calculation_id', $priceCalculation->id)
                    ->update([
                        'price_calculation_id' => null,
                        'sale_price' => 0,
                    ]);
            }

            $calculationData = [
                'product_id' => $product->id,
                'expense_record_id' => $expenseRecord->id,
                'product_name' => $product->name,
                'expense_record_description' => $expenseRecord->description,
                'pricing_mode' => $pricingMode,
                'product_cost' => $productCost,
                'trip_cost_per_product' => $tripCostPerProduct,
                'profit_margin' => $profitMargin,
                'final_price' => $finalPrice,
            ];
            if ($priceCalculation) {
                $priceCalculation->update($calculationData);
                $calculation = $priceCalculation;
            } else {
                $calculation = PriceCalculation::create($calculationData);
            }

            $product->update([
                'sale_price' => $finalPrice,
                'price_calculation_id' => $calculation->id,
            ]);
        });
    }
}
