import type { Dil } from './diller';
import type { Sozluk } from './tipler';
import { tr } from './tr';
import { fr } from './fr';
import { nl } from './nl';
import { de } from './de';
import { en } from './en';

// tr kaynak dildir (as const → salt okunur demetler); tip bu dosyadan türetildiği için güvenle daraltılır.
const SOZLUKLER: Record<Dil, Sozluk> = { tr: tr as Sozluk, fr, nl, de, en };

export function sozluk(dil: Dil): Sozluk {
  return SOZLUKLER[dil];
}

/** '{n} cami' gibi yer tutucuları doldurur. */
export function doldur(kalip: string, degerler: Record<string, string | number>): string {
  return kalip.replace(/\{(\w+)\}/g, (_, k: string) => String(degerler[k] ?? `{${k}}`));
}

export type { Sozluk };
export * from './diller';
