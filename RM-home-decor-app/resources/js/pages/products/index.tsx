import { Form, Head, router, useForm } from '@inertiajs/react';
import {
    Pencil,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Product = {
    id: number;
    name: string;
    sku: string;
    cost_price: string;
    sale_price: string;
    stock: number;
    minimum_stock: number;
    price_calculation_id: number | null;
};

type PriceCalculation = {
    id: number;
    product_id: number | null;
    product_name: string;
    final_price: string;
};

type Props = {
    products: Product[];
    priceCalculations: PriceCalculation[];
    defaultMinimumStock: number;
};

type OrderItem = {
    product_id: string;
    quantity: string;
    price_calculation_id: string;
};

export default function Products({
    products,
    priceCalculations,
    defaultMinimumStock,
}: Props) {
    const [sellingProductId, setSellingProductId] = useState<number | null>(
        null,
    );
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(
        null,
    );
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [updatingPriceProductId, setUpdatingPriceProductId] = useState<
        number | null
    >(null);

    const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR');
    const filteredProducts = products.filter((product) => {
        if (!normalizedSearchQuery) {
            return true;
        }

        return (
            product.name
                .toLocaleLowerCase('pt-BR')
                .includes(normalizedSearchQuery) ||
            product.sku
                .toLocaleLowerCase('pt-BR')
                .includes(normalizedSearchQuery)
        );
    });
    const editForm = useForm({
        name: '',
        sku: '',
        cost_price: '',
        stock: '',
        minimum_stock: '',
    });
    const orderForm = useForm<{
        customer_name: string;
        customer_phone: string;
        items: OrderItem[];
    }>({
        customer_name: '',
        customer_phone: '',
        items: [{ product_id: '', quantity: '1', price_calculation_id: '' }],
    });

    function openEditor(product: Product) {
        editForm.clearErrors();
        editForm.setData({
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            stock: String(product.stock),
            minimum_stock: String(product.minimum_stock),
        });
        setEditingProduct(product);
    }

    function effectiveMinimumStock(product: Product) {
        return product.minimum_stock > 0
            ? product.minimum_stock
            : defaultMinimumStock;
    }

    function updateProduct(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        editForm.put(`/produtos/${editingProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingProduct(null),
        });
    }

    function deleteProduct() {
        if (!deletingProduct || deleteProcessing) {
            return;
        }

        setDeleteProcessing(true);
        router.delete(`/produtos/${deletingProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingProduct(null),
            onFinish: () => setDeleteProcessing(false),
        });
    }

    function registerSale(product: Product) {
        if (product.stock === 0 || sellingProductId !== null) {
            return;
        }

        setSellingProductId(product.id);
        router.post(
            `/produtos/${product.id}/venda`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSellingProductId(null),
            },
        );
    }

    function updateOrderItem(
        index: number,
        field: keyof OrderItem,
        value: string,
    ) {
        orderForm.setData(
            'items',
            orderForm.data.items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                          ...(field === 'product_id'
                              ? { price_calculation_id: '' }
                              : {}),
                      }
                    : item,
            ),
        );
    }

    function addOrderItem() {
        orderForm.setData('items', [
            ...orderForm.data.items,
            { product_id: '', quantity: '1', price_calculation_id: '' },
        ]);
    }

    function removeOrderItem(index: number) {
        if (orderForm.data.items.length === 1) {
            return;
        }

        orderForm.setData(
            'items',
            orderForm.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function createOrder() {
        orderForm.post('/vendas', {
            preserveScroll: true,
            onSuccess: () => {
                orderForm.reset();
                setIsOrderOpen(false);
            },
        });
    }

    function updateSelectedPrice(product: Product, priceCalculationId: string) {
        setUpdatingPriceProductId(product.id);
        router.put(
            `/produtos/${product.id}/calculo-preco`,
            { price_calculation_id: priceCalculationId || null },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingPriceProductId(null),
            },
        );
    }

    function priceCalculationsForProduct(productId: string) {
        return priceCalculations.filter(
            (calculation) => calculation.product_id === Number(productId),
        );
    }

    return (
        <>
            <Head title="Produtos" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Produtos</h1>
                        <p className="text-muted-foreground">
                            Cadastre e consulte os produtos.
                        </p>
                    </div>
                    <Button type="button" onClick={() => setIsOrderOpen(true)}>
                        <ShoppingCart />
                        Criar pedido
                    </Button>
                </div>

                <Form
                    action="/produtos"
                    method="post"
                    resetOnSuccess
                    className="grid gap-4 rounded-xl border p-6 md:grid-cols-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <Field
                                name="name"
                                label="Nome"
                                error={errors.name}
                            />

                            <Field
                                name="sku"
                                label="Código/SKU"
                                error={errors.sku}
                            />

                            <Field
                                name="cost_price"
                                label="Preço de custo"
                                type="number"
                                step="0.01"
                                error={errors.cost_price}
                            />

                            <Field
                                name="stock"
                                label="Estoque inicial"
                                type="number"
                                error={errors.stock}
                            />

                            <Field
                                name="minimum_stock"
                                label="Estoque mínimo"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue="0"
                                hint={`Alerta quando o estoque chegar a este valor. Use 0 para o padrão de ${defaultMinimumStock} unidades.`}
                                error={errors.minimum_stock}
                            />

                            <div className="md:col-span-2">
                                <Button disabled={processing}>
                                    {processing
                                        ? 'Salvando...'
                                        : 'Cadastrar produto'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <section className="grid gap-3" aria-labelledby="items-title">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2
                                id="items-title"
                                className="text-lg font-semibold"
                            >
                                Itens cadastrados
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredProducts.length}{' '}
                                {filteredProducts.length === 1
                                    ? 'item encontrado'
                                    : 'itens encontrados'}
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:max-w-md">
                            <div className="relative w-full">
                                <Search
                                    aria-hidden="true"
                                    className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    aria-label="Pesquisar itens cadastrados"
                                    placeholder="Pesquisar por nome ou SKU..."
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setSearchQuery('')}
                                    className="h-9 px-3"
                                >
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Produto
                                    </th>
                                    <th className="px-4 py-3 text-left">SKU</th>
                                    <th className="px-4 py-3 text-left">
                                        Preço salvo
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Valor do produto
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Estoque
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Editar
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Deletar
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Venda
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Nenhum produto encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3">
                                                {product.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {product.sku}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    aria-label={`Selecionar preço salvo para ${product.name}`}
                                                    value={
                                                        product.price_calculation_id ??
                                                        ''
                                                    }
                                                    disabled={
                                                        updatingPriceProductId ===
                                                        product.id
                                                    }
                                                    onChange={(event) =>
                                                        updateSelectedPrice(
                                                            product,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                >
                                                    <option value="">
                                                        Sem preço selecionado
                                                    </option>
                                                    {priceCalculationsForProduct(
                                                        String(product.id),
                                                    ).map((calculation) => (
                                                        <option
                                                            key={calculation.id}
                                                            value={
                                                                calculation.id
                                                            }
                                                        >
                                                            {
                                                                calculation.product_name
                                                            }{' '}
                                                            —{' '}
                                                            {Number(
                                                                calculation.final_price,
                                                            ).toLocaleString(
                                                                'pt-BR',
                                                                {
                                                                    style: 'currency',
                                                                    currency:
                                                                        'BRL',
                                                                },
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {Number(
                                                    product.sale_price,
                                                ).toLocaleString('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span>{product.stock}</span>
                                                    {product.stock <=
                                                        effectiveMinimumStock(
                                                            product,
                                                        ) && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                                                            title={`Estoque mínimo: ${effectiveMinimumStock(product)}${product.minimum_stock > 0 ? '' : ' (padrão)'}`}
                                                        >
                                                            Estoque baixo
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditor(product)
                                                    }
                                                >
                                                    <Pencil />
                                                    Editar
                                                </Button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeletingProduct(
                                                            product,
                                                        )
                                                    }
                                                >
                                                    <Trash2 />
                                                    Excluir
                                                </Button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {product.stock === 0 ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <ShoppingCart />
                                                            Unidade vendida
                                                        </Button>
                                                        <span className="text-xs font-medium text-destructive">
                                                            Estoque vazio
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={
                                                            sellingProductId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            registerSale(
                                                                product,
                                                            )
                                                        }
                                                    >
                                                        <ShoppingCart />
                                                        {sellingProductId ===
                                                        product.id
                                                            ? 'Registrando...'
                                                            : 'Vender 1 unidade'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <Dialog
                    open={editingProduct !== null}
                    onOpenChange={(open) => {
                        if (!open && !editForm.processing) {
                            setEditingProduct(null);
                            editForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <form onSubmit={updateProduct} className="grid gap-6">
                            <DialogHeader>
                                <DialogTitle>Editar produto</DialogTitle>
                                <DialogDescription>
                                    Atualize os dados de {editingProduct?.name}.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    name="edit_name"
                                    label="Nome"
                                    value={editForm.data.name}
                                    error={editForm.errors.name}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                />
                                <Field
                                    name="edit_sku"
                                    label="Código/SKU"
                                    value={editForm.data.sku}
                                    error={editForm.errors.sku}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'sku',
                                            event.target.value,
                                        )
                                    }
                                />
                                <Field
                                    name="edit_cost_price"
                                    label="Preço de custo"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.data.cost_price}
                                    error={editForm.errors.cost_price}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'cost_price',
                                            event.target.value,
                                        )
                                    }
                                />
                                <Field
                                    name="edit_stock"
                                    label="Estoque atual"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.data.stock}
                                    error={editForm.errors.stock}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'stock',
                                            event.target.value,
                                        )
                                    }
                                />
                                <Field
                                    name="edit_minimum_stock"
                                    label="Estoque mínimo"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.data.minimum_stock}
                                    hint={`Use 0 para o padrão de ${defaultMinimumStock} unidades.`}
                                    error={editForm.errors.minimum_stock}
                                    onChange={(event) =>
                                        editForm.setData(
                                            'minimum_stock',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={editForm.processing}
                                    >
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                >
                                    {editForm.processing
                                        ? 'Salvando...'
                                        : 'Salvar alterações'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={deletingProduct !== null}
                    onOpenChange={(open) => {
                        if (!open && !deleteProcessing) {
                            setDeletingProduct(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <TriangleAlert className="size-5" />
                            </div>
                            <DialogTitle>Excluir produto?</DialogTitle>
                            <DialogDescription>
                                O produto{' '}
                                <strong className="text-foreground">
                                    {deletingProduct?.name}
                                </strong>{' '}
                                será removido permanentemente. Essa ação não
                                poderá ser desfeita.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={deleteProcessing}
                                >
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={deleteProcessing}
                                onClick={deleteProduct}
                            >
                                <Trash2 />
                                {deleteProcessing
                                    ? 'Excluindo...'
                                    : 'Excluir definitivamente'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isOrderOpen}
                    onOpenChange={(open) => {
                        if (!open && !orderForm.processing) {
                            orderForm.reset();
                            orderForm.clearErrors();
                            setIsOrderOpen(false);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <form
                            className="grid gap-6"
                            onSubmit={(event) => {
                                event.preventDefault();
                                createOrder();
                            }}
                        >
                            <DialogHeader>
                                <DialogTitle>Criar pedido</DialogTitle>
                                <DialogDescription>
                                    Selecione os produtos e as quantidades. Ao
                                    confirmar, o pedido será registrado.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_name">
                                        Nome do cliente
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        required
                                        value={orderForm.data.customer_name}
                                        onChange={(event) =>
                                            orderForm.setData(
                                                'customer_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {orderForm.errors.customer_name && (
                                        <p className="text-sm text-destructive">
                                            {orderForm.errors.customer_name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_phone">
                                        Número de telefone
                                    </Label>
                                    <Input
                                        id="customer_phone"
                                        required
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="(00) 00000-0000"
                                        value={orderForm.data.customer_phone}
                                        onChange={(event) =>
                                            orderForm.setData(
                                                'customer_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {orderForm.errors.customer_phone && (
                                        <p className="text-sm text-destructive">
                                            {orderForm.errors.customer_phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {orderForm.data.items.map((item, index) => {
                                    return (
                                        <div
                                            key={index}
                                            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_12rem_9rem_auto] sm:items-end"
                                        >
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`order-product-${index}`}
                                                >
                                                    Produto
                                                </Label>
                                                <select
                                                    id={`order-product-${index}`}
                                                    required
                                                    value={item.product_id}
                                                    onChange={(event) =>
                                                        updateOrderItem(
                                                            index,
                                                            'product_id',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                >
                                                    <option value="">
                                                        Selecione um produto
                                                    </option>
                                                    {products.map((product) => (
                                                        <option
                                                            key={product.id}
                                                            value={product.id}
                                                            disabled={orderForm.data.items.some(
                                                                (
                                                                    orderItem,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                        index &&
                                                                    Number(
                                                                        orderItem.product_id,
                                                                    ) ===
                                                                        product.id,
                                                            )}
                                                        >
                                                            {product.name} (
                                                            {product.sku}) —{' '}
                                                            {product.stock} em
                                                            estoque
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`order-price-${index}`}
                                                >
                                                    Preço salvo
                                                </Label>
                                                <select
                                                    id={`order-price-${index}`}
                                                    required
                                                    disabled={!item.product_id}
                                                    value={
                                                        item.price_calculation_id
                                                    }
                                                    onChange={(event) =>
                                                        updateOrderItem(
                                                            index,
                                                            'price_calculation_id',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">
                                                        {item.product_id
                                                            ? 'Selecione o preço'
                                                            : 'Selecione o produto'}
                                                    </option>
                                                    {priceCalculationsForProduct(
                                                        item.product_id,
                                                    ).map((calculation) => (
                                                        <option
                                                            key={calculation.id}
                                                            value={
                                                                calculation.id
                                                            }
                                                        >
                                                            {Number(
                                                                calculation.final_price,
                                                            ).toLocaleString(
                                                                'pt-BR',
                                                                {
                                                                    style: 'currency',
                                                                    currency:
                                                                        'BRL',
                                                                },
                                                            )}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`order-quantity-${index}`}
                                                >
                                                    Quantidade
                                                </Label>
                                                <Input
                                                    id={`order-quantity-${index}`}
                                                    required
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(event) =>
                                                        updateOrderItem(
                                                            index,
                                                            'quantity',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={
                                                    orderForm.data.items
                                                        .length === 1
                                                }
                                                onClick={() =>
                                                    removeOrderItem(index)
                                                }
                                                aria-label="Remover produto do pedido"
                                            >
                                                <X />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>

                            {orderForm.errors.items && (
                                <p className="text-sm text-destructive">
                                    {orderForm.errors.items}
                                </p>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-fit"
                                onClick={addOrderItem}
                            >
                                <Plus />
                                Adicionar produto
                            </Button>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={orderForm.processing}
                                    >
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={orderForm.processing}
                                >
                                    <ShoppingCart />
                                    {orderForm.processing
                                        ? 'Confirmando...'
                                        : 'Confirmar venda'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

function Field({
    label,
    hint,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    hint?: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={props.name}>{label}</Label>
            <Input id={props.name} required {...props} />
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

Products.layout = {
    breadcrumbs: [
        {
            title: 'Produtos',
            href: '/produtos',
        },
    ],
};
