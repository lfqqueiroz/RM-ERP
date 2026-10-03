import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
    value: string;
    onChange: (value: string) => void;
    /** Rótulo acessível do campo. */
    label: string;
    placeholder: string;
    className?: string;
};

/** Campo de busca com ícone e botão "Limpar" quando há texto. */
export function SearchInput({
    value,
    onChange,
    label,
    placeholder,
    className,
}: Props) {
    return (
        <div className={cn('flex w-full items-center gap-2', className)}>
            <div className="relative w-full">
                <Search
                    aria-hidden="true"
                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    aria-label={label}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="pl-9"
                />
            </div>
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
