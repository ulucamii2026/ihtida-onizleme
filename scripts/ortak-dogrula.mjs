#!/usr/bin/env node
/**
 * Paylaşılan öğrenme yolu kopyasını (src/ortak/ogrenme-yolu/) derlemeden önce denetler. Kopya yalnız kaynak depodaki
 * aktarım betiğiyle güncellenir; burada elle değiştirilmiş, eklenmiş ya da silinmiş bir dosya derlemeyi durdurur.
 * Klasör hiç yoksa (modül henüz aktarılmadı) denetim geçer.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const KLASOR = join(process.cwd(), 'src', 'ortak', 'ogrenme-yolu');
if (!existsSync(KLASOR)) {
  console.log('Ortak modül yok; denetim atlandı.');
  process.exit(0);
}
const surumYolu = join(KLASOR, 'SURUM.json');
if (!existsSync(surumYolu)) {
  console.error('src/ortak/ogrenme-yolu/SURUM.json yok: kopya aktarım betiğiyle yapılmamış.');
  process.exit(1);
}
const { dosyalar: beklenen } = JSON.parse(readFileSync(surumYolu, 'utf8'));
const tumu = (k) => readdirSync(k).flatMap((ad) => (statSync(join(k, ad)).isDirectory() ? tumu(join(k, ad)) : [join(k, ad)]));
const olan = Object.fromEntries(tumu(KLASOR).filter((y) => y !== surumYolu).map((y) => [
  relative(KLASOR, y).split('\\').join('/'), createHash('sha256').update(readFileSync(y)).digest('hex'),
]));
const hatalar = [
  ...Object.keys(beklenen).filter((ad) => !(ad in olan)).map((ad) => `eksik: ${ad}`),
  ...Object.keys(olan).filter((ad) => !(ad in beklenen)).map((ad) => `fazla: ${ad}`),
  ...Object.keys(olan).filter((ad) => ad in beklenen && olan[ad] !== beklenen[ad]).map((ad) => `değişmiş: ${ad}`),
];
if (hatalar.length) {
  console.error(`Ortak modül kopyası kaynakla aynı değil (elle değiştirilmiş olabilir):\n  ${hatalar.join('\n  ')}`);
  process.exit(1);
}
console.log(`Ortak modül doğrulandı: ${Object.keys(olan).length} dosya.`);
