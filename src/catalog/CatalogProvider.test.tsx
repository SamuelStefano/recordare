import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { LangProvider } from '../i18n/LangProvider';
import { testProducts } from '../test/render';
import { CatalogProvider } from './CatalogProvider';
import { useCatalog } from './catalog-context';

const fetchProducts = vi.hoisted(() => vi.fn());

vi.mock('../lib/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/catalog')>()),
  fetchProducts,
}));

function Sonda() {
  const { products, status, reload } = useCatalog();
  return (
    <div>
      <span data-testid="estado">{status}</span>
      <span data-testid="quantas">{products.length}</span>
      <button onClick={reload}>recarregar</button>
    </div>
  );
}

function montar() {
  const { hook } = memoryLocation({ path: '/' });
  return render(
    <Router hook={hook}>
      <LangProvider>
        <CatalogProvider>
          <Sonda />
        </CatalogProvider>
      </LangProvider>
    </Router>
  );
}

beforeEach(() => {
  localStorage.clear();
  fetchProducts.mockReset();
});

describe('CatalogProvider', () => {
  it('entrega o catálogo quando o banco responde', async () => {
    fetchProducts.mockResolvedValue(testProducts);
    montar();

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('ready'));
    expect(screen.getByTestId('quantas')).toHaveTextContent('3');
  });

  // Sem isto a loja fica no esqueleto para sempre quando o Supabase cai: o cliente vê uma vitrine
  // que parece estar carregando e vai embora sem saber que houve erro.
  it('vira estado de erro quando o banco falha e se recupera no retry', async () => {
    const user = userEvent.setup();
    fetchProducts.mockRejectedValueOnce(new Error('rede caiu'));
    montar();

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('error'));

    fetchProducts.mockResolvedValueOnce(testProducts);
    await user.click(screen.getByRole('button', { name: 'recarregar' }));

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('ready'));
    expect(screen.getByTestId('quantas')).toHaveTextContent('3');
  });
});
