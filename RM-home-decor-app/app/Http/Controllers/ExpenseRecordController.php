<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseRecordStoreRequest;
use App\Models\ExpenseRecord;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseRecordController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('expense-records/index', [
            'expenseRecords' => ExpenseRecord::query()->latest()->get(),
        ]);
    }

    public function store(ExpenseRecordStoreRequest $request): RedirectResponse
    {
        ExpenseRecord::create($this->recordData($request));

        return back()->with('success', 'Registro de gastos salvo com sucesso.');
    }

    public function update(ExpenseRecordStoreRequest $request, ExpenseRecord $expenseRecord): RedirectResponse
    {
        $expenseRecord->update($this->recordData($request));

        return back()->with('success', 'Registro de gastos atualizado com sucesso.');
    }

    public function destroy(ExpenseRecord $expenseRecord): RedirectResponse
    {
        $expenseRecord->delete();

        return back()->with('success', 'Registro de gastos excluído com sucesso.');
    }

    private function recordData(ExpenseRecordStoreRequest $request): array
    {
        $data = $request->validated();
        $totalCost = collect([
            $data['fixed_expenses'],
            $data['gasoline'],
            $data['vehicle_maintenance'],
            $data['tolls'],
            $data['other_variable_expenses'],
        ])->sum();

        return [
            ...$data,
            'total_cost' => $totalCost,
            'cost_per_product' => $totalCost / $data['product_quantity'],
        ];
    }
}
