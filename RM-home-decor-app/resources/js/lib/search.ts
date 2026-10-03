/** Texto em minúsculas e sem acentos, para busca: "Cerâmica" → "ceramica". */
export function normalizeSearchText(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
}

/**
 * Indica se algum dos campos contém a busca (sem diferenciar maiúsculas nem
 * acentos). Busca vazia corresponde a tudo.
 */
export function matchesSearch(
    query: string,
    ...fields: (string | null | undefined)[]
): boolean {
    const normalizedQuery = normalizeSearchText(query.trim());

    if (!normalizedQuery) {
        return true;
    }

    return fields.some(
        (field) =>
            field !== null &&
            field !== undefined &&
            normalizeSearchText(field).includes(normalizedQuery),
    );
}
