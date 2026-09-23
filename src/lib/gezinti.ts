import { DILLER, type Dil, type Sayfa } from '../i18n/diller';

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

/* ── 2. faz: personel paneli (/panel/) ve PWA personel uygulaması (/app/) ──────────────────────────
 * Varsayılan dil Türkçe: /panel/ ve /app/; diğer diller /panel/fr/ … /app/en/.
 * Service worker kapsamı /app/ olduğundan bütün dil sürümleri aynı kurulabilir uygulamanın içindedir. */
const BASE_2 = import.meta.env.BASE_URL.replace(/\/$/, '');
export const PANEL_DILLERI: Dil[] = ['tr', ...DILLER.filter((d) => d !== 'tr')];

export function panelYolu(dil: Dil): string {
  return dil === 'tr' ? `${BASE_2}/panel/` : `${BASE_2}/panel/${dil}/`;
}
export function appYolu(dil: Dil): string {
  return dil === 'tr' ? `${BASE_2}/app/` : `${BASE_2}/app/${dil}/`;
}

/** Panelde rol değiştiricinin sırası. */
export const PANEL_GEZINTI = ['koordinator', 'musavirlik', 'bolge', 'dinGorevlisi', 'muhtedi'] as const;
export type PanelRolu = (typeof PANEL_GEZINTI)[number];

/** Uygulamanın alt gezinti sekmeleri. */
export const APP_GEZINTI = ['bildirimler', 'onay', 'takip', 'sayim', 'gorevler', 'kaynaklar'] as const;
export type AppSekmesi = (typeof APP_GEZINTI)[number];
