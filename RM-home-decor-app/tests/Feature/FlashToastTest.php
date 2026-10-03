<?php

namespace Tests\Feature;

use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

/**
 * Cada ação do ERP deixa um aviso (toast) para a próxima página, no formato
 * que o hook use-flash-toast exibe: flash `toast` com `type` e `message`.
 */
class FlashToastTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
    }

    public function test_product_actions_flash_a_success_toast(): void
    {
        $this->assertSuccessToast(
            $this->post(route('products.store'), $this->productPayload('MES-001')),
            'Produto cadastrado com sucesso.',
        );

        $product = Product::query()->firstOrFail();

        $this->assertSuccessToast(
            $this->put(route('products.update', $product), $this->productPayload('MES-001')),
            'Produto atualizado com sucesso.',
        );

        $calculation = $this->createPriceCalculation($product);

        $this->assertSuccessToast(
            $this->put(route('products.price-calculation.update', $product), [
                'price_calculation_id' => $calculation->id,
            ]),
            'Preço salvo selecionado com sucesso.',
        );
        $this->assertSuccessToast(
            $this->put(route('products.price-calculation.update', $product), [
                'price_calculation_id' => null,
            ]),
            'Preço salvo removido com sucesso.',
        );
        $this->assertSuccessToast(
            $this->post(route('products.sell', $product)),
            'Venda registrada com sucesso.',
        );
        $this->assertSuccessToast(
            $this->delete(route('products.destroy', $product)),
            'Produto excluído com sucesso.',
        );
    }

    public function test_expense_record_actions_flash_a_success_toast(): void
    {
        $payload = [
            'description' => 'Viagem SP',
            'product_quantity' => 2,
            'fixed_expenses' => 40,
            'gasoline' => 0,
            'vehicle_maintenance' => 0,
            'tolls' => 0,
            'other_variable_expenses' => 0,
        ];

        $this->assertSuccessToast(
            $this->post(route('expense-records.store'), $payload),
            'Registro de gastos salvo com sucesso.',
        );

        $record = ExpenseRecord::query()->firstOrFail();

        $this->assertSuccessToast(
            $this->put(route('expense-records.update', $record), $payload),
            'Registro de gastos atualizado com sucesso.',
        );
        $this->assertSuccessToast(
            $this->delete(route('expense-records.destroy', $record)),
            'Registro de gastos excluído com sucesso.',
        );
    }

    public function test_price_calculation_actions_flash_a_success_toast(): void
    {
        $product = Product::create([...$this->productPayload('MES-001'), 'cost_price' => 80]);
        $record = ExpenseRecord::create([
            'description' => 'Viagem SP',
            'product_quantity' => 1,
            'total_cost' => 20,
            'cost_per_product' => 20,
        ]);
        $payload = [
            'product_id' => $product->id,
            'expense_record_id' => $record->id,
            'pricing_mode' => 'margin',
            'profit_margin' => 50,
        ];

        $this->assertSuccessToast(
            $this->post(route('price-calculations.store'), $payload),
            'Preço calculado e salvo com sucesso.',
        );

        $calculation = PriceCalculation::query()->firstOrFail();

        $this->assertSuccessToast(
            $this->put(route('price-calculations.update', $calculation), $payload),
            'Preço salvo atualizado com sucesso.',
        );
        $this->assertSuccessToast(
            $this->delete(route('price-calculations.destroy', $calculation)),
            'Preço salvo excluído com sucesso.',
        );
    }

    public function test_sale_actions_flash_a_success_toast(): void
    {
        $product = Product::create($this->productPayload('MES-001'));
        $calculation = $this->createPriceCalculation($product);
        $payload = [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'price_calculation_id' => $calculation->id,
            ]],
        ];

        $this->assertSuccessToast(
            $this->post(route('sales.store'), $payload),
            'Venda registrada com sucesso.',
        );
        $this->assertSuccessToast(
            $this->put(route('sales.update', Sale::query()->firstOrFail()), $payload),
            'Venda atualizada com sucesso.',
        );
    }

    public function test_validation_errors_do_not_flash_a_success_toast(): void
    {
        $this->post(route('products.store'), [])
            ->assertSessionHasErrors('name')
            ->assertInertiaFlashMissing('toast');
    }

    /**
     * @param  TestResponse<Response>  $response
     */
    private function assertSuccessToast(TestResponse $response, string $message): void
    {
        $response->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertInertiaFlash('toast.type', 'success')
            ->assertInertiaFlash('toast.message', $message);
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(string $sku): array
    {
        return [
            'name' => 'Mesa lateral',
            'sku' => $sku,
            'cost_price' => 80,
            'stock' => 5,
            'minimum_stock' => 0,
        ];
    }

    private function createPriceCalculation(Product $product): PriceCalculation
    {
        return PriceCalculation::create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'expense_record_description' => 'Viagem SP',
            'product_cost' => 80,
            'trip_cost_per_product' => 20,
            'profit_margin' => 50,
            'final_price' => 150,
        ]);
    }
}
