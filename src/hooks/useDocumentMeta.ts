import { useEffect } from 'react';
import { shareImage, siteUrl } from '../lib/site';

interface Meta {
  title: string;
  description: string;
  /** Caminho canônico da página, sem query string. */
  path?: string;
  image?: string;
  noindex?: boolean;
  /** Structured data (schema.org) da página, se houver. */
  jsonLd?: Record<string, unknown>;
}

const JSON_LD_ID = 'page-jsonld';

function setTag(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  apply(element);
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  setTag(
    `meta[${attribute}="${name}"]`,
    () => {
      const el = document.createElement('meta');
      el.setAttribute(attribute, name);
      return el;
    },
    (el) => el.setAttribute('content', content)
  );
}

// A loja é uma SPA: sem isto toda página compartilha o title e a descrição do index.html,
// e link colado no WhatsApp mostra sempre o mesmo card.
export function useDocumentMeta({ title, description, path, image, noindex, jsonLd }: Meta) {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('og:image', image ?? shareImage(), 'property');
    setMeta('robots', noindex ? 'noindex,follow' : 'index,follow');

    const canonical = siteUrl(path);
    setMeta('og:url', canonical, 'property');
    setTag(
      'link[rel="canonical"]',
      () => {
        const el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        return el;
      },
      (el) => el.setAttribute('href', canonical)
    );
  }, [title, description, path, image, noindex]);

  const payload = jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : null;
  useEffect(() => {
    const existing = document.getElementById(JSON_LD_ID);
    if (!payload) {
      existing?.remove();
      return;
    }
    const script = existing ?? document.createElement('script');
    script.id = JSON_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = payload;
    if (!existing) document.head.appendChild(script);
    return () => script.remove();
  }, [payload]);
}
