import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import type {
    ExpenseFieldName,
    ExpenseRecordFormState,
} from '@/hooks/use-expense-record-form';
import { formatMoney } from '@/lib/money';

type Props = {
    state: ExpenseRecordFormState;
};

const expenseFieldLabels: Record<ExpenseFieldName, string> = {
    fixed_expenses: 'Gastos fixos',
    gasoline: 'Gasolina',
    vehicle_maintenance: 'Manutenção do veículo',
    tolls: 'Pedágios',
    other_variable_expenses: 'Outros gastos variáveis',
};

export function ExpenseRecordForm({ state }: Props) {
    const { form, editingRecord, totalCost, costPerProduct, submit, cancel } =
        state;

    return (
        <form onSubmit={submit} className="grid gap-6 rounded-xl border p-6">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    name="description"
                    label="Descrição da viagem"
                    value={form.data.description}
                    error={form.errors.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
                <FormField
                    name="product_quantity"
                    label="Quantidade de produtos"
                    type="number"
                    min="1"
                    step="1"
                    value={form.data.product_quantity}
                    error={form.errors.product_quantity}
                    onChange={(event) =>
                        form.setData('product_quantity', event.target.value)
                    }
                />
                {(
                    Object.entries(expenseFieldLabels) as [
                        ExpenseFieldName,
                        string,
                    ][]
                ).map(([name, label]) => (
                    <FormField
                        key={name}
                        name={name}
                        label={label}
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.data[name]}
                        error={form.errors[name]}
                        onChange={(event) =>
                            form.setData(name, event.target.value)
                        }
                    />
                ))}
            </div>

            <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
                <div>
                    <p className="text-sm text-muted-foreground">Custo total</p>
                    <p className="text-xl font-semibold">
                        {formatMoney(totalCost)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">
                        Valor por produto
                    </p>
                    <p className="text-xl font-semibold">
                        {formatMoney(costPerProduct)}
                    </p>
                </div>
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
                        onClick={cancel}
                    >
                        Cancelar edição
                    </Button>
                )}
            </div>
        </form>
    );
}
