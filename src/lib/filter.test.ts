import type { Filters } from '../hooks/useFilters';
import { makeProduct } from '../test/factories';
import { applyFilters, matches, normalize, optionsFrom, relatedTo } from './filter';

const base: Filters = { q: '', cat: '', size: '', color: '', finish: '', sort: 'relevancia' };

const medalhao = makeProduct({
  id: 'p1',
  cat: 'medalhoes',
  price: 249,
  rating: 4.9,
  reviews: 128,
  sort_order: 1,
  name_pt: 'Medalhão Oval Clássico',
  name_en: 'Classic Oval Medallion',
  sizes: ['13x18'],
  colors: ['branco'],
  finishes: ['fosco'],
});

const lapide = makeProduct({
  id: 'p2',
  cat: 'lapides',
  price: 129,
  rating: 4.5,
  reviews: 10,
  sort_order: 2,
  name_pt: 'Placa Retangular Memória',
  name_en: 'Rectangular Memory Plaque',
  sizes: ['24x30'],
  colors: ['preto'],
  finishes: ['brilhante'],
});

const products = [medalhao, lapide];

describe('normalize', () => {
  it('tira acento e caixa', () => {
    expect(normalize('  Medalhão ')).toBe('medalhao');
  });
});

describe('matches', () => {
  it('acha peça mesmo sem acento na busca', () => {
    expect(matches(medalhao, { ...base, q: 'medalhao' }, 'pt')).toBe(true);
  });

  it('exige todos os termos da busca', () => {
    expect(matches(medalhao, { ...base, q: 'oval classico' }, 'pt')).toBe(true);
    expect(matches(medalhao, { ...base, q: 'oval granito' }, 'pt')).toBe(false);
  });

  it('busca pelo idioma da loja', () => {
    expect(matches(medalhao, { ...base, q: 'medallion' }, 'en')).toBe(true);
    expect(matches(medalhao, { ...base, q: 'medallion' }, 'pt')).toBe(false);
  });

  it('busca pelo sku que o vendedor usa no atendimento', () => {
    expect(matches(medalhao, { ...base, q: medalhao.sku }, 'pt')).toBe(true);
  });

  it('filtra por categoria, tamanho, cor e acabamento', () => {
    expect(matches(medalhao, { ...base, cat: 'lapides' }, 'pt')).toBe(false);
    expect(matches(medalhao, { ...base, size: '24x30' }, 'pt')).toBe(false);
    expect(matches(medalhao, { ...base, color: 'preto' }, 'pt')).toBe(false);
    expect(matches(medalhao, { ...base, finish: 'fosco' }, 'pt')).toBe(true);
  });
});

describe('applyFilters', () => {
  it('ordena por relevância usando a ordem de vitrine', () => {
    expect(applyFilters(products, base, 'pt').map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('ordena por preço nos dois sentidos', () => {
    expect(applyFilters(products, { ...base, sort: 'preco-asc' }, 'pt')[0].id).toBe('p2');
    expect(applyFilters(products, { ...base, sort: 'preco-desc' }, 'pt')[0].id).toBe('p1');
  });

  it('ordena por avaliação', () => {
    expect(applyFilters(products, { ...base, sort: 'avaliacao' }, 'pt')[0].id).toBe('p1');
  });

  it('não muta o catálogo original ao ordenar', () => {
    applyFilters(products, { ...base, sort: 'preco-asc' }, 'pt');
    expect(products.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});

describe('optionsFrom', () => {
  it('deriva opções do catálogo vivo sem repetir', () => {
    expect(optionsFrom(products, 'sizes')).toEqual(['13x18', '24x30']);
    expect(optionsFrom([medalhao, medalhao], 'colors')).toEqual(['branco']);
  });
});

describe('relatedTo', () => {
  it('prioriza a mesma categoria e nunca inclui a própria peça', () => {
    const outro = makeProduct({ id: 'p3', cat: 'medalhoes' });
    const related = relatedTo([medalhao, lapide, outro], medalhao);
    expect(related.map((p) => p.id)).toEqual(['p3', 'p2']);
  });
});
