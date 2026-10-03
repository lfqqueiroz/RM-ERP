import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { divideCents, fromCents, toCents } from '@/lib/money';
import type { ExpenseRecord } from '@/types';

const initialData = {
    description: '',
    product_quantity: '',
    fixed_expenses: '0',
    gasoline: '0',
    vehicle_maintenance: '0',
    tolls: '0',
    other_variable_expenses: '0',
};

export type ExpenseFieldName =
    | 'fixed_expenses'
    | 'gasoline'
    | 'vehicle_maintenance'
    | 'tolls'
    | 'other_variable_expenses';

const expenseFields: ExpenseFieldName[] = [
    'fixed_expenses',
    'gasoline',
    'vehicle_maintenance',
    'tolls',
    'other_variable_expenses',
];

/**
 * Formulário de registro de gastos (criar/editar) com a prévia do custo
 * total e do valor por produto, em centavos como no backend.
 */
export function useExpenseRecordForm() {
    const form = useForm(initialData);
    const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(
        null,
    );

    const totalCostCents = expenseFields.reduce(
        (total, field) => total + toCents(form.data[field] || '0'),
        0n,
    );
    const productQuantity = Math.trunc(Number(form.data.product_quantity)) || 0;
    const totalCost = fromCents(totalCostCents);
    const costPerProduct = fromCents(
        divideCents(totalCostCents, productQuantity),
    );

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

    /** Carrega um registro salvo no formulário para edição. */
    function edit(record: ExpenseRecord) {
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
    }

    /** Sai da edição e limpa o formulário. */
    function cancel() {
        form.reset();
        form.clearErrors();
        setEditingRecord(null);
    }

    return {
        form,
        editingRecord,
        totalCost,
        costPerProduct,
        submit,
        edit,
        cancel,
    };
}

export type ExpenseRecordFormState = ReturnType<typeof useExpenseRecordForm>;
