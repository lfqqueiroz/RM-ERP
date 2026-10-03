/**
 * Mensagens de erro dos campos de um item de lista (ex.: `items.0.quantity`),
 * que o Laravel devolve com o índice do item na chave.
 */
export function itemErrors(
    errors: Partial<Record<string, string>>,
    index: number,
    prefix = 'items',
): string[] {
    const keyPrefix = `${prefix}.${index}.`;

    return Object.entries(errors)
        .filter(([key, message]) => key.startsWith(keyPrefix) && message)
        .map(([, message]) => message as string);
}
