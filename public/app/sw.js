/*
 * ÖNİZLEME service worker — kapsam: /app/ (personel uygulaması).
 * Yalnız ÇEVRİM DIŞI KABUK ÖNBELLEĞİ: aynı kaynaktaki statik dosyaları önbelleğe alır ve çevrim dışıyken
 * oradan sunar. Hiçbir veri göndermez, dış kaynağa istek atmaz, anlık bildirim (push) kullanmaz.
 */
const SURUM = 'ihtida-onizleme-app-v3';
const KABUK = [
  '/app/', '/app/fr/', '/app/nl/', '/app/de/', '/app/en/',
  '/manifest.webmanifest', '/favicon.svg',
  '/app/ikonlar/ikon.svg', '/app/ikonlar/ikon-192.png', '/app/ikonlar/ikon-512.png',
  '/app/ikonlar/ikon-maskable-512.png', '/app/ikonlar/apple-touch-icon.png',
  '/fonts/Montserrat-VF.woff2', '/fonts/SourceSerif4-VF.woff2',
  '/amblem/diyanet-logotype.svg', '/amblem/bdv-amblem.svg',
];

/** Sayfaların ve betiklerin başvurduğu /_astro/ dosyalarını (adları derlemede değişir) bulur. */
async function astroDosyalari(cache, baslangic) {
  const gorulen = new Set();
  const kuyruk = [...baslangic];
  while (kuyruk.length) {
    const url = kuyruk.shift();
    let metin = '';
    try {
      const yanit = await fetch(url, { cache: 'no-cache' });
      if (!yanit.ok) continue;
      if (url.startsWith('/_astro/')) await cache.put(url, yanit.clone());
      if (/\.(js|css|html)$|\/$/.test(url)) metin = await yanit.text();
    } catch (_) { continue; }
    const bulunan = metin.match(/\/_astro\/[\w.\-]+\.(?:js|css|woff2)/g) || [];
    const goreli = (metin.match(/["'`]\.\/[\w.\-]+\.js["'`]/g) || []).map((s) => '/_astro/' + s.slice(3, -1));
    for (const u of [...bulunan, ...goreli]) if (!gorulen.has(u)) { gorulen.add(u); kuyruk.push(u); }
  }
}

self.addEventListener('install', (olay) => {
  olay.waitUntil((async () => {
    const cache = await caches.open(SURUM);
    await cache.addAll(KABUK);
    await astroDosyalari(cache, ['/app/']);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad !== SURUM) await caches.delete(ad);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  const url = new URL(istek.url);
  if (istek.method !== 'GET' || url.origin !== self.location.origin) return; // yalnız aynı kaynak
  if (istek.mode === 'navigate') {
    // Sayfalar: önce ağ (güncel önizleme), çevrim dışıysa önbellek.
    olay.respondWith(fetch(istek).catch(async () => (await caches.match(istek, { ignoreSearch: true, ignoreVary: true })) || caches.match('/app/')));
    return;
  }
  // Statik dosyalar: önce önbellek, yoksa ağ + önbelleğe ekle.
  olay.respondWith((async () => {
    const onbellek = await caches.match(istek, { ignoreVary: true });
    if (onbellek) return onbellek;
    const yanit = await fetch(istek);
    if (yanit.ok && (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/app/') || url.pathname.startsWith('/fonts/'))) {
      const cache = await caches.open(SURUM);
      cache.put(istek, yanit.clone());
    }
    return yanit;
  })());
});
