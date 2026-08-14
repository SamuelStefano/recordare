// Cobertura em m² por caixa, por formato de peça. Fora da tabela, cai no formato mais
// comum (60x60) em vez de zerar — dividir por zero na tela do cliente é pior que uma
// estimativa levemente errada e rotulada como estimativa.
const COVERAGE_M2: Record<string, number> = {
  '60x60': 1.44,
  '80x80': 1.92,
  '120x120': 2.88,
};

const DEFAULT_COVERAGE = 1.44;
export const WASTE_FACTOR = 1.1;

export function coverageFor(size: string | undefined): number {
  return (size && COVERAGE_M2[size]) || DEFAULT_COVERAGE;
}

export interface AreaEstimate {
  area: number;
  areaWithWaste: number;
  coverage: number;
  boxes: number;
  cost: number;
}

export function estimateArea(
  area: number,
  size: string | undefined,
  pricePerM2: number
): AreaEstimate {
  const safeArea = Number.isFinite(area) && area > 0 ? area : 0;
  const coverage = coverageFor(size);
  const areaWithWaste = safeArea * WASTE_FACTOR;
  const boxes = Math.ceil(areaWithWaste / coverage);

  // O custo sai das caixas, não do m² com perda: porcelanato se vende em caixa fechada,
  // e uma estimativa que cobra 16,5 m² para quem vai levar 12 caixas (17,28 m²) cria a
  // surpresa ruim exatamente na hora de fechar o pedido.
  return {
    area: safeArea,
    areaWithWaste,
    coverage,
    boxes,
    cost: boxes * coverage * pricePerM2,
  };
}
