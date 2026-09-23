// Cami listesindeki her kayıt için YAKLAŞIK konum (belediye/posta kodu merkezi) üretir.
// Bir kez, geliştirme sırasında elle çalıştırılır; site çalışırken hiçbir ağ çağrısı yapılmaz.
// Kaynak: OpenStreetMap Nominatim (ODbL, © OpenStreetMap katkıcıları). Kullanım kuralı: en fazla 1 istek/sn.
// Kullanım: node scripts/konum-uret.mjs  → src/data/camiler-konum.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const veri = JSON.parse(readFileSync(new URL('../public/data/belcika-camileri.json', import.meta.url), 'utf8'));
const hedef = new URL('../src/data/camiler-konum.json', import.meta.url);
const mevcut = existsSync(hedef) ? JSON.parse(readFileSync(hedef, 'utf8')) : {};
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function sor(params) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'be', ...params });
  const yanit = await fetch(url, { headers: { 'User-Agent': 'ihtida-platform-onizleme/0.1 (https://ulucamii.be)' } });
  if (!yanit.ok) throw new Error('HTTP ' + yanit.status);
  const j = await yanit.json();
  return j[0] ? [Number(Number(j[0].lat).toFixed(4)), Number(Number(j[0].lon).toFixed(4))] : null;
}

for (const c of veri.camiler) {
  if (mevcut[c.id]) continue;
  let konum = null;
  try {
    konum = await sor({ city: c.sehir, postalcode: c.postaKodu });
    await bekle(1200);
    if (!konum) { konum = await sor({ postalcode: c.postaKodu }); await bekle(1200); }
    if (!konum) { konum = await sor({ q: `${c.sehir}, Belgique` }); await bekle(1200); }
  } catch (e) { console.error(c.id, e.message); await bekle(3000); }
  if (konum) mevcut[c.id] = konum;
  console.log(c.id, konum);
}
writeFileSync(hedef, JSON.stringify(mevcut, null, 1) + '\n');
console.log('kayıt:', Object.keys(mevcut).length, '/', veri.camiler.length);
