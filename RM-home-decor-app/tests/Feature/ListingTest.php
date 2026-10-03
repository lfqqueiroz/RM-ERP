<?php

namespace Tests\Feature;

use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Support\ListQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Paginação, busca e ordenação no servidor das quatro listagens.
 */
class ListingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
        $this->withoutVite();
    }

    public function test_products_are_paginated(): void
    {
        foreach (range(1, 30) as $number) {
            $this->createProduct(sprintf('PRD-%02d', $number));
        }

        $this->get(route('products.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', ListQuery::PER_PAGE)
                ->where('products.total', 30)
                ->where('products.last_page', 2)
                ->has('products.links')
                ->has('productOptions', 30));

        $this->get(route('products.index', ['pagina' => 2]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 5)
                ->where('products.current_page', 2));
    }

    public function test_products_can_be_searched_by_name_or_sku(): void
    {
        $this->createProduct('MES-001', 'Mesa lateral');
        $this->createProduct('VAS-001', 'Vaso');
        $this->createProduct('LUM-001', 'Luminária');

        $this->get(route('products.index', ['busca' => 'vas-001']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.sku', 'VAS-001')
                ->where('filters.busca', 'vas-001'));

        $this->get(route('products.index', ['busca' => 'mesa']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Mesa lateral'));
    }

    public function test_page_past_the_last_redirects_to_the_last_page(): void
    {
        foreach (range(1, 26) as $number) {
            $this->createProduct(sprintf('PRD-%02d', $number));
        }

        $this->get(route('products.index', ['pagina' => 5, 'busca' => 'PRD']))
            ->assertRedirect(route('products.index', ['busca' => 'PRD', 'pagina' => 2]));
    }

    public function test_expense_records_are_sorted_by_whitelisted_columns(): void
    {
        $this->createExpenseRecord('Viagem cara', 300);
        $this->createExpenseRecord('Viagem barata', 100);
        $this->createExpenseRecord('Viagem média', 200);

        $this->get(route('expense-records.index', ['ordem' => 'total_cost', 'direcao' => 'asc']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('expenseRecords.data', fn ($records) => collect($records)->pluck('description')->all()
                    === ['Viagem barata', 'Viagem média', 'Viagem cara'])
                ->where('filters.ordem', 'total_cost')
                ->where('filters.direcao', 'asc'));
    }

    public function test_invalid_sort_falls_back_to_the_default(): void
    {
        $this->createExpenseRecord('Viagem SP', 100);

        $this->get(route('expense-records.index', ['ordem' => 'id; drop table users', 'direcao' => 'lado']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('expenseRecords.data', 1)
                ->where('filters.ordem', 'created_at')
                ->where('filters.direcao', 'desc'));
    }

    public function test_expense_records_can_be_searched_by_description(): void
    {
        $this->createExpenseRecord('Viagem São Paulo', 100);
        $this->createExpenseRecord('Viagem Rio', 100);

        $this->get(route('expense-records.index', ['busca' => 'rio']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('expenseRecords.data', 1)
                ->where('expenseRecords.data.0.description', 'Viagem Rio'));
    }

    public function test_price_calculations_can_be_searched_by_product(): void
    {
        $table = $this->createProduct('MES-001', 'Mesa lateral');
        $vase = $this->createProduct('VAS-001', 'Vaso');
        $this->createPriceCalculation($table, 150);
        $this->createPriceCalculation($vase, 60);

        $this->get(route('price-calculations.index', ['busca' => 'vaso']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('priceCalculations.data', 1)
                ->where('priceCalculations.data.0.product_name', 'Vaso')
                ->has('products', 2));
    }

    public function test_sales_can_be_searched_by_customer_phone_or_product(): void
    {
        $table = $this->createProduct('MES-001', 'Mesa lateral');
        $vase = $this->createProduct('VAS-001', 'Vaso');
        $this->createOrder('Maria Silva', '(11) 99999-0000', $table);
        $this->createOrder('João Souza', '(21) 98888-1111', $vase);

        $this->get(route('sales.index', ['busca' => 'maria']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('sales.data', 1)
                ->where('sales.data.0.customer_name', 'Maria Silva'));

        $this->get(route('sales.index', ['busca' => '98888']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('sales.data', 1)
                ->where('sales.data.0.customer_name', 'João Souza'));

        $this->get(route('sales.index', ['busca' => 'vaso']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('sales.data', 1)
                ->where('sales.data.0.customer_name', 'João Souza')
                ->has('sales.data.0.items', 1));
    }

    public function test_partial_reload_of_the_list_skips_the_select_lists(): void
    {
        $this->createProduct('MES-001', 'Mesa lateral');
        $version = $this->get(route('products.index'))->viewData('page')['version'];

        $response = $this->get(route('products.index', ['busca' => 'mesa']), [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
            'X-Inertia-Partial-Component' => 'products/index',
            'X-Inertia-Partial-Data' => 'products,filters',
        ]);

        $props = $response->assertOk()->json('props');
        $this->assertArrayHasKey('products', $props);
        $this->assertArrayHasKey('filters', $props);
        $this->assertArrayNotHasKey('productOptions', $props);
        $this->assertArrayNotHasKey('priceCalculations', $props);
    }

    public function test_mutation_returns_to_the_same_page_and_search(): void
    {
        $product = $this->createProduct('MES-001', 'Mesa lateral', stock: 3);

        $this->from('/produtos?busca=Mesa&pagina=1')
            ->post(route('products.sell', $product))
            ->assertRedirect('/produtos?busca=Mesa&pagina=1');
    }

    private function createProduct(string $sku, ?string $name = null, int $stock = 5): Product
    {
        return Product::create([
            'name' => $name ?? $sku,
            'sku' => $sku,
            'cost_price' => 10,
            'stock' => $stock,
        ]);
    }

    private function createExpenseRecord(string $description, float $totalCost): ExpenseRecord
    {
        return ExpenseRecord::create([
            'description' => $description,
            'product_quantity' => 1,
            'fixed_expenses' => $totalCost,
            'total_cost' => $totalCost,
            'cost_per_product' => $totalCost,
        ]);
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

    private function createOrder(string $customer, string $phone, Product $product): Sale
    {
        $sale = Sale::create([
            'customer_name' => $customer,
            'customer_phone' => $phone,
            'total_amount' => 100,
        ]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => 100,
            'total_amount' => 100,
        ]);

        return $sale;
    }
}
