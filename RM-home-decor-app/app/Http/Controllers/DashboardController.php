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
        $startOfMonth = now()->startOfMonth();

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
            ],
            'topProducts' => SaleItem::query()
                ->select([
                    'product_name',
                    'product_sku',
                    DB::raw('SUM(quantity) as quantity_sold'),
                    DB::raw('SUM(total_amount) as total_amount'),
                ])
                ->groupBy('product_name', 'product_sku')
                ->orderByDesc('quantity_sold')
                ->limit(5)
                ->get(),
            'recentSales' => Sale::query()
                ->with('items:id,sale_id,product_name,quantity')
                ->latest()
                ->limit(5)
                ->get(['id', 'customer_name', 'total_amount', 'created_at']),
            'stockAlerts' => Product::query()
                ->where('stock', '<=', 2)
                ->orderBy('stock')
                ->limit(5)
                ->get(['id', 'name', 'sku', 'stock']),
            'latestExpenseRecord' => ExpenseRecord::query()
                ->latest()
                ->first(['description', 'cost_per_product', 'created_at']),
        ]);
    }
}
