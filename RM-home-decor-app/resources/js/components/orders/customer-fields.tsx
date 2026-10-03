import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type CustomerData = {
    customer_name: string;
    customer_phone: string;
};

type Props = {
    data: CustomerData;
    errors: Partial<Record<keyof CustomerData, string>>;
    onChange: (field: keyof CustomerData, value: string) => void;
    /** Prefixo dos ids dos campos, único por formulário. */
    idPrefix: string;
};

/** Nome e telefone do cliente de um pedido. */
export function CustomerFields({ data, errors, onChange, idPrefix }: Props) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-customer-name`}>
                    Nome do cliente
                </Label>
                <Input
                    id={`${idPrefix}-customer-name`}
                    required
                    value={data.customer_name}
                    onChange={(event) =>
                        onChange('customer_name', event.target.value)
                    }
                />
                {errors.customer_name && (
                    <p className="text-sm text-destructive">
                        {errors.customer_name}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-customer-phone`}>
                    Número de telefone
                </Label>
                <Input
                    id={`${idPrefix}-customer-phone`}
                    required
                    type="tel"
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    value={data.customer_phone}
                    onChange={(event) =>
                        onChange('customer_phone', event.target.value)
                    }
                />
                {errors.customer_phone && (
                    <p className="text-sm text-destructive">
                        {errors.customer_phone}
                    </p>
                )}
            </div>
        </>
    );
}
