/** Link do paginador do Laravel (`links` de LengthAwarePaginator). */
export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

/** Listagem paginada como o Laravel serializa `paginate()`. */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

/** Filtros da listagem, ecoados pelo backend (`App\Support\ListQuery`). */
export type ListFilters = {
    busca: string;
    ordem: string;
    direcao: 'asc' | 'desc';
};
