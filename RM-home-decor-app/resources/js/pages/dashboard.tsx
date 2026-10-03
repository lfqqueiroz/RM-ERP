import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    DollarSign,
    Package,
    ShoppingBag,
    Tag,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { dashboard } from '@/routes';

type Metrics = {
    total_revenue: string;
    monthly_revenue: string;
    total_sales: number;
    inventory_cost: string;
    stock_units: number;
    out_of_stock: number;
    without_price: number;
    outdated_prices: number;
};

type TopProduct = {
    product_name: string;
    product_sku: string;
    quantity_sold: number;
    total_amount: string;
};

type RecentSale = {
    id: number;
    customer_name: string;
    total_amount: string;
    created_at: string;
    items: { id: number; product_name: string; quantity: number }[];
};

type StockAlert = {
    id: number;
    name: string;
    sku: string;
    stock: number;
    minimum_stock: number;
};

type Props = {
    metrics: Metrics;
    topProducts: TopProduct[];
    recentSales: RecentSale[];
    stockAlerts: StockAlert[];
    defaultMinimumStock: number;
    latestExpenseRecord: {
        description: string;
        cost_per_product: string;
        created_at: string;
    } | null;
};

const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export default function Dashboard({
    metrics,
    topProducts,
    recentSales,
    stockAlerts,
    defaultMinimumStock,
    latestExpenseRecord,
}: Props) {
    const maxQuantity = Math.max(
        ...topProducts.map((product) => Number(product.quantity_sold)),
        1,
    );

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-2xl font-semibold">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Visão geral para priorizar vendas, preços e estoque.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Atualizado com os dados atuais do sistema
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Faturamento total"
                        value={money.format(Number(metrics.total_revenue))}
                        description={`${metrics.total_sales} venda(s) registrada(s)`}
                        icon={DollarSign}
                    />
                    <MetricCard
                        label="Faturamento do mês"
                        value={money.format(Number(metrics.monthly_revenue))}
                        description="Vendas confirmadas neste mês"
                        icon={TrendingUp}
                    />
                    <MetricCard
                        label="Capital em estoque"
                        value={money.format(Number(metrics.inventory_cost))}
                        description={`${metrics.stock_units} unidade(s) disponíveis`}
                        icon={Wallet}
                    />
                    <MetricCard
                        label="Preços pendentes"
                        value={String(metrics.without_price)}
                        description={
                            metrics.outdated_prices > 0
                                ? `Produtos sem preço calculado · ${metrics.outdated_prices} com custo alterado`
                                : 'Produtos sem preço calculado'
                        }
                        icon={Tag}
                        href="/calculo-de-preco"
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-xl border p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Produtos mais vendidos
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Itens que mais movimentam o faturamento.
                                </p>
                            </div>
                            <Link
                                href="/registros-de-vendas"
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                                Ver vendas <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        {topProducts.length === 0 ? (
                            <EmptyState text="As vendas registradas aparecerão aqui." />
                        ) : (
                            <div className="grid gap-4">
                                {topProducts.map((product) => (
                                    <div key={product.product_sku}>
                                        <div className="mb-1 flex justify-between gap-4 text-sm">
                                            <span className="font-medium">
                                                {product.product_name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {product.quantity_sold} un. ·{' '}
                                                {money.format(
                                                    Number(
                                                        product.total_amount,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${(Number(product.quantity_sold) / maxQuantity) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Atenção ao estoque
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Produtos no estoque mínimo ou abaixo dele.
                                </p>
                            </div>
                            <AlertTriangle className="size-5 text-amber-500" />
                        </div>

                        {stockAlerts.length === 0 ? (
                            <EmptyState text="Nenhum produto com estoque baixo." />
                        ) : (
                            <div className="grid gap-3">
                                {stockAlerts.map((product) => (
                                    <Link
                                        key={product.id}
                                        href="/produtos"
                                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                                    >
                                        <span>
                                            <span className="block font-medium">
                                                {product.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {product.sku}
                                            </span>
                                        </span>
                                        <span className="text-right">
                                            <span className="block text-sm font-semibold text-destructive">
                                                {product.stock} un.
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {product.minimum_stock > 0
                                                    ? `mín. ${product.minimum_stock}`
                                                    : `mín. ${defaultMinimumStock} (padrão)`}
                                            </span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-xl border p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Vendas recentes
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Últimos pedidos confirmados.
                                </p>
                            </div>
                            <ShoppingBag className="size-5 text-muted-foreground" />
                        </div>

                        {recentSales.length === 0 ? (
                            <EmptyState text="Nenhuma venda registrada ainda." />
                        ) : (
                            <div className="grid divide-y">
                                {recentSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {sale.customer_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {sale.items
                                                    .map(
                                                        (item) =>
                                                            `${item.quantity}x ${item.product_name}`,
                                                    )
                                                    .join(', ')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                {money.format(
                                                    Number(sale.total_amount),
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    sale.created_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <Package className="size-5 text-muted-foreground" />
                            <h2 className="font-semibold">Última viagem</h2>
                        </div>
                        {latestExpenseRecord ? (
                            <>
                                <p className="font-medium">
                                    {latestExpenseRecord.description}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Valor adicional por produto
                                </p>
                                <p className="mt-3 text-2xl font-semibold">
                                    {money.format(
                                        Number(
                                            latestExpenseRecord.cost_per_product,
                                        ),
                                    )}
                                </p>
                                <Link
                                    href="/calculo-de-preco"
                                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                    Calcular preços{' '}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </>
                        ) : (
                            <EmptyState text="Registre uma viagem para calcular preços com precisão." />
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

function MetricCard({
    label,
    value,
    description,
    icon: Icon,
    href,
}: {
    label: string;
    value: string;
    description: string;
    icon: typeof DollarSign;
    href?: string;
}) {
    const content = (
        <>
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </>
    );

    return href ? (
        <Link href={href} className="rounded-xl border p-5 hover:bg-muted/50">
            {content}
        </Link>
    ) : (
        <div className="rounded-xl border p-5">{content}</div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
