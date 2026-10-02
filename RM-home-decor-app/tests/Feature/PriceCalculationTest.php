<?php

namespace Tests\Feature;

use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PriceCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_price_is_calculated_from_profit_margin(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();

        $response = $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('price_calculations', [
            'product_id' => $product->id,
            'pricing_mode' => 'margin',
            'product_cost' => 80,
            'trip_cost_per_product' => 20,
            'profit_margin' => 50,
            'final_price' => 150,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'sale_price' => 150,
        ]);
    }

    public function test_price_can_be_informed_manually_without_profit_margin(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();

        $response = $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'manual',
            'final_price' => 199.90,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('price_calculations', [
            'product_id' => $product->id,
            'pricing_mode' => 'manual',
            'profit_margin' => null,
            'final_price' => 199.90,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'sale_price' => 199.90,
        ]);
    }

    public function test_price_calculation_can_be_switched_to_manual_price(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();

        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ]);

        $priceCalculation = PriceCalculation::query()->firstOrFail();

        $response = $this->put(
            route('price-calculations.update', $priceCalculation),
            [
                'product_id' => $product->id,
                'expense_record_id' => $expenseRecord->id,
                'pricing_mode' => 'manual',
                'final_price' => 250,
            ],
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('price_calculations', [
            'id' => $priceCalculation->id,
            'pricing_mode' => 'manual',
            'profit_margin' => null,
            'final_price' => 250,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'sale_price' => 250,
        ]);
    }

    public function test_manual_price_requires_a_final_price(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();

        $response = $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'manual',
        ]);

        $response->assertSessionHasErrors('final_price');
        $this->assertDatabaseCount('price_calculations', 0);
    }

    public function test_margin_mode_requires_a_profit_margin(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();

        $response = $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
        ]);

        $response->assertSessionHasErrors('profit_margin');
        $this->assertDatabaseCount('price_calculations', 0);
    }

    public function test_final_price_is_rounded_to_cents(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord(
            productCost: 7.5,
            costPerProduct: 2.5,
        );

        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 33.33,
        ]);

        // (7,50 + 2,50) × 1,3333 = 13,333 → 13,33
        $this->assertSame('13.33', PriceCalculation::query()->firstOrFail()->final_price);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'sale_price' => 13.33]);
    }

    public function test_final_price_has_no_floating_point_drift(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord(
            productCost: 0.1,
            costPerProduct: 0.2,
        );

        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 10,
        ]);

        // 0,10 + 0,20 em float = 0,30000000000000004; × 1,10 = 0,33
        $calculation = PriceCalculation::query()->firstOrFail();
        $this->assertSame('0.10', $calculation->product_cost);
        $this->assertSame('0.20', $calculation->trip_cost_per_product);
        $this->assertSame('0.33', $calculation->final_price);
    }

    public function test_exact_half_cent_rounds_up(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord(
            productCost: 2754.66,
            costPerProduct: 193.99,
        );

        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 910,
        ]);

        // 2948,65 × 10,10 = 29781,365 → 29781,37 (com float saía 29781,36)
        $this->assertSame('29781.37', PriceCalculation::query()->firstOrFail()->final_price);
    }

    /**
     * @return array{0: Product, 1: ExpenseRecord}
     */
    private function createProductAndExpenseRecord(
        float $productCost = 80,
        float $costPerProduct = 20,
    ): array {
        $this->actingAs(User::factory()->create());

        $product = Product::create([
            'name' => 'Mesa lateral',
            'sku' => 'MES-001',
            'cost_price' => $productCost,
            'stock' => 5,
            'minimum_stock' => 1,
        ]);

        $expenseRecord = ExpenseRecord::create([
            'description' => 'Viagem SP',
            'product_quantity' => 4,
            'fixed_expenses' => 40,
            'gasoline' => 0,
            'vehicle_maintenance' => 0,
            'tolls' => 0,
            'other_variable_expenses' => 0,
            'total_cost' => $costPerProduct * 4,
            'cost_per_product' => $costPerProduct,
        ]);

        return [$product, $expenseRecord];
    }
}
