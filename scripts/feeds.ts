import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildFeed, toGoogleXml, toMetaCsv } from '../src/lib/feeds';
import { fetchActiveProducts, storeOrigin } from './catalog-source';

// Roda depois do build: os arquivos vão para dist/feeds/ e são servidos pela própria loja, que é
// de onde o Merchant Center e a Meta buscam o feed todo dia.
const origin = storeOrigin();
const outDir = join(process.cwd(), process.argv[2] ?? 'dist', 'feeds');

const feed = buildFeed(await fetchActiveProducts(), origin);

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'google.xml'), toGoogleXml(feed, origin), 'utf8');
await writeFile(join(outDir, 'meta.csv'), toMetaCsv(feed), 'utf8');

console.log(`${feed.items.length} peças nos feeds em ${outDir}`);
if (feed.excluded.length > 0) {
  // Não reprova o deploy: peça fora do feed ainda vende pelo site. Só avisa o que falta.
  console.warn(`\n${feed.excluded.length} peça(s) fora dos feeds:`);
  for (const { sku, reason } of feed.excluded) console.warn(`  ${sku}: ${reason}`);
}
