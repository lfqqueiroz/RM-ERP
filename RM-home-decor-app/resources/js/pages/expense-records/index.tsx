import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { ExpenseRecordForm } from '@/components/expense-records/expense-record-form';
import { ExpenseRecordTable } from '@/components/expense-records/expense-record-table';
import type { ExpenseRecordSortKey } from '@/components/expense-records/expense-record-table';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { useExpenseRecordForm } from '@/hooks/use-expense-record-form';
import { useListSearch } from '@/hooks/use-list-search';
import { visitList } from '@/lib/list-query';
import type { ExpenseRecord, ListFilters, Paginated } from '@/types';

type Props = {
    expenseRecords: Paginated<ExpenseRecord>;
    filters: ListFilters;
};

const LIST_URL = '/registros-de-gastos';

/** Props recarregadas ao buscar, ordenar ou trocar de página. */
const LIST_PROPS = ['expenseRecords', 'filters'];

export default function ExpenseRecords({ expenseRecords, filters }: Props) {
    const formState = useExpenseRecordForm();
    const [deletingRecordId, setDeletingRecordId] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useListSearch(
        LIST_URL,
        filters,
        LIST_PROPS,
        { keepSort: true },
    );
    const sortKey = filters.ordem as ExpenseRecordSortKey;

    /** Mesma coluna inverte a direção; coluna nova começa crescente (data: decrescente). */
    function changeSort(nextSortKey: ExpenseRecordSortKey) {
        const direction =
            nextSortKey === sortKey
                ? filters.direcao === 'asc'
                    ? 'desc'
                    : 'asc'
                : nextSortKey === 'created_at'
                  ? 'desc'
                  : 'asc';

        visitList(
            LIST_URL,
            { busca: searchQuery, ordem: nextSortKey, direcao: direction },
            LIST_PROPS,
        );
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
        router.delete(`${LIST_URL}/${record.id}`, {
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
                                {expenseRecords.total}{' '}
                                {expenseRecords.total === 1
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
                        records={expenseRecords.data}
                        sortKey={sortKey}
                        sortDirection={filters.direcao}
                        onSort={changeSort}
                        deletingRecordId={deletingRecordId}
                        onEdit={editRecord}
                        onDelete={deleteRecord}
                    />

                    <Pagination
                        paginator={expenseRecords}
                        only={LIST_PROPS}
                        itemLabel="registros"
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
