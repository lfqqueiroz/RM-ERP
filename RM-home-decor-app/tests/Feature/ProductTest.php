<?php

namespace Tests\Feature;

use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('products.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_products_and_price_calculations(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct();
        $this->createPriceCalculation($product, 150);

        $this->withoutVite();

        $this->get(route('products.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 1)
                ->has('priceCalculations', 1));
    }

    public function test_product_can_be_created(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('products.store'), [
            'name' => 'Vaso de cerâmica',
            'sku' => 'VAS-001',
            'cost_price' => 45.5,
            'stock' => 3,
            'minimum_stock' => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', [
            'name' => 'Vaso de cerâmica',
            'sku' => 'VAS-001',
            'cost_price' => 45.5,
            'sale_price' => 0,
            'stock' => 3,
            'minimum_stock' => 1,
        ]);
    }

    public function test_product_sku_must_be_unique(): void
    {
        $this->actingAs(User::factory()->create());
        $this->createProduct(['sku' => 'MES-001']);

        $response = $this->post(route('products.store'), [
            'name' => 'Outra mesa',
            'sku' => 'MES-001',
            'cost_price' => 10,
            'stock' => 1,
            'minimum_stock' => 0,
        ]);

        $response->assertSessionHasErrors('sku');
        $this->assertDatabaseCount('products', 1);
    }

    public function test_product_rejects_negative_cost_and_stock(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('products.store'), [
            'name' => 'Mesa',
            'sku' => 'MES-002',
            'cost_price' => -1,
            'stock' => -1,
        ]);

        $response->assertSessionHasErrors(['cost_price', 'stock']);
        $this->assertDatabaseCount('products', 0);
    }

    public function test_minimum_stock_is_required_and_cannot_be_negative(): void
    {
        $this->actingAs(User::factory()->create());
        $payload = [
            'name' => 'Mesa',
            'sku' => 'MES-002',
            'cost_price' => 10,
            'stock' => 1,
        ];

        $this->post(route('products.store'), $payload)
            ->assertSessionHasErrors('minimum_stock');
        $this->post(route('products.store'), [...$payload, 'minimum_stock' => -1])
            ->assertSessionHasErrors('minimum_stock');
        $this->assertDatabaseCount('products', 0);
    }

    public function test_validation_messages_are_in_portuguese(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('products.store'), [
            'sku' => 'MES-002',
            'cost_price' => -1,
            'stock' => 1,
            'minimum_stock' => 0,
        ]);

        $response->assertSessionHasErrors([
            'name' => 'É obrigatória a indicação de um valor para o campo nome.',
            'cost_price' => 'O campo preço de custo deve ter um valor superior ou igual a 0.',
        ]);
    }

    public function test_index_shares_the_default_minimum_stock(): void
    {
        $this->actingAs(User::factory()->create());
        $this->withoutVite();

        $this->get(route('products.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('defaultMinimumStock', Product::DEFAULT_MINIMUM_STOCK));
    }

    public function test_product_can_be_updated_keeping_its_own_sku(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct(['sku' => 'MES-001']);

        $response = $this->put(route('products.update', $product), [
            'name' => 'Mesa lateral grande',
            'sku' => 'MES-001',
            'cost_price' => 90,
            'stock' => 7,
            'minimum_stock' => 4,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Mesa lateral grande',
            'sku' => 'MES-001',
            'cost_price' => 90,
            'stock' => 7,
            'minimum_stock' => 4,
        ]);
    }

    public function test_product_cannot_take_the_sku_of_another_product(): void
    {
        $this->actingAs(User::factory()->create());
        $this->createProduct(['sku' => 'MES-001']);
        $product = $this->createProduct(['sku' => 'LUM-001']);

        $response = $this->put(route('products.update', $product), [
            'name' => 'Luminária',
            'sku' => 'MES-001',
            'cost_price' => 30,
            'stock' => 2,
            'minimum_stock' => 0,
        ]);

        $response->assertSessionHasErrors('sku');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'sku' => 'LUM-001']);
    }

    public function test_deleting_a_product_keeps_sale_and_price_snapshots(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct();
        $priceCalculation = $this->createPriceCalculation($product, 150);
        $sale = Sale::create([
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'total_amount' => 150,
        ]);
        $saleItem = $sale->items()->create([
            'product_id' => $product->id,
            'price_calculation_id' => $priceCalculation->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => 150,
            'total_amount' => 150,
        ]);

        $response = $this->delete(route('products.destroy', $product));

        $response->assertRedirect();
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseHas('sale_items', [
            'id' => $saleItem->id,
            'product_id' => null,
            'product_name' => 'Mesa lateral',
            'product_sku' => 'MES-001',
        ]);
        $this->assertDatabaseHas('price_calculations', [
            'id' => $priceCalculation->id,
            'product_id' => null,
            'product_name' => 'Mesa lateral',
        ]);
        $this->assertSame(1, SaleItem::query()->count());
    }

    public function test_price_calculation_of_the_product_can_be_selected(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct();
        $priceCalculation = $this->createPriceCalculation($product, 175.9);

        $response = $this->put(route('products.price-calculation.update', $product), [
            'price_calculation_id' => $priceCalculation->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'price_calculation_id' => $priceCalculation->id,
            'sale_price' => 175.9,
        ]);
    }

    public function test_price_calculation_of_another_product_cannot_be_selected(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct(['sku' => 'MES-001']);
        $otherProduct = $this->createProduct(['sku' => 'LUM-001']);
        $otherCalculation = $this->createPriceCalculation($otherProduct, 60);

        $response = $this->put(route('products.price-calculation.update', $product), [
            'price_calculation_id' => $otherCalculation->id,
        ]);

        $response->assertSessionHasErrors([
            'price_calculation_id' => 'Selecione um preço salvo deste produto.',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'price_calculation_id' => null,
            'sale_price' => 0,
        ]);
    }

    public function test_price_calculation_can_be_removed_from_the_product(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct();
        $priceCalculation = $this->createPriceCalculation($product, 150);
        $product->update([
            'price_calculation_id' => $priceCalculation->id,
            'sale_price' => 150,
        ]);

        $response = $this->put(route('products.price-calculation.update', $product), [
            'price_calculation_id' => null,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'price_calculation_id' => null,
            'sale_price' => 0,
        ]);
        $this->assertDatabaseHas('price_calculations', ['id' => $priceCalculation->id]);
    }

    public function test_selling_decrements_stock_by_exactly_one_unit(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct(['stock' => 3]);

        $response = $this->post(route('products.sell', $product));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
    }

    public function test_selling_without_stock_returns_an_error_and_keeps_stock_at_zero(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct(['stock' => 0]);

        $response = $this->post(route('products.sell', $product));

        $response->assertInertiaFlash('toast.type', 'error');
        $response->assertInertiaFlash('toast.message', 'O produto Mesa lateral está com o estoque vazio.');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 0]);
    }

    public function test_selling_does_not_create_an_order(): void
    {
        $this->actingAs(User::factory()->create());
        $product = $this->createProduct(['stock' => 3]);

        $this->post(route('products.sell', $product));

        $this->assertDatabaseCount('sales', 0);
        $this->assertDatabaseCount('sale_items', 0);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createProduct(array $attributes = []): Product
    {
        return Product::create([
            'name' => 'Mesa lateral',
            'sku' => 'MES-001',
            'cost_price' => 80,
            'stock' => 5,
            'minimum_stock' => 1,
            ...$attributes,
        ]);
    }

    private function createPriceCalculation(Product $product, float $finalPrice): PriceCalculation
    {
        return PriceCalculation::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'expense_record_description' => 'Viagem SP',
            'product_cost' => 80,
            'trip_cost_per_product' => 20,
            'profit_margin' => 50,
            'final_price' => $finalPrice,
        ]);
    }
}
