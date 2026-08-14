import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { CartProvider } from '../cart/CartProvider';
import { CatalogContext, type CatalogStatus } from '../catalog/catalog-context';
import { LangProvider } from '../i18n/LangProvider';
import type { Product } from '../lib/catalog';
import { makeProduct } from './factories';

export const testProducts: Product[] = [
  makeProduct({
    id: 'p1',
    slug: 'medalhao-oval-classico',
    sku: 'REC-MED-001',
    price: 249,
    sort_order: 1,
    name_pt: 'Medalhão Oval Clássico',
    name_en: 'Classic Oval Medallion',
    badge_pt: 'Mais vendido',
    badge_en: 'Bestseller',
  }),
  makeProduct({
    id: 'p2',
    slug: 'placa-retangular-memoria',
    sku: 'REC-LAP-001',
    cat: 'lapides',
    price: 299,
    sort_order: 2,
    name_pt: 'Placa Retangular Memória',
    name_en: 'Rectangular Memory Plaque',
    sizes: ['24x30'],
    colors: ['preto'],
    finishes: ['fosco'],
  }),
  makeProduct({
    id: 'p3',
    slug: 'porcelanato-capela-60x60',
    sku: 'REC-POR-001',
    cat: 'porcelanato',
    price: 189,
    unit: 'm2',
    sort_order: 3,
    name_pt: 'Porcelanato Capela 60×60',
    name_en: 'Chapel Porcelain Tile 60×60',
    sizes: ['60x60', '80x80'],
    colors: ['cinza'],
    finishes: ['acetinado'],
  }),
];

interface Options {
  route?: string;
  products?: Product[];
  status?: CatalogStatus;
  lang?: 'pt' | 'en';
}

// O catálogo entra por contexto em vez de mock de rede: o teste passa a exercitar a
// árvore de verdade (carrinho, filtros, rota) sem depender de Supabase nenhum.
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', products = testProducts, status = 'ready', lang = 'pt' } = options;
  // jsdom se apresenta como en-US; sem fixar o idioma o teste passaria a exercitar a
  // loja em inglês sem ninguém perceber.
  localStorage.setItem('recordare.lang.v1', lang);
  const { hook, navigate } = memoryLocation({ path: route, record: true });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Router hook={hook}>
        <LangProvider>
          <CatalogContext value={{ products, status, reload: () => {} }}>
            <CartProvider>{children}</CartProvider>
          </CatalogContext>
        </LangProvider>
      </Router>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), navigate };
}
