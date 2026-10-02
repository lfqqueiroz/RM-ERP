<?php

namespace Tests\Feature;

use App\Models\ExpenseRecord;
use App\Models\PriceCalculation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExpenseRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('expense-records.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_expense_records(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post(route('expense-records.store'), $this->payload());

        $this->withoutVite();

        $this->get(route('expense-records.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('expense-records/index')
                ->has('expenseRecords', 1));
    }

    public function test_store_calculates_total_cost_and_cost_per_product(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('expense-records.store'), $this->payload([
            'product_quantity' => 4,
            'fixed_expenses' => 50,
            'gasoline' => 120.5,
            'vehicle_maintenance' => 30,
            'tolls' => 19.5,
            'other_variable_expenses' => 20,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('expense_records', [
            'description' => 'Viagem SP',
            'product_quantity' => 4,
            'total_cost' => 240,
            'cost_per_product' => 60,
        ]);
    }

    public function test_cost_per_product_is_rounded_to_cents(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post(route('expense-records.store'), $this->payload([
            'product_quantity' => 3,
            'fixed_expenses' => 100,
        ]));

        $record = ExpenseRecord::query()->firstOrFail();
        $this->assertSame('100.00', $record->total_cost);
        $this->assertSame('33.33', $record->cost_per_product);
    }

    public function test_product_quantity_must_be_at_least_one(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('expense-records.store'), $this->payload([
            'product_quantity' => 0,
        ]));

        $response->assertSessionHasErrors('product_quantity');
        $this->assertDatabaseCount('expense_records', 0);
    }

    public function test_expenses_cannot_be_negative(): void
    {
        $this->actingAs(User::factory()->create());

        $response = $this->post(route('expense-records.store'), $this->payload([
            'fixed_expenses' => -1,
            'gasoline' => -1,
            'vehicle_maintenance' => -1,
            'tolls' => -1,
            'other_variable_expenses' => -1,
        ]));

        $response->assertSessionHasErrors([
            'fixed_expenses',
            'gasoline',
            'vehicle_maintenance',
            'tolls',
            'other_variable_expenses',
        ]);
        $this->assertDatabaseCount('expense_records', 0);
    }

    public function test_update_recalculates_total_cost_and_cost_per_product(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post(route('expense-records.store'), $this->payload());
        $record = ExpenseRecord::query()->firstOrFail();

        $response = $this->put(route('expense-records.update', $record), $this->payload([
            'description' => 'Viagem RJ',
            'product_quantity' => 5,
            'fixed_expenses' => 100,
            'gasoline' => 150,
        ]));

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('expense_records', [
            'id' => $record->id,
            'description' => 'Viagem RJ',
            'total_cost' => 250,
            'cost_per_product' => 50,
        ]);
    }

    public function test_deleting_a_record_keeps_the_price_calculation_snapshot(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post(route('expense-records.store'), $this->payload([
            'product_quantity' => 2,
            'fixed_expenses' => 40,
        ]));
        $record = ExpenseRecord::query()->firstOrFail();
        $priceCalculation = PriceCalculation::create([
            'expense_record_id' => $record->id,
            'product_name' => 'Mesa lateral',
            'expense_record_description' => $record->description,
            'product_cost' => 80,
            'trip_cost_per_product' => $record->cost_per_product,
            'profit_margin' => 50,
            'final_price' => 150,
        ]);

        $response = $this->delete(route('expense-records.destroy', $record));

        $response->assertRedirect();
        $this->assertDatabaseMissing('expense_records', ['id' => $record->id]);
        $this->assertDatabaseHas('price_calculations', [
            'id' => $priceCalculation->id,
            'expense_record_id' => null,
            'expense_record_description' => 'Viagem SP',
            'trip_cost_per_product' => 20,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'description' => 'Viagem SP',
            'product_quantity' => 1,
            'fixed_expenses' => 0,
            'gasoline' => 0,
            'vehicle_maintenance' => 0,
            'tolls' => 0,
            'other_variable_expenses' => 0,
            ...$overrides,
        ];
    }
}
