import { makeProduct } from '../test/factories';
import { productJsonLd, storeJsonLd } from './structured-data';

const urls = {
  home: 'https://loja.test/',
  catalog: 'https://loja.test/catalogo/',
  product: 'https://loja.test/peca/p1-peca/',
};

describe('productJsonLd', () => {
  it('descreve a oferta com preço em real e a URL canônica da peça', () => {
    const graph = productJsonLd(makeProduct({ price: 249 }), urls, 'pt')['@graph'];
    expect(graph[0]).toMatchObject({
      '@type': 'Product',
      offers: {
        price: '249.00',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: urls.product,
      },
    });
  });

  // Anunciar peça esgotada como disponível é promessa que o Google repete no resultado de busca.
  it('marca esgotado quando não há estoque', () => {
    const graph = productJsonLd(makeProduct({ stock: 0 }), urls, 'pt')['@graph'];
    expect(graph[0]).toMatchObject({
      offers: { availability: 'https://schema.org/OutOfStock' },
    });
  });

  it('monta a trilha início → catálogo → peça', () => {
    const graph = productJsonLd(makeProduct({ name_pt: 'Medalhão' }), urls, 'pt')['@graph'];
    expect(graph[1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, item: urls.home },
        { position: 2, name: 'Catálogo', item: urls.catalog },
        { position: 3, name: 'Medalhão' },
      ],
    });
  });

  it('segue o idioma da loja', () => {
    const graph = productJsonLd(makeProduct(), urls, 'en')['@graph'];
    expect(graph[0]).toMatchObject({ name: 'Classic Oval Medallion' });
    expect(graph[1]).toMatchObject({ itemListElement: [{}, { name: 'Catalog' }, {}] });
  });
});

describe('storeJsonLd', () => {
  it('aponta o card de compartilhamento servido pela própria loja', () => {
    expect(storeJsonLd('https://loja.test/', 'Homenagens em porcelana')).toMatchObject({
      '@type': 'Store',
      url: 'https://loja.test/',
      image: 'https://loja.test/og.png',
      currenciesAccepted: 'BRL',
    });
  });
});
