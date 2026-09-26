import { makeProduct } from '../test/factories';
import { META_COLUMNS, buildFeed, toGoogleXml, toMetaCsv } from './feeds';

const origin = 'https://loja.test/recordare/';

const medalhao = makeProduct({
  id: 'p1',
  sku: 'REC-MED-001',
  slug: 'medalhao-oval-classico',
  price: 249,
  img: 'https://loja.test/recordare/fotos/medalhao.jpg',
});
const esgotado = makeProduct({
  id: 'p2',
  sku: 'REC-MED-002',
  name_pt: 'Medalhão "Redondo" & Dourado',
  stock: 0,
  img: 'https://loja.test/recordare/fotos/redondo.jpg',
});
const porcelanato = makeProduct({
  id: 'p3',
  sku: 'REC-POR-001',
  cat: 'porcelanato',
  unit: 'm2',
  price: 189.5,
  img: 'https://loja.test/recordare/fotos/porcelanato.jpg',
});
const retratoDeBanco = makeProduct({
  id: 'p4',
  sku: 'REC-LAP-001',
  img: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Retrato.jpg',
});

describe('buildFeed', () => {
  const feed = buildFeed([medalhao, esgotado, porcelanato, retratoDeBanco], origin);

  it('aponta para a página da peça com barra final, sem barra dupla', () => {
    expect(feed.items[0]).toMatchObject({
      id: 'REC-MED-001',
      link: 'https://loja.test/recordare/peca/medalhao-oval-classico/',
      price: '249.00 BRL',
      availability: 'in stock',
    });
  });

  it('mantém a peça esgotada, marcada como esgotada', () => {
    expect(feed.items.find((i) => i.id === 'REC-MED-002')?.availability).toBe('out of stock');
  });

  it('deixa de fora a peça com foto de banco de imagem e diz por quê', () => {
    expect(feed.items.map((i) => i.id)).not.toContain('REC-LAP-001');
    expect(feed.excluded).toEqual([
      { sku: 'REC-LAP-001', reason: 'foto de banco de imagem (upload.wikimedia.org)' },
    ]);
  });
});

describe('toGoogleXml', () => {
  const xml = toGoogleXml(buildFeed([medalhao, esgotado, porcelanato], origin), origin);

  it('escapa o que quebraria o XML', () => {
    expect(xml).toContain('<title>Medalhão &quot;Redondo&quot; &amp; Dourado</title>');
    expect(xml).not.toMatch(/& /);
  });

  it('usa os valores que o Merchant Center aceita', () => {
    expect(xml).toContain('<g:availability>out_of_stock</g:availability>');
    expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>');
  });

  it('só dá preço por m² para o que é vendido por m²', () => {
    expect(xml.match(/<g:unit_pricing_measure>1sqm</g)).toHaveLength(1);
    expect(xml).toContain('<g:price>189.50 BRL</g:price>');
  });
});

describe('toMetaCsv', () => {
  it('uma linha por peça, com o cabeçalho que a Meta espera', () => {
    const lines = toMetaCsv(buildFeed([medalhao, esgotado], origin)).trim().split('\n');
    expect(lines[0]).toBe(META_COLUMNS.join(','));
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('"Medalhão ""Redondo"" & Dourado"');
  });
});
