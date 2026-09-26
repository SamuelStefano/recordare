import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildKit, toCsv, toMarkdown } from '../src/lib/mercadolivre';
import { fetchActiveProducts, storeOrigin } from './catalog-source';

const outDir = join(process.cwd(), 'out', 'mercadolivre');

const kit = buildKit(await fetchActiveProducts(), storeOrigin());

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'anuncios.csv'), toCsv(kit.listings), 'utf8');
await writeFile(join(outDir, 'anuncios.md'), toMarkdown(kit), 'utf8');

console.log(`${kit.listings.length} anúncios gerados em out/mercadolivre/`);

if (kit.warnings.length > 0) {
  // Dez linhas iguais viram ruído. O que precisa ser lido é a contagem, no topo.
  const impeditivos = kit.warnings.filter((w) => w.message.startsWith('NÃO PUBLIQUE'));
  if (impeditivos.length > 0) {
    console.warn(
      `\n⚠  ${impeditivos.length} de ${kit.listings.length} anúncios ainda usam foto de banco de imagem.` +
        '\n   Publicar assim anuncia a peça com a foto de outra pessoa — troque antes de subir.'
    );
  }
  console.warn(`\n${kit.warnings.length} aviso(s):`);
  for (const warning of kit.warnings) {
    console.warn(`  ${warning.sku} · ${warning.field}: ${warning.message}`);
  }
}

if (kit.issues.length > 0) {
  console.error(`\n${kit.issues.length} pendência(s) antes de publicar:`);
  for (const issue of kit.issues) console.error(`  ${issue.sku} · ${issue.field}: ${issue.message}`);
  // Sai com erro para o CI reprovar catálogo que ainda não pode virar anúncio.
  process.exit(1);
}
