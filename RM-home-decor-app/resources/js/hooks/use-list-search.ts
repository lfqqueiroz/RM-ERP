import { useEffect, useRef, useState } from 'react';
import { visitList } from '@/lib/list-query';
import type { ListFilters } from '@/types';

/**
 * Campo de busca de uma listagem paginada no servidor: atualiza o texto na
 * hora e recarrega a lista 300 ms depois da última tecla.
 */
export function useListSearch(
    url: string,
    filters: ListFilters,
    only: string[],
    options: { keepSort?: boolean } = {},
) {
    const [search, setSearch] = useState(filters.busca);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    function changeSearch(value: string) {
        setSearch(value);

        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => {
            visitList(
                url,
                {
                    busca: value,
                    ...(options.keepSort
                        ? { ordem: filters.ordem, direcao: filters.direcao }
                        : {}),
                },
                only,
            );
        }, 300);
    }

    return [search, changeSearch] as const;
}
