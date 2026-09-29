<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseRecordController;
use App\Http\Controllers\PriceCalculationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('produtos', [ProductController::class, 'index'])->name('products.index');

    Route::post('produtos', [ProductController::class, 'store'])->name('products.store');
    Route::put('produtos/{product}', [ProductController::class, 'update'])
        ->name('products.update');
    Route::delete('produtos/{product}', [ProductController::class, 'destroy'])
        ->name('products.destroy');
    Route::put('produtos/{product}/calculo-preco', [ProductController::class, 'updatePriceCalculation'])
        ->name('products.price-calculation.update');
    Route::post('produtos/{product}/venda', [ProductController::class, 'sell'])
        ->name('products.sell');

    Route::get('registros-de-gastos', [ExpenseRecordController::class, 'index'])
        ->name('expense-records.index');
    Route::post('registros-de-gastos', [ExpenseRecordController::class, 'store'])
        ->name('expense-records.store');
    Route::put('registros-de-gastos/{expenseRecord}', [ExpenseRecordController::class, 'update'])
        ->name('expense-records.update');
    Route::delete('registros-de-gastos/{expenseRecord}', [ExpenseRecordController::class, 'destroy'])
        ->name('expense-records.destroy');

    Route::get('calculo-de-preco', [PriceCalculationController::class, 'index'])
        ->name('price-calculations.index');
    Route::post('calculos-de-preco', [PriceCalculationController::class, 'store'])
        ->name('price-calculations.store');
    Route::put('calculos-de-preco/{priceCalculation}', [PriceCalculationController::class, 'update'])
        ->name('price-calculations.update');
    Route::delete('calculos-de-preco/{priceCalculation}', [PriceCalculationController::class, 'destroy'])
        ->name('price-calculations.destroy');

    Route::get('registros-de-vendas', [SaleController::class, 'index'])
        ->name('sales.index');
    Route::post('vendas', [SaleController::class, 'store'])->name('sales.store');
    Route::put('vendas/{sale}', [SaleController::class, 'update'])->name('sales.update');
});

require __DIR__.'/settings.php';
