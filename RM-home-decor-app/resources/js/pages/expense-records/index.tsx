import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ExpenseRecordForm } from '@/components/expense-records/expense-record-form';
import { ExpenseRecordTable } from '@/components/expense-records/expense-record-table';
import { sortExpenseRecords } from '@/components/expense-records/sorting';
import type { ExpenseRecordSortKey } from '@/components/expense-records/sorting';
import { SearchInput } from '@/components/search-input';
import type { SortDirection } from '@/components/sortable-header';
import { useExpenseRecordForm } from '@/hooks/use-expense-record-form';
import { matchesSearch } from '@/lib/search';
import type { ExpenseRecord } from '@/types';

type Props = {
    expenseRecords: ExpenseRecord[];
};

export default function ExpenseRecords({ expenseRecords }: Props) {
    const formState = useExpenseRecordForm();
    const [deletingRecordId, setDeletingRecordId] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<ExpenseRecordSortKey>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const visibleRecords = sortExpenseRecords(
        expenseRecords.filter((record) =>
            matchesSearch(searchQuery, record.description),
        ),
        sortKey,
        sortDirection,
    );

    function changeSort(nextSortKey: ExpenseRecordSortKey) {
        if (nextSortKey === sortKey) {
            setSortDirection((direction) =>
                direction === 'asc' ? 'desc' : 'asc',
            );

            return;
        }

        setSortKey(nextSortKey);
        setSortDirection(nextSortKey === 'created_at' ? 'desc' : 'asc');
    }

    function editRecord(record: ExpenseRecord) {
        formState.edit(record);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                if (formState.editingRecord?.id === record.id) {
                    formState.cancel();
                }
            },
            onFinish: () => setDeletingRecordId(null),
        });
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

                <ExpenseRecordForm state={formState} />

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
                                {visibleRecords.length}{' '}
                                {visibleRecords.length === 1
                                    ? 'registro encontrado'
                                    : 'registros encontrados'}
                            </p>
                        </div>

                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            label="Pesquisar registros de gastos"
                            placeholder="Pesquisar por descrição..."
                            className="sm:max-w-md"
                        />
                    </div>

                    <ExpenseRecordTable
                        records={visibleRecords}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={changeSort}
                        deletingRecordId={deletingRecordId}
                        onEdit={editRecord}
                        onDelete={deleteRecord}
                    />
                </section>
            </div>
        </>
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
