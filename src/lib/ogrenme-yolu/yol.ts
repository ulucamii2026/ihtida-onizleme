/**
 * Öğrenme yolu verisine tipli erişim. İçerik paylaşılan modülden gelir (src/ortak/ogrenme-yolu/, elle değiştirilmez);
 * burada yalnız okuma yardımcıları vardır.
 */
import ham from '../../ortak/ogrenme-yolu/icerik.json';
import type { Yol, Hafta, Adim, Metin } from '../../ortak/ogrenme-yolu/tipler';
import type { Dil } from '../../i18n/diller';

export const YOL = ham as unknown as Yol;
export const HAFTALAR: Hafta[] = YOL.haftalar;
export const ADIMLAR: Adim[] = YOL.adimlar;

/** Çok dilli metinden sayfa dilindekini seçer. */
export function m(metin: Metin, dil: Dil): string {
  return metin[dil];
}

/** Sayfa kimlikleri dilden bağımsızdır: hafta `h01`…`h12`, adım `adim-1`…`adim-8`. */
export const adimKimligi = (no: number) => `adim-${no}`;

export function haftaBul(id: string): Hafta | undefined {
  return HAFTALAR.find((h) => h.id === id);
}
export function adimBul(id: string): Adim | undefined {
  return ADIMLAR.find((a) => adimKimligi(a.no) === id);
}
export function adimHaftalari(no: number): Hafta[] {
  return HAFTALAR.filter((h) => h.adim === no);
}
export function adimaGore(h: Hafta): Adim {
  return ADIMLAR.find((a) => a.no === h.adim)!;
}
/** Haftanın sayfa dilindeki videosu (yalnız TR ve EN için tanımlıdır). */
export function videoKimligi(h: Hafta, dil: Dil): string | undefined {
  return dil === 'tr' || dil === 'en' ? h.video?.[dil] : undefined;
}
/** Dış bağlantılar yalnız https olur. */
export function guvenliBaglanti(url: string): boolean {
  return /^https:\/\//.test(url);
}
