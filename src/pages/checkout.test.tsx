import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { CART_STORAGE_KEY } from '../cart/CartProvider';
import { renderWithProviders } from '../test/render';

const createOrder = vi.hoisted(() => vi.fn());

vi.mock('../lib/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/catalog')>()),
  createOrder,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  createOrder.mockReset();
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ id: 'p1', qty: 1, size: '13x18' }]));
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome completo'), 'Maria Silva');
  await user.type(screen.getByLabelText('WhatsApp com DDD'), '44999990000');
}

describe('checkout', () => {
  it('recusa envio com dados inválidos e não chama o banco', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/carrinho' });

    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    expect(screen.getByText('Informe seu nome completo (mínimo 2 caracteres).')).toBeInTheDocument();
    expect(screen.getByText('Informe um telefone válido, com DDD.')).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('registra o pedido, esvazia o carrinho e mostra o número', async () => {
    const user = userEvent.setup();
    createOrder.mockResolvedValue('7b2f4a10-0000-4000-8000-000000000000');
    renderWithProviders(<App />, { route: '/carrinho' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Pedido recebido' })).toBeInTheDocument()
    );
    expect(screen.getByText('7B2F4A10')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')).toEqual([]);
  });

  it('nunca manda o total: quem calcula é o trigger do banco', async () => {
    const user = userEvent.setup();
    createOrder.mockResolvedValue('7b2f4a10-0000-4000-8000-000000000000');
    renderWithProviders(<App />, { route: '/carrinho' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder.mock.calls[0][0]).not.toHaveProperty('total');
    expect(createOrder.mock.calls[0][0]).toMatchObject({
      customer: 'Maria Silva',
      phone: '44999990000',
      items: [{ id: 'p1', qty: 1, size: '13x18' }],
    });
  });

  it('preserva o carrinho quando o registro falha', async () => {
    const user = userEvent.setup();
    createOrder.mockRejectedValue(new Error('rede caiu'));
    renderWithProviders(<App />, { route: '/carrinho' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    await waitFor(() =>
      expect(
        screen.getByText(
          'Não conseguimos registrar seu pedido. Seu carrinho está intacto — tente de novo.'
        )
      ).toBeInTheDocument()
    );
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });

  it('esconde o atalho do WhatsApp quando o número não está configurado', async () => {
    const user = userEvent.setup();
    createOrder.mockResolvedValue('7b2f4a10-0000-4000-8000-000000000000');
    renderWithProviders(<App />, { route: '/carrinho' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Pedido recebido' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('link', { name: 'Continuar no WhatsApp' })).not.toBeInTheDocument();
    expect(screen.getByText('Entraremos em contato pelo telefone informado.')).toBeInTheDocument();
  });

  it('oferece o WhatsApp com a mensagem do pedido quando há número', async () => {
    vi.stubEnv('VITE_WHATSAPP_PHONE', '+55 (44) 99999-0000');
    const user = userEvent.setup();
    createOrder.mockResolvedValue('7b2f4a10-0000-4000-8000-000000000000');
    renderWithProviders(<App />, { route: '/carrinho' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    const link = await screen.findByRole('link', { name: 'Continuar no WhatsApp' });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5544999990000'));
    expect(link).toHaveAttribute('href', expect.stringContaining('7B2F4A10'));
    vi.unstubAllEnvs();
  });
});
