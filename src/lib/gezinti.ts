import type { Sayfa } from '../i18n/diller';

/**
 * Kamu sitesinin gezinti düzeni (1. faz). 2. fazda personel paneli (/panel/) ve PWA (/app/)
 * kendi gezinti dizilerini buraya `PANEL_GEZINTI` / `APP_GEZINTI` olarak ekler; kamu dizileri değişmez.
 */
export const UST_GEZINTI: Sayfa[] = ['basvuru', 'ilkAdimlar', 'camiler', 'kardesAile', 'etkinlikler', 'dogrula', 'aile'];
export const ALT_GEZINTI: Sayfa[] = ['basvuru', 'ilkAdimlar', 'camiler', 'kardesAile', 'etkinlikler', 'dogrula', 'aile', 'iletisim', 'gizlilik'];

/** Ana sayfadaki altı kutucuğun hedefleri — sözlükteki `ana.kutucuklar` sırasıyla aynı. */
export const KUTUCUK_HEDEFLERI: { sayfa: Sayfa; ikon: 'belge' | 'kitap' | 'konum' | 'kisiler' | 'takvim' | 'kalkan' }[] = [
  { sayfa: 'basvuru', ikon: 'belge' },
  { sayfa: 'ilkAdimlar', ikon: 'kitap' },
  { sayfa: 'camiler', ikon: 'konum' },
  { sayfa: 'kardesAile', ikon: 'kisiler' },
  { sayfa: 'etkinlikler', ikon: 'takvim' },
  { sayfa: 'dogrula', ikon: 'kalkan' },
];
