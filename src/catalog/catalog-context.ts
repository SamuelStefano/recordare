import { createContext, use } from 'react';
import type { Product } from '../lib/catalog';

export type CatalogStatus = 'loading' | 'ready' | 'error';

export interface CatalogValue {
  products: Product[];
  status: CatalogStatus;
  reload: () => void;
}

export const CatalogContext = createContext<CatalogValue | null>(null);

export function useCatalog(): CatalogValue {
  const value = use(CatalogContext);
  if (!value) throw new Error('useCatalog() exige <CatalogProvider> acima na árvore.');
  return value;
}
