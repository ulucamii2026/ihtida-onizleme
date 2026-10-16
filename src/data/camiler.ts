/**
 * Cami bulucu verisi — derleme anında hazırlanır, tarayıcıda ağ çağrısı yapılmaz.
 * Ham kaynak: public/data/belcika-camileri.json (ulucamii-site'tan kopya, kamuya açık resmî dizin verisi).
 * Konum: src/data/camiler-konum.json (belediye/posta kodu merkezi, YAKLAŞIK; scripts/konum-uret.mjs).
 */
import ham from '../../public/data/belcika-camileri.json';
import konumlar from './camiler-konum.json';

export type IlKodu = 'bru' | 'bwa' | 'vbr' | 'ant' | 'lim' | 'lie' | 'nam' | 'hai' | 'lux' | 'wvl' | 'ovl';
export type BolgeDili = 'fr' | 'nl' | 'de' | 'fr-nl';

export interface Cami {
  id: string;
  ad: string;
  sehir: string;
  postaKodu: string;
  adres: string;
  kurum: string;
  il: IlKodu;
  bolgeDili: BolgeDili;
  konum: [number, number] | null;
}

/** Belçika posta kodu aralıklarından il (bpost düzeni). */
export function ilBul(postaKodu: string): IlKodu {
  const p = Number(postaKodu);
  if (p < 1300) return 'bru';
  if (p < 1500) return 'bwa';
  if (p < 2000) return 'vbr';
  if (p < 3000) return 'ant';
  if (p < 3500) return 'vbr';
  if (p < 4000) return 'lim';
  if (p < 5000) return 'lie';
  if (p < 6000) return 'nam';
  if (p < 6600) return 'hai';
  if (p < 7000) return 'lux';
  if (p < 8000) return 'hai';
  if (p < 9000) return 'wvl';
  return 'ovl';
}

/** Bölgenin resmî dili (Almanca konuşan topluluk: 4700–4799). */
export function bolgeDiliBul(postaKodu: string, il: IlKodu): BolgeDili {
  const p = Number(postaKodu);
  if (p >= 4700 && p < 4800) return 'de';
  if (il === 'bru') return 'fr-nl';
  if (['bwa', 'lie', 'nam', 'hai', 'lux'].includes(il)) return 'fr';
  return 'nl';
}

/** Kaynak dizinde aksansız yazılmış yer adlarının görüntü düzeltmesi (veri dosyası değişmez). */
const YER_ADI: Record<string, string> = {
  Liege: 'Liège',
  'La Louviere': 'La Louvière',
  Chatelineau: 'Châtelineau',
  'Marchienne-Au-Pont': 'Marchienne-au-Pont',
  'Beyne-Heusay': 'Beyne-Heusay',
};

/**
 * «Mühtedi dostu cami» işareti yalnız bir ÖNERİDİR: hiçbir gerçek camiye bağlanmaz (Rıdvan, 23 Eylül 2026).
 * Kavram Camiler.astro'da kurgusal bir örnek kartla anlatılır.
 */

const konumTablosu = konumlar as unknown as Record<string, [number, number]>;

export const CAMILER: Cami[] = ham.camiler
  .map((c) => {
    const il = ilBul(c.postaKodu);
    return {
      id: c.id,
      ad: c.ad,
      sehir: YER_ADI[c.sehir] ?? c.sehir,
      postaKodu: c.postaKodu,
      adres: c.adres,
      kurum: c.kurum,
      il,
      bolgeDili: bolgeDiliBul(c.postaKodu, il),
      konum: konumTablosu[c.id] ?? null,
    };
  })
  .sort((a, b) => a.sehir.localeCompare(b.sehir, 'fr'));

export const IL_KODLARI: IlKodu[] = ['bru', 'ant', 'lim', 'ovl', 'wvl', 'vbr', 'bwa', 'hai', 'lie', 'lux', 'nam'];
