import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = ComponentProps<typeof Input> & {
    label: string;
    /** Texto de ajuda, exibido quando não há erro. */
    hint?: string;
    error?: string;
};

/** Campo obrigatório com rótulo, dica e mensagem de erro. O id é o `name`. */
export function FormField({ label, hint, error, ...props }: Props) {
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
