import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchProducts, type Product } from '../lib/catalog';
import { CatalogContext, type CatalogStatus, type CatalogValue } from './catalog-context';

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetchProducts()
      .then((rows) => {
        if (!alive) return;
        setProducts(rows);
        setStatus('ready');
      })
      .catch(() => {
        if (!alive) return;
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<CatalogValue>(
    () => ({ products, status, reload }),
    [products, status, reload]
  );

  return <CatalogContext value={value}>{children}</CatalogContext>;
}
