<?php

namespace Tests\Feature;

use App\Models\PriceCalculation;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Editar um pedido preserva o que foi gravado: preço unitário, nome e SKU
 * dos itens só mudam quando um preço salvo é escolhido explicitamente.
 */
class SaleEditTest extends TestCase
{
    use RefreshDatabase;

    private Product $table;

    private PriceCalculation $tablePrice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->create());
        $this->table = Product::create(['name' => 'Mesa', 'sku' => 'MES-001', 'cost_price' => 80, 'stock' => 5]);
        $this->tablePrice = $this->createPriceCalculation($this->table, 150);
    }

    public function test_editing_customer_keeps_prices_even_if_the_calculation_changed(): void
    {
        $sale = $this->createOrder(quantity: 2);
        $item = $sale->items()->firstOrFail();
        $this->tablePrice->update(['final_price' => 999]);

        $response = $this->put(route('sales.update', $sale), [
            'customer_name' => 'Maria Souza',
            'customer_phone' => '(11) 90000-0000',
            'items' => [$this->keptItem($item)],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'customer_name' => 'Maria Souza', 'total_amount' => 300]);
        $this->assertDatabaseHas('sale_items', ['id' => $item->id, 'unit_price' => 150, 'total_amount' => 300]);
    }

    public function test_changing_quantity_uses_the_stored_unit_price(): void
    {
        $sale = $this->createOrder(quantity: 2);
        $item = $sale->items()->firstOrFail();
        $this->tablePrice->update(['final_price' => 999]);

        $this->put(route('sales.update', $sale), $this->payload([
            [...$this->keptItem($item), 'quantity' => 3],
        ]))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sale_items', ['id' => $item->id, 'quantity' => 3, 'unit_price' => 150, 'total_amount' => 450]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'total_amount' => 450]);
    }

    public function test_choosing_a_saved_price_reprices_the_item(): void
    {
        $sale = $this->createOrder(quantity: 2);
        $item = $sale->items()->firstOrFail();
        $newPrice = $this->createPriceCalculation($this->table, 175);

        $this->put(route('sales.update', $sale), $this->payload([[
            'id' => $item->id,
            'product_id' => $this->table->id,
            'price_calculation_id' => $newPrice->id,
            'quantity' => 2,
        ]]))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sale_items', [
            'id' => $item->id,
            'price_calculation_id' => $newPrice->id,
            'unit_price' => 175,
            'total_amount' => 350,
        ]);
    }

    public function test_order_with_deleted_product_and_calculation_can_still_be_edited(): void
    {
        $sale = $this->createOrder(quantity: 2);
        $item = $sale->items()->firstOrFail();
        $this->tablePrice->delete();
        $this->table->delete();
        $item->refresh();

        $this->put(route('sales.update', $sale), $this->payload([
            ['id' => $item->id, 'product_id' => '', 'price_calculation_id' => '', 'quantity' => 1],
        ]))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sale_items', [
            'id' => $item->id,
            'product_id' => null,
            'price_calculation_id' => null,
            'product_name' => 'Mesa',
            'product_sku' => 'MES-001',
            'quantity' => 1,
            'unit_price' => 150,
            'total_amount' => 150,
        ]);
    }

    public function test_items_are_updated_in_place_added_and_removed(): void
    {
        $lamp = Product::create(['name' => 'Luminária', 'sku' => 'LUM-001', 'cost_price' => 30, 'stock' => 2]);
        $lampPrice = $this->createPriceCalculation($lamp, 60);
        $sale = $this->createOrder(quantity: 1);
        $removedItem = $sale->items()->create([
            'product_id' => $lamp->id,
            'price_calculation_id' => $lampPrice->id,
            'product_name' => 'Luminária',
            'product_sku' => 'LUM-001',
            'quantity' => 1,
            'unit_price' => 60,
            'total_amount' => 60,
        ]);
        $keptItem = $sale->items()->where('product_id', $this->table->id)->firstOrFail();
        $vase = Product::create(['name' => 'Vaso', 'sku' => 'VAS-001', 'cost_price' => 10, 'stock' => 9]);
        $vasePrice = $this->createPriceCalculation($vase, 25);

        $this->put(route('sales.update', $sale), $this->payload([
            $this->keptItem($keptItem),
            ['product_id' => $vase->id, 'price_calculation_id' => $vasePrice->id, 'quantity' => 2],
        ]))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sale_items', ['id' => $keptItem->id, 'sale_id' => $sale->id]);
        $this->assertDatabaseMissing('sale_items', ['id' => $removedItem->id]);
        $this->assertDatabaseHas('sale_items', ['sale_id' => $sale->id, 'product_id' => $vase->id, 'total_amount' => 50]);
        $this->assertDatabaseHas('sales', ['id' => $sale->id, 'total_amount' => 200]);
        $this->assertSame(2, SaleItem::query()->where('sale_id', $sale->id)->count());
    }

    public function test_item_of_another_order_is_rejected(): void
    {
        $sale = $this->createOrder(quantity: 1);
        $otherItem = $this->createOrder(quantity: 1)->items()->firstOrFail();

        $this->put(route('sales.update', $sale), $this->payload([$this->keptItem($otherItem)]))
            ->assertSessionHasErrors(['items.0.id' => 'Este item não pertence ao pedido.']);

        $this->assertDatabaseHas('sale_items', ['id' => $otherItem->id, 'sale_id' => $otherItem->sale_id]);
    }

    public function test_changing_the_product_of_a_kept_item_requires_a_price(): void
    {
        $vase = Product::create(['name' => 'Vaso', 'sku' => 'VAS-001', 'cost_price' => 10, 'stock' => 9]);
        $sale = $this->createOrder(quantity: 1);
        $item = $sale->items()->firstOrFail();

        $this->put(route('sales.update', $sale), $this->payload([
            ['id' => $item->id, 'product_id' => $vase->id, 'price_calculation_id' => '', 'quantity' => 1],
        ]))->assertSessionHasErrors(['items.0.price_calculation_id' => 'Selecione um preço salvo para o novo produto.']);
    }

    public function test_repeated_product_is_rejected_on_update_and_store(): void
    {
        $sale = $this->createOrder(quantity: 1);
        $item = $sale->items()->firstOrFail();

        $this->put(route('sales.update', $sale), $this->payload([
            $this->keptItem($item),
            ['product_id' => $this->table->id, 'price_calculation_id' => $this->tablePrice->id, 'quantity' => 1],
        ]))->assertSessionHasErrors(['items.1.product_id' => 'Este produto já está no pedido.']);

        $this->post(route('sales.store'), $this->payload([
            ['product_id' => $this->table->id, 'price_calculation_id' => $this->tablePrice->id, 'quantity' => 1],
            ['product_id' => $this->table->id, 'price_calculation_id' => $this->tablePrice->id, 'quantity' => 2],
        ]))->assertSessionHasErrors('items.1.product_id');
        $this->assertSame(1, Sale::query()->count());
    }

    public function test_editing_an_order_never_changes_stock(): void
    {
        $sale = $this->createOrder(quantity: 1);
        $item = $sale->items()->firstOrFail();

        $this->put(route('sales.update', $sale), $this->payload([
            [...$this->keptItem($item), 'quantity' => 4],
        ]))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('products', ['id' => $this->table->id, 'stock' => 5]);
    }

    private function createOrder(int $quantity): Sale
    {
        $this->post(route('sales.store'), $this->payload([[
            'product_id' => $this->table->id,
            'price_calculation_id' => $this->tablePrice->id,
            'quantity' => $quantity,
        ]]))->assertSessionHasNoErrors();

        return Sale::query()->latest('id')->firstOrFail();
    }

    /**
     * Item existente enviado como a tela envia ao abrir a edição: mantém o preço.
     *
     * @return array<string, mixed>
     */
    private function keptItem(SaleItem $item): array
    {
        return [
            'id' => $item->id,
            'product_id' => $item->product_id ?? '',
            'price_calculation_id' => '',
            'quantity' => $item->quantity,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return array<string, mixed>
     */
    private function payload(array $items): array
    {
        return [
            'customer_name' => 'Maria Silva',
            'customer_phone' => '(11) 99999-0000',
            'items' => $items,
        ];
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
