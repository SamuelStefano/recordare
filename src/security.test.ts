// Os arquivos entram como texto cru: o teste precisa olhar o que é publicado, não uma cópia
// declarada aqui — cópia envelhece junto com o problema que ela deveria pegar.
import html from '../index.html?raw';
import vercelRaw from '../vercel.json?raw';

interface HeaderBloco {
  headers: { key: string; value: string }[];
}
const vercel = JSON.parse(vercelRaw) as { headers: HeaderBloco[] };

function diretivas(csp: string): Map<string, string> {
  return new Map(
    csp
      .split(';')
      .map((parte) => parte.trim())
      .filter(Boolean)
      .map((parte) => {
        const [nome, ...valores] = parte.split(/\s+/);
        return [nome, valores.join(' ')] as const;
      })
  );
}

const metaCsp = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/s.exec(html)?.[1];

const todosHeaders = new Map(
  vercel.headers.flatMap((bloco) => bloco.headers).map((h) => [h.key, h.value])
);
const headerCsp = todosHeaders.get('Content-Security-Policy');

describe('csp', () => {
  // O GitHub Pages não deixa configurar header: essa meta é a única barreira em produção. Apagar
  // sem querer não quebraria nenhuma tela, então nada avisaria até alguém injetar script.
  it('viaja no html, porque o host de produção não serve header', () => {
    expect(metaCsp).toBeDefined();
  });

  it('não deixa script inline nem eval passar', () => {
    for (const csp of [metaCsp, headerCsp]) {
      const script = diretivas(csp!).get('script-src');
      expect(script).toBe("'self'");
      expect(csp).not.toContain('unsafe-eval');
    }
  });

  it('só conversa com o próprio banco', () => {
    for (const csp of [metaCsp, headerCsp]) {
      expect(diretivas(csp!).get('connect-src')).toMatch(/^'self' https:\/\/\S+\.supabase\.co$/);
    }
  });

  // A meta existe para espelhar o header. Se as duas versões divergirem, o que foi testado no
  // preview não é o que protege em produção — e a diferença passaria despercebida.
  it('a meta espelha o header, tirando o que meta não suporta', () => {
    const soHeader = new Set(['frame-ancestors', 'upgrade-insecure-requests']);
    const doHeader = [...diretivas(headerCsp!)].filter(([nome]) => !soHeader.has(nome));
    expect([...diretivas(metaCsp!)]).toEqual(doHeader);
  });
});

describe('headers do vercel.json', () => {
  it.each([
    ['Strict-Transport-Security', /max-age=\d{7,}/],
    ['X-Content-Type-Options', /^nosniff$/],
    ['X-Frame-Options', /^DENY$/],
    ['Referrer-Policy', /strict-origin/],
  ])('mantém %s', (chave, esperado) => {
    expect(todosHeaders.get(chave as string)).toMatch(esperado as RegExp);
  });
});
