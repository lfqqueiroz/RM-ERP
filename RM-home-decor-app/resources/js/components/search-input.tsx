import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
    value: string;
    onChange: (value: string) => void;
    /** Rótulo acessível do campo. */
    label: string;
    placeholder: string;
    className?: string;
    /** Rótulo visível acima do campo (precisa de `id`). */
    visibleLabel?: string;
    /** Classes do bloco rótulo + campo (ex.: largura fixa). */
    fieldClassName?: string;
    id?: string;
};

/** Campo de busca com ícone e botão "Limpar" quando há texto. */
export function SearchInput({
    value,
    onChange,
    label,
    placeholder,
    className,
    visibleLabel,
    fieldClassName,
    id,
}: Props) {
    const input = (
        <div className="relative w-full">
            <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                id={id}
                aria-label={visibleLabel ? undefined : label}
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="pl-9"
            />
        </div>
    );

    return (
        <div
            className={cn(
                'flex w-full gap-2',
                visibleLabel ? 'items-end' : 'items-center',
                className,
            )}
        >
            {visibleLabel ? (
                <div className={cn('grid w-full gap-1', fieldClassName)}>
                    <Label htmlFor={id}>{visibleLabel}</Label>
                    {input}
                </div>
            ) : (
                input
            )}
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={() => onChange('')}
                >
                    Limpar
                </Button>
            )}
        </div>
    );
}
