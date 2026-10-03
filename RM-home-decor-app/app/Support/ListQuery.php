<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Parâmetros de uma listagem paginada: `?busca=&ordem=&direcao=&pagina=`.
 *
 * Valores inválidos de ordem/direção caem no padrão em vez de gerar erro,
 * para que URLs editadas à mão ou antigas continuem abrindo a página.
 */
final class ListQuery
{
    public const PER_PAGE = 25;

    public const PAGE_NAME = 'pagina';

    /**
     * @param  'asc'|'desc'  $direction
     */
    private function __construct(
        public readonly string $search,
        public readonly string $sort,
        public readonly string $direction,
    ) {}

    /**
     * @param  list<string>  $sortable  colunas aceitas em `ordem` (whitelist)
     * @param  'asc'|'desc'  $defaultDirection
     */
    public static function fromRequest(
        Request $request,
        array $sortable = [],
        string $defaultSort = 'created_at',
        string $defaultDirection = 'desc',
    ): self {
        $search = mb_substr(trim($request->string('busca')->toString()), 0, 100);
        $sort = $request->string('ordem')->toString();
        $direction = $request->string('direcao')->toString();

        return new self(
            $search,
            in_array($sort, $sortable, true) ? $sort : $defaultSort,
            match ($direction) {
                'asc', 'desc' => $direction,
                default => $defaultDirection,
            },
        );
    }

    public function hasSearch(): bool
    {
        return $this->search !== '';
    }

    /**
     * Padrão para `LIKE` (contém). `%` e `_` digitados funcionam como curingas;
     * o valor vai sempre como parâmetro, nunca concatenado no SQL.
     */
    public function likePattern(): string
    {
        return '%'.$this->search.'%';
    }

    /**
     * Página pedida além da última (ex.: o último item da página foi
     * excluído): redireciona para a última página existente.
     *
     * @param  LengthAwarePaginator<int, mixed>  $paginator
     */
    public static function redirectIfPastLastPage(LengthAwarePaginator $paginator): ?RedirectResponse
    {
        if ($paginator->currentPage() > 1 && $paginator->currentPage() > $paginator->lastPage()) {
            return redirect()->to($paginator->url($paginator->lastPage()));
        }

        return null;
    }

    /**
     * @return array{busca: string, ordem: string, direcao: string}
     */
    public function toArray(): array
    {
        return [
            'busca' => $this->search,
            'ordem' => $this->sort,
            'direcao' => $this->direction,
        ];
    }
}
