import { router } from '@inertiajs/react';

/**
 * Recarrega uma listagem com novos parâmetros (`busca`, `ordem`, `direcao`),
 * voltando para a primeira página. Só as props em `only` são recarregadas;
 * as listas de apoio (selects) continuam as mesmas.
 */
export function visitList(
    url: string,
    params: Record<string, string | undefined>,
    only: string[],
): void {
    const query = Object.fromEntries(
        Object.entries(params).filter(
            (entry): entry is [string, string] => !!entry[1]?.trim(),
        ),
    );

    router.get(url, query, {
        only,
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}
