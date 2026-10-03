<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseRecordStoreRequest;
use App\Models\ExpenseRecord;
use App\Support\ListQuery;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseRecordController extends Controller
{
    /** Colunas pelas quais a listagem pode ser ordenada. */
    private const SORTABLE = ['created_at', 'description', 'product_quantity', 'total_cost', 'cost_per_product'];

    public function index(Request $request): Response|RedirectResponse
    {
        $query = ListQuery::fromRequest($request, self::SORTABLE);
        $expenseRecords = ExpenseRecord::query()
            ->when($query->hasSearch(), fn ($builder) => $builder
                ->where('description', 'like', $query->likePattern()))
            ->orderBy($query->sort, $query->direction)
            ->orderBy('id', $query->direction)
            ->paginate(ListQuery::PER_PAGE, pageName: ListQuery::PAGE_NAME)
            ->withQueryString();

        if ($redirect = ListQuery::redirectIfPastLastPage($expenseRecords)) {
            return $redirect;
        }

        return Inertia::render('expense-records/index', [
            'expenseRecords' => $expenseRecords,
            'filters' => $query->toArray(),
        ]);
    }

    public function store(ExpenseRecordStoreRequest $request): RedirectResponse
    {
        ExpenseRecord::create($this->recordData($request));

        $this->toast('Registro de gastos salvo com sucesso.');

        return back();
    }

    public function update(ExpenseRecordStoreRequest $request, ExpenseRecord $expenseRecord): RedirectResponse
    {
        $expenseRecord->update($this->recordData($request));

        $this->toast('Registro de gastos atualizado com sucesso.');

        return back();
    }

    public function destroy(ExpenseRecord $expenseRecord): RedirectResponse
    {
        $expenseRecord->delete();

        $this->toast('Registro de gastos excluído com sucesso.');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function recordData(ExpenseRecordStoreRequest $request): array
    {
        $data = $request->validated();
        $totalCostCents = collect([
            $data['fixed_expenses'],
            $data['gasoline'],
            $data['vehicle_maintenance'],
            $data['tolls'],
            $data['other_variable_expenses'],
        ])->sum(fn (string|int|float $value): int => Money::toCents($value));

        return [
            ...$data,
            'total_cost' => Money::fromCents($totalCostCents),
            'cost_per_product' => Money::fromCents(
                Money::divide($totalCostCents, $request->integer('product_quantity')),
            ),
        ];
    }
}
