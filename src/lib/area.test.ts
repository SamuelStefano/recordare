import { WASTE_FACTOR, coverageFor, estimateArea } from './area';

describe('coverageFor', () => {
  it('usa a cobertura do formato conhecido', () => {
    expect(coverageFor('80x80')).toBe(1.92);
  });

  it('cai no formato comum em vez de zerar', () => {
    expect(coverageFor('formato-inventado')).toBe(1.44);
    expect(coverageFor(undefined)).toBe(1.44);
  });
});

describe('estimateArea', () => {
  it('zera área inválida em vez de propagar NaN', () => {
    for (const value of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const estimate = estimateArea(value, '60x60', 189);
      expect(estimate.area).toBe(0);
      expect(estimate.boxes).toBe(0);
      expect(estimate.cost).toBe(0);
    }
  });

  it('aplica 10% de perda antes de fechar a caixa', () => {
    const estimate = estimateArea(15, '60x60', 189);
    expect(estimate.areaWithWaste).toBeCloseTo(15 * WASTE_FACTOR);
    expect(estimate.boxes).toBe(Math.ceil((15 * WASTE_FACTOR) / 1.44));
  });

  it('cobra caixa fechada, não metro quadrado com perda', () => {
    const estimate = estimateArea(15, '60x60', 189);
    expect(estimate.cost).toBe(estimate.boxes * 1.44 * 189);
    expect(estimate.cost).toBeGreaterThan(estimate.areaWithWaste * 189);
  });

  it('nunca vende meia caixa', () => {
    expect(estimateArea(0.1, '60x60', 189).boxes).toBe(1);
    expect(Number.isInteger(estimateArea(37.4, '120x120', 229).boxes)).toBe(true);
  });
});
