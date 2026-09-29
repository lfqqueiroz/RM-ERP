import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ExpenseRecord = {
    id: number;
    description: string;
    product_quantity: number;
    fixed_expenses: string;
    gasoline: string;
    vehicle_maintenance: string;
    tolls: string;
    other_variable_expenses: string;
    total_cost: string;
    cost_per_product: string;
    created_at: string;
};

type Props = {
    expenseRecords: ExpenseRecord[];
};

const initialData = {
    description: '',
    product_quantity: '',
    fixed_expenses: '0',
    gasoline: '0',
    vehicle_maintenance: '0',
    tolls: '0',
    other_variable_expenses: '0',
};

type FormData = typeof initialData;
type SortKey =
    | 'created_at'
    | 'description'
    | 'product_quantity'
    | 'total_cost'
    | 'cost_per_product';
type SortDirection = 'asc' | 'desc';
type MoneyFieldName =
    | 'fixed_expenses'
    | 'gasoline'
    | 'vehicle_maintenance'
    | 'tolls'
    | 'other_variable_expenses';

const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export default function ExpenseRecords({ expenseRecords }: Props) {
    const form = useForm<FormData>(initialData);
    const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(
        null,
    );
    const [deletingRecordId, setDeletingRecordId] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const expenseFields: MoneyFieldName[] = [
        'fixed_expenses',
        'gasoline',
        'vehicle_maintenance',
        'tolls',
        'other_variable_expenses',
    ];
    const totalCost = expenseFields.reduce(
        (total, field) => total + (Number(form.data[field]) || 0),
        0,
    );
    const productQuantity = Number(form.data.product_quantity) || 0;
    const costPerProduct =
        productQuantity > 0 ? totalCost / productQuantity : 0;
    const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR');
    const filteredRecords = expenseRecords.filter((record) =>
        record.description
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearchQuery),
    );
    const sortedRecords = [...filteredRecords].sort((first, second) => {
        let comparison = 0;

        if (sortKey === 'description') {
            comparison = first.description.localeCompare(
                second.description,
                'pt-BR',
            );
        } else if (sortKey === 'created_at') {
            comparison =
                new Date(first.created_at).getTime() -
                new Date(second.created_at).getTime();
        } else {
            comparison = Number(first[sortKey]) - Number(second[sortKey]);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    function changeSort(nextSortKey: SortKey) {
        if (nextSortKey === sortKey) {
            setSortDirection((direction) =>
                direction === 'asc' ? 'desc' : 'asc',
            );

            return;
        }

        setSortKey(nextSortKey);
        setSortDirection(nextSortKey === 'created_at' ? 'desc' : 'asc');
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setEditingRecord(null);
            },
        };

        if (editingRecord) {
            form.put(`/registros-de-gastos/${editingRecord.id}`, options);

            return;
        }

        form.post('/registros-de-gastos', options);
    }

    function editRecord(record: ExpenseRecord) {
        form.clearErrors();
        form.setData({
            description: record.description,
            product_quantity: String(record.product_quantity),
            fixed_expenses: record.fixed_expenses,
            gasoline: record.gasoline,
            vehicle_maintenance: record.vehicle_maintenance,
            tolls: record.tolls,
            other_variable_expenses: record.other_variable_expenses,
        });
        setEditingRecord(record);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEditing() {
        form.reset();
        form.clearErrors();
        setEditingRecord(null);
    }

    function deleteRecord(record: ExpenseRecord) {
        if (
            deletingRecordId !== null ||
            !window.confirm(`Excluir o registro “${record.description}”?`)
        ) {
            return;
        }

        setDeletingRecordId(record.id);
        router.delete(`/registros-de-gastos/${record.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editingRecord?.id === record.id) {
                    cancelEditing();
                }
            },
            onFinish: () => setDeletingRecordId(null),
        });
    }

    function expenseField(name: MoneyFieldName, label: string) {
        return (
            <Field
                name={name}
                label={label}
                type="number"
                min="0"
                step="0.01"
                value={form.data[name]}
                error={form.errors[name]}
                onChange={(event) => form.setData(name, event.target.value)}
            />
        );
    }

    return (
        <>
            <Head title="Registros de gastos" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Gastos da Viagem</h1>
                    <p className="text-muted-foreground">
                        Saber o quanto cada produto custou.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-6 rounded-xl border p-6"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            name="description"
                            label="Descrição da viagem"
                            value={form.data.description}
                            error={form.errors.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                        />
                        <Field
                            name="product_quantity"
                            label="Quantidade de produtos"
                            type="number"
                            min="1"
                            step="1"
                            value={form.data.product_quantity}
                            error={form.errors.product_quantity}
                            onChange={(event) =>
                                form.setData(
                                    'product_quantity',
                                    event.target.value,
                                )
                            }
                        />
                        {expenseField('fixed_expenses', 'Gastos fixos')}
                        {expenseField('gasoline', 'Gasolina')}
                        {expenseField(
                            'vehicle_maintenance',
                            'Manutenção do veículo',
                        )}
                        {expenseField('tolls', 'Pedágios')}
                        {expenseField(
                            'other_variable_expenses',
                            'Outros gastos variáveis',
                        )}
                    </div>

                    <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
                        <Summary label="Custo total" value={totalCost} />
                        <Summary
                            label="Valor por produto"
                            value={costPerProduct}
                        />
                    </div>

                    <div>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Salvando...'
                                : editingRecord
                                  ? 'Salvar alterações'
                                  : 'Salvar registro de gastos'}
                        </Button>
                        {editingRecord && (
                            <Button
                                type="button"
                                variant="outline"
                                className="ml-2"
                                disabled={form.processing}
                                onClick={cancelEditing}
                            >
                                Cancelar edição
                            </Button>
                        )}
                    </div>
                </form>

                <section className="grid gap-3" aria-labelledby="records-title">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2
                                id="records-title"
                                className="text-lg font-semibold"
                            >
                                Registros salvos
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {sortedRecords.length}{' '}
                                {sortedRecords.length === 1
                                    ? 'registro encontrado'
                                    : 'registros encontrados'}
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:max-w-md">
                            <div className="relative w-full">
                                <Search
                                    aria-hidden="true"
                                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    aria-label="Pesquisar registros de gastos"
                                    placeholder="Pesquisar por descrição..."
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
                                    className="h-9 px-3"
                                    onClick={() => setSearchQuery('')}
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
                                    <SortHeader
                                        label="Data"
                                        sortKey="created_at"
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={changeSort}
                                    />
                                    <SortHeader
                                        label="Descrição"
                                        sortKey="description"
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={changeSort}
                                    />
                                    <SortHeader
                                        label="Quantidade"
                                        sortKey="product_quantity"
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={changeSort}
                                        align="right"
                                    />
                                    <SortHeader
                                        label="Custo total"
                                        sortKey="total_cost"
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={changeSort}
                                        align="right"
                                    />
                                    <SortHeader
                                        label="Valor por produto"
                                        sortKey="cost_per_product"
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={changeSort}
                                        align="right"
                                    />
                                    <th className="px-4 py-3 text-right">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecords.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRecords.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    record.created_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {record.description}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {record.product_quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {money.format(
                                                    Number(record.total_cost),
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {money.format(
                                                    Number(
                                                        record.cost_per_product,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            editRecord(record)
                                                        }
                                                    >
                                                        <Pencil />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        disabled={
                                                            deletingRecordId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            deleteRecord(record)
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {deletingRecordId ===
                                                        record.id
                                                            ? 'Excluindo...'
                                                            : 'Excluir'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={props.name}>{label}</Label>
            <Input id={props.name} required {...props} />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function Summary({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{money.format(value)}</p>
        </div>
    );
}

function SortHeader({
    label,
    sortKey,
    activeSortKey,
    direction,
    onSort,
    align = 'left',
}: {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    direction: SortDirection;
    onSort: (sortKey: SortKey) => void;
    align?: 'left' | 'right';
}) {
    const isActive = sortKey === activeSortKey;

    return (
        <th
            aria-sort={
                isActive
                    ? direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
            className={
                align === 'right'
                    ? 'px-4 py-3 text-right'
                    : 'px-4 py-3 text-left'
            }
        >
            <button
                type="button"
                className={`inline-flex items-center gap-1 font-medium hover:text-foreground ${
                    align === 'right' ? 'ml-auto' : ''
                }`}
                onClick={() => onSort(sortKey)}
            >
                {label}
                {isActive && direction === 'asc' ? (
                    <ArrowUp aria-hidden="true" className="size-3" />
                ) : isActive ? (
                    <ArrowDown aria-hidden="true" className="size-3" />
                ) : null}
            </button>
        </th>
    );
}

ExpenseRecords.layout = {
    breadcrumbs: [
        {
            title: 'Registros de gastos',
            href: '/registros-de-gastos',
        },
    ],
};
