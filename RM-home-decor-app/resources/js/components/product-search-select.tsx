import { Check, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { matchesSearch } from '@/lib/search';
import { cn } from '@/lib/utils';

export type SearchableProduct = {
    id: number;
    name: string;
    sku: string;
};

type Props<T extends SearchableProduct> = {
    id: string;
    products: T[];
    value: string;
    onChange: (productId: string) => void;
    placeholder?: string;
    required?: boolean;
    /** Linha secundária de cada opção, abaixo do nome. */
    describe?: (product: T) => string;
    /** Opções exibidas, mas que não podem ser escolhidas. */
    isDisabled?: (product: T) => boolean;
};

/** Altura máxima da lista (max-h-72), usada para decidir se abre para cima. */
const LIST_MAX_HEIGHT = 288;

/** Combobox de produto com busca por nome ou SKU (sem acentos). */
export function ProductSearchSelect<T extends SearchableProduct>({
    id,
    products,
    value,
    onChange,
    placeholder = 'Pesquise por nome ou SKU...',
    required,
    describe = (product) => product.sku,
    isDisabled,
}: Props<T>) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [opensUpward, setOpensUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedProduct = products.find(
        (product) => product.id === Number(value),
    );
    const selectedLabel = selectedProduct
        ? `${selectedProduct.name} (${selectedProduct.sku})`
        : '';
    const filteredProducts = useMemo(
        () =>
            products.filter((product) =>
                matchesSearch(search, product.name, product.sku),
            ),
        [search, products],
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        listRef.current
            ?.querySelector(`[data-index="${highlightedIndex}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlightedIndex]);

    function openList() {
        const rect = containerRef.current?.getBoundingClientRect();
        const spaceBelow = rect ? window.innerHeight - rect.bottom : Infinity;
        setOpensUpward(
            rect !== undefined &&
                spaceBelow < LIST_MAX_HEIGHT &&
                rect.top > spaceBelow,
        );
        setSearch('');
        setHighlightedIndex(0);
        setIsOpen(true);
    }

    function closeList() {
        setSearch('');
        setIsOpen(false);
    }

    function selectProduct(product: T) {
        if (isDisabled?.(product)) {
            return;
        }

        onChange(String(product.id));
        closeList();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();

            if (!isOpen) {
                openList();

                return;
            }

            setHighlightedIndex((index) =>
                Math.min(index + 1, filteredProducts.length - 1),
            );

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((index) => Math.max(index - 1, 0));

            return;
        }

        if (event.key === 'Enter') {
            if (!isOpen) {
                return;
            }

            event.preventDefault();
            const product = filteredProducts[highlightedIndex];

            if (product) {
                selectProduct(product);
            }

            return;
        }

        if (event.key === 'Escape') {
            closeList();
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                id={id}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={`${id}-options`}
                aria-autocomplete="list"
                autoComplete="off"
                required={required}
                placeholder={
                    isOpen && selectedLabel ? selectedLabel : placeholder
                }
                title={selectedLabel || undefined}
                className="truncate pr-9 pl-9"
                value={isOpen ? search : selectedLabel}
                onFocus={openList}
                onClick={() => {
                    if (!isOpen) {
                        openList();
                    }
                }}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setHighlightedIndex(0);
                    setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsOpen(false)}
            />
            {selectedProduct && !isOpen && (
                <button
                    type="button"
                    aria-label="Limpar produto selecionado"
                    onClick={() => onChange('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {isOpen && (
                <ul
                    ref={listRef}
                    id={`${id}-options`}
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                    className={cn(
                        'absolute z-50 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
                        opensUpward ? 'bottom-full mb-1' : 'top-full mt-1',
                    )}
                >
                    {filteredProducts.length === 0 ? (
                        <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                            Nenhum produto encontrado.
                        </li>
                    ) : (
                        filteredProducts.map((product, index) => {
                            const disabled = isDisabled?.(product) ?? false;
                            const selected = product.id === Number(value);

                            return (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        role="option"
                                        data-index={index}
                                        aria-selected={selected}
                                        aria-disabled={disabled}
                                        onMouseEnter={() =>
                                            setHighlightedIndex(index)
                                        }
                                        onClick={() => selectProduct(product)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm',
                                            disabled
                                                ? 'cursor-not-allowed opacity-50'
                                                : index === highlightedIndex
                                                  ? 'bg-accent text-accent-foreground'
                                                  : 'hover:bg-accent/50',
                                        )}
                                    >
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="font-medium break-words">
                                                {product.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {describe(product)}
                                                {disabled &&
                                                    ' · já está no pedido'}
                                            </span>
                                        </span>
                                        {selected && (
                                            <Check className="h-4 w-4 shrink-0 text-primary" />
                                        )}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}
        </div>
    );
}
