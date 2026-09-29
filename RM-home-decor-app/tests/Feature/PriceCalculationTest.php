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

    /**
     * @return array{0: Product, 1: ExpenseRecord}
     */
    private function createProductAndExpenseRecord(): array
    {
        $this->actingAs(User::factory()->create());

        $product = Product::create([
            'name' => 'Mesa lateral',
            'sku' => 'MES-001',
            'cost_price' => 80,
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
            'total_cost' => 40,
            'cost_per_product' => 20,
        ]);

        return [$product, $expenseRecord];
    }
}
