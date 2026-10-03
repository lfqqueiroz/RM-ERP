import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type Props = {
    paginator: Paginated<unknown>;
    /** Props recarregadas ao trocar de página. */
    only: string[];
    /** Nome do item no plural, para o resumo ("produtos"). */
    itemLabel: string;
};

const linkClassName =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors hover:bg-muted';

/** Resumo "1–25 de 71" e navegação entre as páginas da listagem. */
export function Pagination({ paginator, only, itemLabel }: Props) {
    if (paginator.total === 0) {
        return null;
    }

    const previous = paginator.links[0];
    const next = paginator.links[paginator.links.length - 1];
    const pages = paginator.links.slice(1, -1);

    return (
        <nav
            aria-label="Paginação"
            className="flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
            <p className="text-sm text-muted-foreground">
                {paginator.from}–{paginator.to} de {paginator.total} {itemLabel}
            </p>

            {paginator.last_page > 1 && (
                <div className="flex flex-wrap items-center gap-1">
                    <PageLink url={previous?.url ?? null} only={only}>
                        <ChevronLeft className="size-4" />
                        <span className="sr-only sm:not-sr-only">Anterior</span>
                    </PageLink>

                    {pages.map((link, index) =>
                        link.url === null ? (
                            <span
                                key={`gap-${index}`}
                                className="px-2 text-sm text-muted-foreground"
                            >
                                …
                            </span>
                        ) : (
                            <PageLink
                                key={link.url}
                                url={link.url}
                                only={only}
                                active={link.active}
                            >
                                {link.label}
                            </PageLink>
                        ),
                    )}

                    <PageLink url={next?.url ?? null} only={only}>
                        <span className="sr-only sm:not-sr-only">Próxima</span>
                        <ChevronRight className="size-4" />
                    </PageLink>
                </div>
            )}
        </nav>
    );
}

function PageLink({
    url,
    only,
    active = false,
    children,
}: {
    url: string | null;
    only: string[];
    active?: boolean;
    children: React.ReactNode;
}) {
    if (url === null) {
        return (
            <span
                aria-disabled="true"
                className={cn(linkClassName, 'gap-1 opacity-50')}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={url}
            only={only}
            preserveState
            aria-current={active ? 'page' : undefined}
            className={cn(
                linkClassName,
                'gap-1',
                active &&
                    'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
            )}
        >
            {children}
        </Link>
    );
}
