/**
 * Yeni modüllerin hesapları (önizleme): faaliyet günlüğünün çeyrek toplamları, 5 iş günlük dönüş süresi ve
 * «Beni arayın» işaretlerinin kim tarafından görülebileceği. Ağ isteği yoktur; hepsi kurgusal veriden hesaplanır.
 */
import { BOLGELER, YER_BOLGE, gunTarihi, type Bolge, type Yer } from '../data/ornek-dosyalar';
import {
  DONUS_IS_GUNU, ORNEK_ERISIM, ORNEK_ISARETLER, faaliyetleriUret,
  type ErisimSatiri, type Faaliyet, type HaritaIsareti,
} from '../data/ornek-moduller';

/* ── Faaliyet günlüğü ─────────────────────────────────────────────────────────────────── */

/** Açılışta bir kez üretilen kurgusal günlük (her açılışta aynı kayıtlar). */
export const FAALIYETLER: Faaliyet[] = faaliyetleriUret();

export const katilimci = (f: Faaliyet) => f.kadin + f.erkek;

/** Takvim çeyreği anahtarı: yıl × 4 + (0…3). */
export function ceyrekAnahtari(t: Date): number {
  return t.getFullYear() * 4 + Math.floor(t.getMonth() / 3);
}

export function ceyrekParcalari(anahtar: number): { yil: number; c: number } {
  return { yil: Math.floor(anahtar / 4), c: (anahtar % 4) + 1 };
}

export interface CeyrekOzeti {
  anahtar: number;
  faaliyet: number;
  kadin: number;
  erkek: number;
  toplam: number;
  cami: number;
  /** İçinde bulunulan (henüz tamamlanmamış) çeyrek. */
  devam: boolean;
}

/** Tamamlanmış son dört çeyrek + içinde bulunulan çeyrek (en eskiden yeniye). */
export function ceyrekOzetleri(liste: Faaliyet[] = FAALIYETLER, bugun = new Date()): CeyrekOzeti[] {
  const simdiki = ceyrekAnahtari(bugun);
  const sonuc: CeyrekOzeti[] = [];
  for (let a = simdiki - 4; a <= simdiki; a++) {
    const icinde = liste.filter((f) => ceyrekAnahtari(gunTarihi(f.gun, bugun)) === a);
    sonuc.push({
      anahtar: a,
      faaliyet: icinde.length,
      kadin: icinde.reduce((t, f) => t + f.kadin, 0),
      erkek: icinde.reduce((t, f) => t + f.erkek, 0),
      toplam: icinde.reduce((t, f) => t + katilimci(f), 0),
      cami: new Set(icinde.map((f) => f.yer)).size,
      devam: a === simdiki,
    });
  }
  return sonuc;
}

/** Bir çeyreğin bölgelere göre dağılımı (yalnız toplam; cami ve kayıt ayrıntısı yok). */
export function bolgeDagilimi(anahtar: number, liste: Faaliyet[] = FAALIYETLER, bugun = new Date()) {
  const icinde = liste.filter((f) => ceyrekAnahtari(gunTarihi(f.gun, bugun)) === anahtar);
  return BOLGELER.map((b: Bolge) => {
    const bolgede = icinde.filter((f) => YER_BOLGE[f.yer] === b);
    return { bolge: b, faaliyet: bolgede.length, katilimci: bolgede.reduce((t, f) => t + katilimci(f), 0) };
  });
}

/** Grafik ekseni için «yuvarlak» adım: 1, 2, 2,5 ya da 5 × 10^k; en fazla beş aralık. */
export function eksenAdimi(enBuyuk: number, aralik = 5): number {
  if (enBuyuk <= 0) return 1;
  const ham = enBuyuk / aralik;
  const us = 10 ** Math.floor(Math.log10(ham));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * us >= ham) return k * us;
  return 10 * us;
}

/* ── «Beni arayın» işaretleri ─────────────────────────────────────────────────────────── */

/** `gun` gününden sonraki n'inci iş günü (cumartesi ve pazar sayılmaz; resmî tatiller önizlemede yok). */
export function isGunuSonra(gun: number, n = DONUS_IS_GUNU, bugun = new Date()): number {
  let g = gun;
  let kalan = n;
  while (kalan > 0) {
    g += 1;
    const d = gunTarihi(g, bugun).getDay();
    if (d !== 0 && d !== 6) kalan -= 1;
  }
  return g;
}

export type Gorunum = { yerler: Yer[]; kadin: boolean };

/** İşaret bu görünümde görülebilir mi: yalnız kapsamdaki ilçe ve (kadın kaydıysa) yalnız kadın görevli. */
export function isaretGorunurMu(i: HaritaIsareti, g: Gorunum): boolean {
  return g.yerler.includes(i.yer) && (g.kadin || !i.kadin);
}

/** Açık işaretler: kapanmamış ve bu tarayıcıda «dönüş yapıldı» denmemiş olanlar. */
export function acikIsaretler(kapananlar: Record<string, true>): HaritaIsareti[] {
  return ORNEK_ISARETLER.filter((i) => !i.kapandi && !kapananlar[i.kod]);
}

/** Kurgusal kayıt + bu tarayıcıda eklenen satırlar, en yeniden eskiye. */
export function erisimKaydi(eklenen: ErisimSatiri[]): ErisimSatiri[] {
  return [...ORNEK_ERISIM, ...eklenen].sort((a, b) => b.gun - a.gun || b.saat.localeCompare(a.saat));
}

export function isaretBul(kod: string | undefined): HaritaIsareti | undefined {
  return kod ? ORNEK_ISARETLER.find((i) => i.kod === kod) : undefined;
}

export const saatSimdi = () => new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
