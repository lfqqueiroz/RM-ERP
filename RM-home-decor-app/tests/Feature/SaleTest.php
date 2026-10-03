<?php

namespace Tests\Feature;

use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_records_all_items_without_changing_stock(): void
    {
        $this->actingAs(User::factory()->create());
        $firstProduct = Product::create([
            'name' => 'Mesa lateral',
            'sku' => 'MES-001',
            'cost_price' => 80,
            'sale_price' => 150,
            'stock' => 5,
            'minimum_stock' => 1,
        ]);
        $secondProduct = Product::create([
            'name' => 'Luminária',
            'sku' => 'LUM-001',
            'cost_price' => 30,
            'sale_price' => 60,
            'stock' => 4,
            'minimum_stock' => 1,
        ]);
        $firstPriceCalculation = PriceCalculation::create([
            'product_id' => $firstProduct->id,
            'product_name' => $firstProduct->name,
            'expense_record_description' => 'Viagem SP',
            'product_cost' => 80,
            'trip_cost_per_product' => 20,
            'profit_margin' => 50,
            'final_price' => 150,
        ]);
        $secondPriceCalculation = PriceCalculation::create([
            'product_id' => $secondProduct->id,
            'product_name' => $secondProduct->name,
            'expense_record_description' => 'Viagem SP',
            'product_cost' => 30,
            'trip_cost_per_product' => 10,
            'profit_margin' => 50,
            'final_price' => 60,
        ]);

        $response = $this->post(route('sales.store'), [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => [
                [
                    'product_id' => $firstProduct->id,
                    'quantity' => 2,
                    'price_calculation_id' => $firstPriceCalculation->id,
                ],
                [
                    'product_id' => $secondProduct->id,
                    'quantity' => 3,
                    'price_calculation_id' => $secondPriceCalculation->id,
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'total_amount' => 480,
        ]);
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $firstProduct->id,
            'quantity' => 2,
            'total_amount' => 300,
        ]);
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $secondProduct->id,
            'quantity' => 3,
            'total_amount' => 180,
        ]);
        $this->assertDatabaseHas('products', ['id' => $firstProduct->id, 'stock' => 5]);
        $this->assertDatabaseHas('products', ['id' => $secondProduct->id, 'stock' => 4]);
    }

    public function test_sale_can_be_recorded_with_quantity_greater_than_stock(): void
    {
        $this->actingAs(User::factory()->create());
        $inStockProduct = Product::create([
            'name' => 'Vaso',
            'sku' => 'VAS-001',
            'cost_price' => 20,
            'sale_price' => 50,
            'stock' => 2,
            'minimum_stock' => 1,
        ]);
        $outOfStockProduct = Product::create([
            'name' => 'Espelho',
            'sku' => 'ESP-001',
            'cost_price' => 100,
            'sale_price' => 250,
            'stock' => 1,
            'minimum_stock' => 1,
        ]);
        $inStockPriceCalculation = PriceCalculation::create([
            'product_id' => $inStockProduct->id,
            'product_name' => $inStockProduct->name,
            'expense_record_description' => 'Viagem RJ',
            'product_cost' => 20,
            'trip_cost_per_product' => 5,
            'profit_margin' => 100,
            'final_price' => 50,
        ]);
        $outOfStockPriceCalculation = PriceCalculation::create([
            'product_id' => $outOfStockProduct->id,
            'product_name' => $outOfStockProduct->name,
            'expense_record_description' => 'Viagem RJ',
            'product_cost' => 100,
            'trip_cost_per_product' => 25,
            'profit_margin' => 100,
            'final_price' => 250,
        ]);

        $response = $this->post(route('sales.store'), [
            'customer_name' => 'João Souza',
            'customer_phone' => '(11) 98888-0000',
            'items' => [
                [
                    'product_id' => $inStockProduct->id,
                    'quantity' => 1,
                    'price_calculation_id' => $inStockPriceCalculation->id,
                ],
                [
                    'product_id' => $outOfStockProduct->id,
                    'quantity' => 2,
                    'price_calculation_id' => $outOfStockPriceCalculation->id,
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseHas('products', ['id' => $inStockProduct->id, 'stock' => 2]);
        $this->assertDatabaseHas('products', ['id' => $outOfStockProduct->id, 'stock' => 1]);
    }

    public function test_item_price_must_belong_to_the_chosen_product(): void
    {
        $this->actingAs(User::factory()->create());
        $table = Product::create(['name' => 'Mesa', 'sku' => 'MES-001', 'cost_price' => 80, 'stock' => 5]);
        $lamp = Product::create(['name' => 'Luminária', 'sku' => 'LUM-001', 'cost_price' => 30, 'stock' => 4]);
        $tablePrice = $this->createPriceCalculation($table, 150);
        $this->createPriceCalculation($lamp, 60); // a luminária tem preço próprio, mas o pedido usa o da mesa

        $response = $this->post(route('sales.store'), [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => [
                ['product_id' => $table->id, 'quantity' => 1, 'price_calculation_id' => $tablePrice->id],
                ['product_id' => $lamp->id, 'quantity' => 1, 'price_calculation_id' => $tablePrice->id],
            ],
        ]);

        $response->assertSessionHasErrors([
            'items.1.price_calculation_id' => 'Selecione um preço salvo que pertença ao produto escolhido.',
        ]);
        $response->assertSessionDoesntHaveErrors('items.0.price_calculation_id');
        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('sale_items', 0);
    }

    public function test_order_update_also_checks_item_prices(): void
    {
        $this->actingAs(User::factory()->create());
        $table = Product::create(['name' => 'Mesa', 'sku' => 'MES-001', 'cost_price' => 80, 'stock' => 5]);
        $lamp = Product::create(['name' => 'Luminária', 'sku' => 'LUM-001', 'cost_price' => 30, 'stock' => 4]);
        $tablePrice = $this->createPriceCalculation($table, 150);
        $this->post(route('sales.store'), [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => [['product_id' => $table->id, 'quantity' => 1, 'price_calculation_id' => $tablePrice->id]],
        ]);
        $sale = Sale::query()->firstOrFail();

        $response = $this->put(route('sales.update', $sale), [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => [['product_id' => $lamp->id, 'quantity' => 2, 'price_calculation_id' => $tablePrice->id]],
        ]);

        $response->assertSessionHasErrors('items.0.price_calculation_id');
        $this->assertDatabaseHas('sale_items', ['sale_id' => $sale->id, 'product_id' => $table->id, 'quantity' => 1]);
    }

    private function createPriceCalculation(Product $product, float $finalPrice): PriceCalculation
    {
        return PriceCalculation::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'expense_record_description' => 'Viagem SP',
            'product_cost' => $product->cost_price,
            'trip_cost_per_product' => 0,
            'profit_margin' => 0,
            'final_price' => $finalPrice,
        ]);
    }
}
