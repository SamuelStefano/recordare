import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { renderWithProviders } from './test/render';
import { CART_STORAGE_KEY } from './cart/CartProvider';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('navegação', () => {
  it('abre a home com o hero e os destaques', async () => {
    renderWithProviders(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Memórias eternizadas em porcelana' })
    ).toBeInTheDocument();
    expect(await screen.findAllByText('Medalhão Oval Clássico')).not.toHaveLength(0);
  });

  it('mostra a página 404 em rota inexistente', () => {
    renderWithProviders(<App />, { route: '/nao-existe' });
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });

  it('fecha o menu com Esc e devolve o foco para o botão que o abriu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    const abrir = screen.getByRole('button', { name: 'Abrir menu' });
    await user.click(abrir);
    expect(document.getElementById('menu-mobile')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(document.getElementById('menu-mobile')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus();
  });

  it('mostra a peça pelo slug e avisa quando o slug não existe', () => {
    const { unmount } = renderWithProviders(<App />, { route: '/peca/placa-retangular-memoria' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Placa Retangular Memória' })
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(<App />, { route: '/peca/sumiu' });
    expect(screen.getByRole('heading', { name: 'Peça não encontrada' })).toBeInTheDocument();
  });
});

describe('idioma', () => {
  it('troca a loja inteira para inglês e marca o documento', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getAllByRole('button', { name: 'en' })[0]);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Memories made eternal in porcelain' })
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('metadados de compartilhamento', () => {
  const meta = (property: string) =>
    document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content;

  it('dá um card à home mesmo sem foto de peça', () => {
    renderWithProviders(<App />);
    expect(meta('og:image')).toMatch(/\/og\.png$/);
    expect(meta('og:title')).toContain('Recordare');
  });

  it('usa a foto da peça quando existe uma', async () => {
    renderWithProviders(<App />, { route: '/peca/medalhao-oval-classico' });
    await waitFor(() => expect(meta('og:image')).not.toMatch(/\/og\.png$/));
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toMatch(
      /\/peca\/medalhao-oval-classico\/$/
    );
  });
});

describe('catálogo', () => {
  it('filtra por categoria pela query string da url', () => {
    renderWithProviders(<App />, { route: '/catalogo?cat=lapides' });
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.getByText('Placa Retangular Memória')).toBeInTheDocument();
    expect(screen.queryByText('Medalhão Oval Clássico')).not.toBeInTheDocument();
  });

  it('busca sem acento', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/catalogo' });

    await user.type(screen.getByRole('searchbox'), 'medalhao');
    await waitFor(() => expect(screen.getByText('1 resultado')).toBeInTheDocument());
  });

  it('oferece limpar filtros quando nada casa', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/catalogo?q=inexistente' });

    expect(screen.getByRole('heading', { name: 'Nenhuma peça com esses filtros' })).toBeInTheDocument();
    const aside = screen.getByRole('complementary', { name: 'Filtros' });
    await user.click(within(aside).getByRole('button', { name: 'Limpar filtros' }));
    await waitFor(() => expect(screen.getByText('3 resultados')).toBeInTheDocument());
  });
});

describe('carrinho', () => {
  it('adiciona a peça com a variante escolhida e mostra no carrinho', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/peca/medalhao-oval-classico' });

    await user.click(screen.getByRole('button', { name: '18x24' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));

    await user.click(screen.getByRole('link', { name: /Abrir carrinho/ }));

    const line = within(screen.getByRole('list', { name: 'Seu carrinho' })).getByRole('listitem');
    expect(within(line).getByText(/18x24/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Seu carrinho' })).toBeInTheDocument();
  });

  it('soma quantidade e remove a linha ao zerar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/peca/medalhao-oval-classico' });

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));
    await user.click(screen.getByRole('link', { name: /Abrir carrinho/ }));

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
    expect(screen.getByLabelText('Quantidade')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'Remover' }));
    expect(screen.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeInTheDocument();
  });

  it('descarta do localStorage a peça que saiu do catálogo', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { id: 'p1', qty: 2 },
        { id: 'peca-morta', qty: 3 },
      ])
    );

    renderWithProviders(<App />, { route: '/carrinho' });

    const lines = within(screen.getByRole('list', { name: 'Seu carrinho' })).getAllByRole(
      'listitem'
    );
    expect(lines).toHaveLength(1);
    expect(
      screen.getByText('Uma peça saiu do catálogo e foi removida do seu carrinho.')
    ).toBeInTheDocument();
  });

  it('mostra frete grátis a partir do piso', async () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ id: 'p1', qty: 2 }]));
    renderWithProviders(<App />, { route: '/carrinho' });

    expect(screen.getByText('Grátis')).toBeInTheDocument();
  });
});

describe('calculadora de área', () => {
  it('aparece só em peça vendida por m² e fecha a caixa', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<App />, { route: '/peca/medalhao-oval-classico' });
    expect(screen.queryByText('Calculadora de área')).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<App />, { route: '/peca/porcelanato-capela-60x60' });
    await user.type(screen.getByLabelText('Área do ambiente (m²)'), '15');

    // 15 m² + 10% de perda ÷ 1,44 m² por caixa = 11,45 → 12 caixas fechadas.
    expect(screen.getByText('12 caixas')).toBeInTheDocument();
  });
});
