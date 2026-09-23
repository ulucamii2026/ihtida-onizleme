import type { tr } from './tr';

/**
 * Sözlük tipi, Türkçe sözlükten türetilir: dize değerler `string`e genişletilir, dizi/demet
 * uzunlukları korunur. Diğer diller `satisfies Sozluk` ile denetlenir → eksik ya da fazla anahtar,
 * eksik liste öğesi `astro check` (dolayısıyla `npm run build`) aşamasında hata verir.
 */
export type Genislet<T> = T extends string ? string : { -readonly [K in keyof T]: Genislet<T[K]> };

export type Sozluk = Genislet<typeof tr>;
