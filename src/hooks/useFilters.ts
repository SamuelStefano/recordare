import { useCallback, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';

export const SORTS = ['relevancia', 'preco-asc', 'preco-desc', 'avaliacao'] as const;
export type Sort = (typeof SORTS)[number];

export interface Filters {
  q: string;
  cat: string;
  size: string;
  color: string;
  finish: string;
  sort: Sort;
}

export type FilterKey = keyof Filters;

const EMPTY: Filters = { q: '', cat: '', size: '', color: '', finish: '', sort: 'relevancia' };

function isSort(value: string): value is Sort {
  return (SORTS as readonly string[]).includes(value);
}

// Filtro mora na query string, não em estado local: assim o cliente consegue mandar
// "olha esse aqui" com o link já filtrado, e voltar pelo botão do navegador funciona.
export function useFilters() {
  const [location, navigate] = useLocation();
  const search = useSearch();

  const filters = useMemo<Filters>(() => {
    const params = new URLSearchParams(search);
    const sort = params.get('sort') ?? '';
    return {
      q: params.get('q') ?? '',
      cat: params.get('cat') ?? '',
      size: params.get('size') ?? '',
      color: params.get('color') ?? '',
      finish: params.get('finish') ?? '',
      sort: isSort(sort) ? sort : 'relevancia',
    };
  }, [search]);

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      navigate(qs ? `${location}?${qs}` : location, { replace: true });
    },
    [location, navigate]
  );

  const setFilter = useCallback(
    (key: FilterKey, value: string) => {
      const params = new URLSearchParams(search);
      if (value && value !== EMPTY[key]) params.set(key, value);
      else params.delete(key);
      push(params);
    },
    [search, push]
  );

  const toggleFilter = useCallback(
    (key: FilterKey, value: string) => setFilter(key, filters[key] === value ? '' : value),
    [filters, setFilter]
  );

  const clear = useCallback(() => push(new URLSearchParams()), [push]);

  const activeCount = (['q', 'cat', 'size', 'color', 'finish'] as const).filter(
    (key) => filters[key] !== ''
  ).length;

  return { filters, setFilter, toggleFilter, clear, activeCount };
}
