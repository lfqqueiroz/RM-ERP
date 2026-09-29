import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SearchableProduct = {
    id: number;
    name: string;
    sku: string;
    cost_price: string;
};

type Props = {
    id: string;
    products: SearchableProduct[];
    value: string;
    onChange: (productId: string) => void;
    placeholder?: string;
};

const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export function ProductSearchSelect({
    id,
    products,
    value,
    onChange,
    placeholder = 'Pesquise por nome ou SKU...',
}: Props) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const selectedProduct = products.find(
        (product) => product.id === Number(value),
    );
    const selectedLabel = selectedProduct
        ? `${selectedProduct.name} (${selectedProduct.sku})`
        : '';
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    const filteredProducts = useMemo(
        () =>
            products.filter((product) => {
                if (!normalizedSearch) {
                    return true;
                }

                return (
                    product.name
                        .toLocaleLowerCase('pt-BR')
                        .includes(normalizedSearch) ||
                    product.sku
                        .toLocaleLowerCase('pt-BR')
                        .includes(normalizedSearch)
                );
            }),
        [normalizedSearch, products],
    );

    function openList() {
        setSearch('');
        setHighlightedIndex(0);
        setIsOpen(true);
    }

    function closeList() {
        setSearch('');
        setIsOpen(false);
    }

    function selectProduct(product: SearchableProduct) {
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
        <div className="relative">
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
                placeholder={placeholder}
                className="pr-9 pl-9"
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
                    id={`${id}-options`}
                    role="listbox"
                    onMouseDown={(event) => event.preventDefault()}
                    className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background p-1 shadow-md"
                >
                    {filteredProducts.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                            Nenhum produto encontrado.
                        </li>
                    ) : (
                        filteredProducts.map((product, index) => (
                            <li key={product.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={product.id === Number(value)}
                                    onMouseEnter={() =>
                                        setHighlightedIndex(index)
                                    }
                                    onClick={() => selectProduct(product)}
                                    className={cn(
                                        'flex w-full flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-left text-sm',
                                        index === highlightedIndex
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-muted',
                                    )}
                                >
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {product.sku} ·{' '}
                                        {money.format(
                                            Number(product.cost_price),
                                        )}
                                    </span>
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
