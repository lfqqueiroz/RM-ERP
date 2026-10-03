import { Form } from '@inertiajs/react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';

type Props = {
    defaultMinimumStock: number;
};

export function ProductCreateForm({ defaultMinimumStock }: Props) {
    return (
        <Form
            action="/produtos"
            method="post"
            resetOnSuccess
            className="grid gap-4 rounded-xl border p-6 md:grid-cols-2"
        >
            {({ errors, processing }) => (
                <>
                    <FormField name="name" label="Nome" error={errors.name} />

                    <FormField
                        name="sku"
                        label="Código/SKU"
                        error={errors.sku}
                    />

                    <FormField
                        name="cost_price"
                        label="Preço de custo"
                        type="number"
                        step="0.01"
                        error={errors.cost_price}
                    />

                    <FormField
                        name="stock"
                        label="Estoque inicial"
                        type="number"
                        error={errors.stock}
                    />

                    <FormField
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
                            {processing ? 'Salvando...' : 'Cadastrar produto'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
