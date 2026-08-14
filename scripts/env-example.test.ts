import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Mora em `scripts/` e não em `src/` porque o Vite se recusa a servir arquivo `.env` como módulo —
// a mesma proteção que este teste cobre, vista do outro lado.
const exemplo = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8');

describe('.env.example', () => {
  // `VITE_*` vai inteiro para o bundle público. Um segredo aqui não é configuração errada: é
  // credencial publicada — e o exemplo é justamente o arquivo que as pessoas copiam.
  it('não sugere nenhum segredo', () => {
    expect(exemplo).not.toMatch(/service_role|sb_secret_|SECRET_KEY|PRIVATE_KEY|_TOKEN/i);
  });

  it('só declara variáveis que podem ser públicas', () => {
    for (const linha of exemplo.split('\n')) {
      const nome = /^\s*([A-Z0-9_]+)\s*=/.exec(linha)?.[1];
      if (nome) expect(nome).toMatch(/^(VITE_|STORE_ORIGIN$)/);
    }
  });
});
