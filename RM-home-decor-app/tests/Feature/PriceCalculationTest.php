<?php

namespace Tests\Feature;

use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
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

        $response->assertSessionHasErrors(['final_price' => 'Informe o preço final.']);
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

        $response->assertSessionHasErrors(['profit_margin' => 'Informe o markup.']);
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

    public function test_calculation_is_outdated_after_product_cost_changes_and_fresh_after_editing(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();
        $payload = [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ];
        $this->post(route('price-calculations.store'), $payload);
        $calculation = PriceCalculation::query()->firstOrFail();

        $this->assertOutdatedFlags([false]);

        $product->update(['cost_price' => 90]);
        $this->assertOutdatedFlags([true]);
        $this->assertDatabaseHas('price_calculations', [
            'id' => $calculation->id,
            'product_cost' => 80,
            'final_price' => 150,
        ]);

        $this->put(route('price-calculations.update', $calculation), $payload);
        $this->assertOutdatedFlags([false]);
        $this->assertDatabaseHas('price_calculations', [
            'id' => $calculation->id,
            'product_cost' => 90,
            'final_price' => 165,
        ]);
    }

    public function test_calculation_is_outdated_after_trip_cost_changes(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();
        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ]);

        $expenseRecord->update(['cost_per_product' => 25]);

        $this->assertOutdatedFlags([true]);
    }

    public function test_deleted_expense_record_does_not_mark_calculation_as_outdated(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();
        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ]);

        $this->delete(route('expense-records.destroy', $expenseRecord));

        $this->assertOutdatedFlags([false]);
    }

    public function test_outdated_flag_reaches_products_page_and_dashboard(): void
    {
        [$product, $expenseRecord] = $this->createProductAndExpenseRecord();
        $this->post(route('price-calculations.store'), [
            'product_id' => $product->id,
            'expense_record_id' => $expenseRecord->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ]);
        $product->update(['cost_price' => 90]);
        $this->withoutVite();

        $this->get(route('products.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.0.is_price_outdated', true));
        $this->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('metrics.outdated_prices', 1));
    }

    /**
     * @param  list<bool>  $expected
     */
    private function assertOutdatedFlags(array $expected): void
    {
        $this->withoutVite();

        $this->get(route('price-calculations.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('priceCalculations', fn ($calculations) => collect($calculations)->pluck('is_outdated')->all() === $expected));
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
