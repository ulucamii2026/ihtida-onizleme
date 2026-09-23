/**
 * Kurgusal dosyaların önizleme durumu: temel veri (src/data/ornek-dosyalar.ts) + bu tarayıcıda yapılan
 * gösterim değişiklikleri (Belge No verme, «tören yapıldı» onayı…). Panel ve uygulama aynı anahtarı
 * kullanır; böylece uygulamada «Tören yapıldı» denen dosya paneldeki Müşavirlik kuyruğuna düşer.
 */
import { ORNEK_KISILER, type Asama, type OrnekKisi, type TakipAyi } from '../data/ornek-dosyalar';

export const DOSYA_ANAHTARI = 'dosyalar:v1';

export interface DosyaDegisikligi {
  asama?: Asama;
  torenGun?: number;
  randevuGun?: number;
  belgeNo?: string;
  belgeGun?: number;
  takipAyi?: TakipAyi;
  sonrakiGun?: number;
}
export type Degisiklikler = Record<string, DosyaDegisikligi>;

export function etkinKisiler(d: Degisiklikler): OrnekKisi[] {
  return ORNEK_KISILER.map((k) => ({ ...k, ...(d[k.kod] ?? {}) }));
}

/** Sıradaki kurgusal Belge No: BE-2026-DEMO-00NN (verilmiş en büyük 2026 numarasından sonra). */
export function sonrakiBelgeNo(kisiler: OrnekKisi[], yil = 2026): string {
  const onek = `BE-${yil}-DEMO-`;
  const enBuyuk = kisiler
    .map((k) => k.belgeNo)
    .filter((n): n is string => !!n && n.startsWith(onek))
    .map((n) => Number(n.slice(onek.length)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${onek}${String(enBuyuk + 1).padStart(4, '0')}`;
}

/** Başvuruya dönüş süresi (iş günü değil, önizlemede takvim günü): 5 günü aşan başvurular gecikmiş sayılır. */
export const BASVURU_DONUS_GUNU = 5;

export function gecikenler(kisiler: OrnekKisi[]) {
  const liste: { kisi: OrnekKisi; tur: 'basvuru' | 'takip'; gun: number }[] = [];
  for (const k of kisiler) {
    if (k.asama === 'basvuru' && -k.basvuruGun > BASVURU_DONUS_GUNU) liste.push({ kisi: k, tur: 'basvuru', gun: -k.basvuruGun });
    if ((k.asama === 'takip' || k.asama === 'belgeVerildi') && k.sonrakiGun !== undefined && k.sonrakiGun < 0) {
      liste.push({ kisi: k, tur: 'takip', gun: -k.sonrakiGun });
    }
  }
  return liste;
}

export type RandevuTuru = 'hazirlik' | 'toren' | 'takip';
export interface Randevu { kisi: OrnekKisi; tur: RandevuTuru; gun: number; ay?: TakipAyi }

/** Kişilerin yaklaşan randevuları (hazırlık görüşmesi, tören, takip değerlendirmesi). */
export function randevular(kisiler: OrnekKisi[]): Randevu[] {
  const r: Randevu[] = [];
  for (const k of kisiler) {
    if (k.asama === 'hazirlik' && k.randevuGun !== undefined) r.push({ kisi: k, tur: 'hazirlik', gun: k.randevuGun });
    if (k.asama === 'torenPlan' && k.torenGun !== undefined) r.push({ kisi: k, tur: 'toren', gun: k.torenGun });
    if ((k.asama === 'takip' || k.asama === 'belgeVerildi') && k.sonrakiGun !== undefined && k.takipAyi) {
      r.push({ kisi: k, tur: 'takip', gun: k.sonrakiGun, ay: k.takipAyi });
    }
  }
  return r.sort((a, b) => a.gun - b.gun);
}
