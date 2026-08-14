import { makeProduct } from '../test/factories';
import {
  CSV_COLUMNS,
  MAX_TITLE,
  buildDescription,
  buildKit,
  buildListing,
  buildTitle,
  toCsv,
  toMarkdown,
} from './mercadolivre';

const STORE = 'https://recordare.com.br';

const medalhao = makeProduct({
  id: 'p1',
  slug: 'medalhao-oval-classico',
  sku: 'REC-MED-001',
  price: 249,
  stock: 40,
  name_pt: 'Medalhão Oval Clássico',
  sizes: ['13x18', '18x24'],
  colors: ['branco'],
  finishes: ['fosco'],
});

describe('buildTitle', () => {
  it('segue o padrão produto + marca + especificação', () => {
    expect(buildTitle(medalhao)).toBe('Medalhão Oval Clássico Recordare 13x18');
  });

  it('corta a especificação antes de estourar 60 caracteres', () => {
    const longo = makeProduct({
      name_pt: 'Placa Memorial Dupla em Porcelana Vitrificada Premium',
      sizes: ['30x40'],
    });
    expect(buildTitle(longo).length).toBeLessThanOrEqual(MAX_TITLE);
    expect(buildTitle(longo)).toBe('Placa Memorial Dupla em Porcelana Vitrificada Premium');
  });

  it('nunca ultrapassa o limite nem com nome enorme', () => {
    const gigante = makeProduct({ name_pt: 'A'.repeat(120), sizes: [] });
    expect(buildTitle(gigante).length).toBeLessThanOrEqual(MAX_TITLE);
  });
});

describe('buildDescription', () => {
  it('inclui sku, unidade e variantes traduzidas', () => {
    const description = buildDescription(medalhao);
    expect(description).toContain('SKU: REC-MED-001');
    expect(description).toContain('Unidade de venda: peça');
    expect(description).toContain('Cores: Branco');
    expect(description).toContain('Acabamentos: Fosco');
  });

  it('descreve venda por metro quadrado', () => {
    const porcelanato = makeProduct({ unit: 'm2' });
    expect(buildDescription(porcelanato)).toContain('Unidade de venda: metro quadrado');
  });
});

describe('buildKit', () => {
  it('aponta o título com palavra promocional proibida', () => {
    const kit = buildKit([makeProduct({ sku: 'X1', name_pt: 'Medalhão Oferta' })], STORE);
    expect(kit.issues).toContainEqual({
      sku: 'X1',
      field: 'title',
      message: 'Palavra proibida: oferta',
    });
  });

  it('aponta emoji no título', () => {
    const kit = buildKit([makeProduct({ sku: 'X2', name_pt: 'Medalhão ✨' })], STORE);
    expect(kit.issues.some((issue) => issue.message === 'Título com emoji')).toBe(true);
  });

  it('aponta contato externo na descrição', () => {
    const kit = buildKit(
      [makeProduct({ sku: 'X3', desc_pt: 'Fale no WhatsApp (44) 99999-0000' })],
      STORE
    );
    expect(
      kit.issues.some((issue) => issue.message === 'Descrição com contato ou link externo')
    ).toBe(true);
  });

  it('aponta peça sem estoque e imagem sem https', () => {
    const kit = buildKit(
      [makeProduct({ sku: 'X4', stock: 0, img: 'http://example.test/p.jpg' })],
      STORE
    );
    expect(kit.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['stock', 'image'])
    );
  });

  it('não reclama de catálogo saudável', () => {
    expect(buildKit([medalhao], STORE).issues).toEqual([]);
  });

  it('avisa sem reprovar quando a foto mora fora da loja', () => {
    const kit = buildKit([makeProduct({ sku: 'X6', img: 'https://terceiro.test/p.jpg' })], STORE);
    expect(kit.issues).toEqual([]);
    expect(kit.warnings).toEqual([
      expect.objectContaining({ sku: 'X6', field: 'image' }),
    ]);
  });

  it('cala quando a foto é servida pela própria loja', () => {
    const kit = buildKit([makeProduct({ sku: 'X7', img: `${STORE}/fotos/p.jpg` })], STORE);
    expect(kit.warnings).toEqual([]);
  });

  // Foto de banco de imagem não é risco de entrega: é anunciar a peça com o retrato de um
  // desconhecido. Precisa se separar do aviso de host instável, senão some no meio da lista.
  it('separa foto de banco de imagem de host externo qualquer', () => {
    const banco = buildKit(
      [makeProduct({ sku: 'X8', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/x.jpg' })],
      STORE
    );
    expect(banco.issues).toEqual([]);
    expect(banco.warnings[0].message).toMatch(/^NÃO PUBLIQUE/);

    const cdn = buildKit([makeProduct({ sku: 'X9', img: 'https://cdn.test/p.jpg' })], STORE);
    expect(cdn.warnings[0].message).not.toMatch(/^NÃO PUBLIQUE/);
  });

  it('abre o markdown com o impedimento, não com o primeiro anúncio', () => {
    const markdown = toMarkdown(
      buildKit(
        [makeProduct({ sku: 'X8', img: 'https://upload.wikimedia.org/x.jpg' })],
        STORE
      )
    );
    expect(markdown.split('\n')[2]).toMatch(/Antes de publicar.*1 de 1/);
  });
});

describe('buildListing', () => {
  it('aponta para a página da peça na loja própria, sem redirect no caminho', () => {
    expect(buildListing(medalhao, 'https://recordare.com.br/').storeUrl).toBe(
      'https://recordare.com.br/peca/medalhao-oval-classico/'
    );
  });

  it('respeita o subcaminho quando a loja não está na raiz do domínio', () => {
    expect(buildListing(medalhao, 'https://samuelstefano.github.io/recordare').storeUrl).toBe(
      'https://samuelstefano.github.io/recordare/peca/medalhao-oval-classico/'
    );
  });
});

describe('exportações', () => {
  it('escapa vírgula e quebra de linha no csv', () => {
    const csv = toCsv([buildListing(medalhao, STORE)]);
    const [header, ...rest] = csv.split('\n');
    expect(header).toBe(CSV_COLUMNS.join(','));
    expect(rest.join('\n')).toContain('"');
    expect(csv).toContain('REC-MED-001');
  });

  it('lista as pendências antes dos anúncios no markdown', () => {
    const markdown = toMarkdown(buildKit([makeProduct({ sku: 'X5', stock: 0 })], STORE));
    expect(markdown.indexOf('Pendências antes de publicar')).toBeLessThan(
      markdown.indexOf('- **SKU:** X5')
    );
  });
});
