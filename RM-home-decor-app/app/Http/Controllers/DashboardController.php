<?php

namespace App\Http\Controllers;

use App\Models\ExpenseRecord;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        // Início do mês no fuso da loja, convertido para UTC (fuso de gravação).
        $startOfMonth = now(config('app.display_timezone'))->startOfMonth()->utc();

        return Inertia::render('dashboard', [
            'metrics' => [
                'total_revenue' => Sale::query()->sum('total_amount'),
                'monthly_revenue' => Sale::query()
                    ->where('created_at', '>=', $startOfMonth)
                    ->sum('total_amount'),
                'total_sales' => Sale::query()->count(),
                'inventory_cost' => Product::query()
                    ->selectRaw('COALESCE(SUM(stock * cost_price), 0) as total')
                    ->value('total'),
                'stock_units' => Product::query()->sum('stock'),
                'out_of_stock' => Product::query()->where('stock', 0)->count(),
                'without_price' => Product::query()
                    ->whereNull('price_calculation_id')
                    ->count(),
                // Mesma regra de PriceCalculation::hasOutdatedCosts(), em SQL.
                'outdated_prices' => Product::query()
                    ->join('price_calculations', 'price_calculations.id', '=', 'products.price_calculation_id')
                    ->leftJoin('expense_records', 'expense_records.id', '=', 'price_calculations.expense_record_id')
                    ->where(fn ($query) => $query
                        ->whereColumn('products.cost_price', '<>', 'price_calculations.product_cost')
                        ->orWhereColumn('expense_records.cost_per_product', '<>', 'price_calculations.trip_cost_per_product'))
                    ->count(),
            ],
            // Agrupa pelo produto (nome/SKU atuais); itens de produtos excluídos
            // (product_id nulo) caem no snapshot gravado no pedido.
            'topProducts' => SaleItem::query()
                ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
                ->select([
                    DB::raw('COALESCE(products.name, sale_items.product_name) as product_name'),
                    DB::raw('COALESCE(products.sku, sale_items.product_sku) as product_sku'),
                    DB::raw('SUM(sale_items.quantity) as quantity_sold'),
                    DB::raw('SUM(sale_items.total_amount) as total_amount'),
                ])
                ->groupBy(
                    'sale_items.product_id',
                    DB::raw('COALESCE(products.name, sale_items.product_name)'),
                    DB::raw('COALESCE(products.sku, sale_items.product_sku)'),
                )
                ->orderByDesc('quantity_sold')
                ->limit(5)
                ->get(),
            'recentSales' => Sale::query()
                ->with('items:id,sale_id,product_name,quantity')
                ->latest()
                ->limit(5)
                ->get(['id', 'customer_name', 'total_amount', 'created_at']),
            'stockAlerts' => Product::query()
                ->lowStock()
                ->orderByRaw('('.Product::EFFECTIVE_MINIMUM_STOCK_SQL.') - stock DESC')
                ->orderBy('name')
                ->limit(5)
                ->get(['id', 'name', 'sku', 'stock', 'minimum_stock']),
            'defaultMinimumStock' => Product::DEFAULT_MINIMUM_STOCK,
            'latestExpenseRecord' => ExpenseRecord::query()
                ->latest()
                ->first(['description', 'cost_per_product', 'created_at']),
        ]);
    }
}
