<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_stock_alert_uses_the_configured_minimum_stock(): void
    {
        $this->createProduct('AT-MIN', stock: 5, minimumStock: 5);
        $this->createProduct('ACIMA', stock: 6, minimumStock: 5);

        $this->assertStockAlerts(['AT-MIN']);
    }

    public function test_stock_alert_falls_back_to_the_default_when_minimum_is_not_configured(): void
    {
        $this->createProduct('PADRAO-2', stock: 2, minimumStock: 0);
        $this->createProduct('PADRAO-3', stock: 3, minimumStock: 0);

        $this->assertStockAlerts(['PADRAO-2']);
    }

    public function test_configured_minimum_below_the_default_is_respected(): void
    {
        $this->createProduct('MIN-1', stock: 2, minimumStock: 1);

        $this->assertStockAlerts([]);
    }

    public function test_stock_alerts_are_ordered_by_shortfall_then_name(): void
    {
        $this->createProduct('FALTA-1-B', stock: 4, minimumStock: 5, name: 'B');
        $this->createProduct('FALTA-1-A', stock: 4, minimumStock: 5, name: 'A');
        $this->createProduct('FALTA-10', stock: 0, minimumStock: 10);
        $this->createProduct('FALTA-2', stock: 0, minimumStock: 0);

        $this->assertStockAlerts(['FALTA-10', 'FALTA-2', 'FALTA-1-A', 'FALTA-1-B']);
    }

    public function test_top_products_group_a_renamed_product_into_a_single_row(): void
    {
        $product = $this->createProduct('MES-001', stock: 5, minimumStock: 0, name: 'Mesa');
        $this->createOrder($product, quantity: 2);
        $product->update(['name' => 'Mesa lateral', 'sku' => 'MES-002']);
        $this->createOrder($product, quantity: 3);

        $this->actingAs(User::factory()->create());
        $this->withoutVite();

        $this->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('topProducts', 1)
                ->where('topProducts.0.product_name', 'Mesa lateral')
                ->where('topProducts.0.product_sku', 'MES-002')
                ->where('topProducts.0.quantity_sold', 5));
    }

    public function test_top_products_keep_deleted_products_by_their_snapshot(): void
    {
        $product = $this->createProduct('VAS-001', stock: 5, minimumStock: 0, name: 'Vaso');
        $this->createOrder($product, quantity: 4);
        $product->delete();

        $this->actingAs(User::factory()->create());
        $this->withoutVite();

        $this->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('topProducts', 1)
                ->where('topProducts.0.product_name', 'Vaso')
                ->where('topProducts.0.product_sku', 'VAS-001')
                ->where('topProducts.0.quantity_sold', 4));
    }

    public function test_monthly_revenue_starts_at_midnight_in_the_store_timezone(): void
    {
        config(['app.display_timezone' => 'America/Sao_Paulo']);
        $product = $this->createProduct('MES-001', stock: 5, minimumStock: 0);

        // 30/09 23:30 em Brasília = 01/10 02:30 UTC: ainda é setembro para a loja.
        $this->travelTo(Carbon::parse('2026-10-01 02:30:00', 'UTC'));
        $this->createOrder($product, quantity: 1, total: 100);

        // 01/10 00:30 em Brasília = 01/10 03:30 UTC: primeiro pedido de outubro.
        $this->travelTo(Carbon::parse('2026-10-01 03:30:00', 'UTC'));
        $this->createOrder($product, quantity: 1, total: 40);

        $this->travelTo(Carbon::parse('2026-10-15 12:00:00', 'UTC'));
        $this->actingAs(User::factory()->create());
        $this->withoutVite();

        $this->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('metrics.monthly_revenue', fn ($value) => (float) $value === 40.0)
                ->where('metrics.total_revenue', fn ($value) => (float) $value === 140.0));
    }

    private function createOrder(Product $product, int $quantity, float $total = 100): Sale
    {
        $sale = Sale::create([
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'total_amount' => $total,
        ]);
        $sale->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => $quantity,
            'unit_price' => $total / $quantity,
            'total_amount' => $total,
        ]);

        return $sale;
    }

    /**
     * @param  list<string>  $expectedSkus
     */
    private function assertStockAlerts(array $expectedSkus): void
    {
        $this->actingAs(User::factory()->create());
        $this->withoutVite();

        $this->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('defaultMinimumStock', Product::DEFAULT_MINIMUM_STOCK)
                ->where('stockAlerts', fn ($alerts) => collect($alerts)->pluck('sku')->all() === $expectedSkus));
    }

    private function createProduct(string $sku, int $stock, int $minimumStock, ?string $name = null): Product
    {
        return Product::create([
            'name' => $name ?? $sku,
            'sku' => $sku,
            'cost_price' => 10,
            'stock' => $stock,
            'minimum_stock' => $minimumStock,
        ]);
    }
}
