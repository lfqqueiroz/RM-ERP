<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
