import type { Product } from './catalog';
import type { Lang } from './i18n';
import { productDescription, productName } from './labels';

export interface ProductUrls {
  home: string;
  catalog: string;
  product: string;
}

// O mesmo JSON-LD serve a tela (hidratada) e o pré-render do deploy. Duas cópias divergiriam sem
// ninguém ver: o Google lê a do pré-render, o teste leria a outra.
export function productJsonLd(product: Product, urls: ProductUrls, lang: Lang) {
  const name = productName(product, lang);
  const description = productDescription(product, lang);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name,
        description,
        image: product.img,
        sku: product.sku,
        brand: { '@type': 'Brand', name: 'Recordare' },
        offers: {
          '@type': 'Offer',
          price: product.price.toFixed(2),
          priceCurrency: 'BRL',
          availability:
            product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: urls.product,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Recordare', item: urls.home },
          {
            '@type': 'ListItem',
            position: 2,
            name: lang === 'en' ? 'Catalog' : 'Catálogo',
            item: urls.catalog,
          },
          { '@type': 'ListItem', position: 3, name },
        ],
      },
    ],
  };
}

export function storeJsonLd(home: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Recordare',
    description,
    url: home,
    image: `${home.replace(/\/$/, '')}/og.png`,
    areaServed: 'BR',
    currenciesAccepted: 'BRL',
    priceRange: 'R$$',
  };
}
