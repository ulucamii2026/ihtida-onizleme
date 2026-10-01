/**
 * KURGUSAL ÖRNEK KAYITLAR — yeni modüller (30 Eylül 2026): merkezî faaliyet günlüğü (Öneri 17), rıza esaslı rehber
 * haritası ve «Beni arayın» işaretleri (Öneri 18), buluşma sonrası anket (Öneri 14). Yalnız önizleme içindir.
 *
 * - Faaliyet günlüğü KİŞİSİZDİR: tarih, cami (şehir · örnek cami), tür, cinsiyete göre katılımcı sayısı, dil.
 *   Ad, açıklama ya da serbest metin YOKTUR.
 * - İşaretler yalnız kurgusal TAKMA ADLA (Arapça kökenli yıldız adları), yaş aralığı ve ilçe/şehirle tutulur;
 *   gerçek ad, adres, telefon YOKTUR. `kadin: true` işaretler yalnız «Kadın görevli» görünümünde gösterilir.
 * - Görevliler yalnız rol etiketiyle görünür («Bölge ihtida sorumlusu (Liège)»); erişim kaydı işareti KODLA anar.
 * - Tarihler bugüne göre gün farkıyla tutulur (ornek-dosyalar.ts ile aynı kural). Faaliyet günlüğünün son beş çeyreklik
 *   kaydı SABİT tohumlu bir üreticiyle açılış anında üretilir: her açılışta aynı kurgusal kayıtlar çıkar,
 *   toplu tablolar aynı kayıtlardan hesaplandığı için birbirini tutar.
 */
import { YERLER, YER_BOLGE, type KisiDili, type Yer } from './ornek-dosyalar';

/* ── Merkezî faaliyet günlüğü ──────────────────────────────────────────────────────────── */

export type FaaliyetTuru = 'camiDersi' | 'aylikBulusma' | 'bolgeselBulusma' | 'iftar' | 'bayram' | 'acikKapi' | 'diger';
export const FAALIYET_TURLERI: FaaliyetTuru[] = ['camiDersi', 'aylikBulusma', 'bolgeselBulusma', 'iftar', 'bayram', 'acikKapi', 'diger'];

export type FaaliyetDili = KisiDili | 'karma';
export const FAALIYET_DILLERI: FaaliyetDili[] = ['fr', 'nl', 'de', 'en', 'tr', 'ar', 'karma'];

export interface Faaliyet {
  id: string;
  /** Bugüne göre gün farkı (negatif = geçmiş). */
  gun: number;
  yer: Yer;
  tur: FaaliyetTuru;
  kadin: number;
  erkek: number;
  dil: FaaliyetDili;
}

/** Sabit tohumlu 32 bitlik doğrusal eşlik üreticisi — her açılışta aynı dizi. */
function uretici(tohum: number): () => number {
  let s = tohum >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Caminin günlük düzeni: bölgenin dili, düzenli ders olup olmadığı, takvimdeki kayma. */
const CAMI_DUZENI: Record<Yer, { dil: FaaliyetDili; ders: boolean; kayma: number }> = {
  namur: { dil: 'fr', ders: true, kayma: 2 },
  marche: { dil: 'fr', ders: true, kayma: 5 },
  arlon: { dil: 'fr', ders: false, kayma: 6 },
  liege: { dil: 'fr', ders: true, kayma: 3 },
  eupen: { dil: 'de', ders: false, kayma: 13 },
  charleroi: { dil: 'fr', ders: true, kayma: 9 },
  mons: { dil: 'fr', ders: false, kayma: 11 },
};

/** Bölgesel buluşmaya sırayla ev sahipliği yapan camiler ve bölgenin 28 günlük takvimindeki kayma. */
const BOLGE_EV_SAHIPLERI: { yerler: Yer[]; kayma: number }[] = [
  { yerler: ['namur', 'marche', 'arlon'], kayma: 19 },
  { yerler: ['liege', 'eupen'], kayma: 16 },
  { yerler: ['charleroi', 'mons'], kayma: 25 },
];

/**
 * Mevsimlik faaliyetler için mutlak tarihler (yalnız kurgusal kayıtların nereye düşeceğini belirler):
 * Ramazan 2026 içinde iki iftar; Ramazan ve Kurban bayramı karşılamaları; bir açık kapı günü.
 */
const MEVSIMLIK: { tarih: [number, number, number]; tur: FaaliyetTuru; yerler: Yer[] }[] = [
  { tarih: [2026, 1, 28], tur: 'iftar', yerler: ['namur', 'marche', 'liege', 'charleroi', 'mons', 'arlon', 'eupen'] },
  { tarih: [2026, 2, 10], tur: 'iftar', yerler: ['namur', 'liege', 'charleroi', 'marche'] },
  { tarih: [2026, 2, 20], tur: 'bayram', yerler: ['namur', 'marche', 'arlon', 'liege', 'eupen', 'charleroi', 'mons'] },
  { tarih: [2026, 4, 27], tur: 'bayram', yerler: ['namur', 'marche', 'liege', 'eupen', 'charleroi'] },
  { tarih: [2026, 4, 9], tur: 'acikKapi', yerler: ['namur', 'liege', 'mons'] },
];

function gunFarki(yil: number, ay: number, gun: number, bugun: Date): number {
  const b = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  return Math.round((new Date(yil, ay, gun).getTime() - b.getTime()) / 86400000);
}

/** Sabit, kurgusal son kayıtlar (buluşma anketleri bunlara bağlanır). */
const SABIT_KAYITLAR: Omit<Faaliyet, 'id'>[] = [
  { gun: -9, yer: 'namur', tur: 'bolgeselBulusma', kadin: 9, erkek: 7, dil: 'fr' },
  { gun: -16, yer: 'arlon', tur: 'aylikBulusma', kadin: 2, erkek: 1, dil: 'fr' },
];

export function faaliyetleriUret(bugun = new Date()): Faaliyet[] {
  const r = uretici(20260930);
  const arasi = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const liste: Omit<Faaliyet, 'id'>[] = [];
  // Pencere: dört çeyrek önceki çeyreğin ilk gününden bugüne (panelin çeyrek tablosundaki en eski çeyrek de dolu olsun).
  const ilkGun = new Date(bugun.getFullYear(), Math.floor(bugun.getMonth() / 3) * 3 - 12, 1);
  const PENCERE = -gunFarki(ilkGun.getFullYear(), ilkGun.getMonth(), ilkGun.getDate(), bugun);
  for (let g = -PENCERE; g <= 0; g++) {
    const geri = -g;
    YERLER.forEach((yer) => {
      const d = CAMI_DUZENI[yer];
      if (d.ders && (geri + d.kayma) % 14 === 0) {
        liste.push({ gun: g, yer, tur: 'camiDersi', kadin: arasi(1, 3), erkek: arasi(0, 3), dil: r() < 0.12 ? 'en' : d.dil });
      }
      if ((geri + d.kayma * 2) % 28 === 0) {
        liste.push({ gun: g, yer, tur: 'aylikBulusma', kadin: arasi(1, 4), erkek: arasi(1, 3), dil: r() < 0.3 ? 'karma' : d.dil });
      }
    });
    BOLGE_EV_SAHIPLERI.forEach(({ yerler, kayma }) => {
      if ((geri + kayma) % 28 === 0) {
        const devir = Math.floor((geri + kayma) / 28);
        const yer = yerler[devir % yerler.length];
        liste.push({ gun: g, yer, tur: 'bolgeselBulusma', kadin: arasi(4, 9), erkek: arasi(3, 8), dil: yer === 'eupen' ? 'karma' : 'fr' });
      }
    });
  }
  for (const m of MEVSIMLIK) {
    const g = gunFarki(m.tarih[0], m.tarih[1], m.tarih[2], bugun);
    if (g > 0 || g < -PENCERE) continue;
    for (const yer of m.yerler) {
      const [ka, kb] = m.tur === 'acikKapi' ? [2, 6] : [3, 8];
      liste.push({ gun: g, yer, tur: m.tur, kadin: arasi(ka, kb), erkek: arasi(ka - 1, kb - 1), dil: r() < 0.25 ? 'karma' : CAMI_DUZENI[yer].dil });
    }
  }
  // Ara sıra «diğer» (ör. birlikte cami ziyareti, gezi): yılda birkaç kayıt
  [-301, -233, -170, -118, -61, -33].forEach((g, i) => {
    const yer = YERLER[(i * 3) % YERLER.length];
    liste.push({ gun: g, yer, tur: 'diger', kadin: arasi(2, 6), erkek: arasi(1, 5), dil: CAMI_DUZENI[yer].dil });
  });
  // Sabit kayıtlar, aynı gün aynı bölgedeki aynı türden üretilmiş kaydın yerini alır (çift buluşma olmasın).
  const temiz = liste.filter((f) => !SABIT_KAYITLAR.some((s) => s.gun === f.gun && s.tur === f.tur && YER_BOLGE[s.yer] === YER_BOLGE[f.yer]));
  temiz.push(...SABIT_KAYITLAR);
  return temiz
    .sort((a, b) => b.gun - a.gun || a.yer.localeCompare(b.yer) || a.tur.localeCompare(b.tur))
    .map((f, i) => ({ ...f, id: `f${i + 1}` }));
}

/* ── Rıza esaslı rehber haritası: «Beni arayın» işaretleri ─────────────────────────────── */

/** Yaş aralığı: sözlükteki `yasAraliklari` dizisinin sırası (18–24 … 55+). Varsayılan seçenek yaş aralığıdır. */
export type YasAraligi = 0 | 1 | 2 | 3 | 4;

/** Kamu önizlemesinde seçilebilen kurgusal takma adlar (serbest metin yok: gerçek ad yazılamasın). */
export const TAKMA_ADLAR = ['Altair', 'Deneb', 'Rigel', 'Mizar', 'Alcor', 'Mintaka'] as const;

/** İşaret konabilen ilçe/şehirler (önizleme: Valonya pilotu). Adres ve posta kodu alınmaz. */
export const ISARET_YERLERI: Yer[] = YERLER;

/** Leaflet için ilçe/şehir merkezi (iki ondalık: sokak düzeyi yok). */
export const YER_KONUM: Record<Yer, [number, number]> = {
  namur: [50.47, 4.87],
  marche: [50.23, 5.34],
  arlon: [49.68, 5.82],
  liege: [50.63, 5.58],
  eupen: [50.63, 6.04],
  charleroi: [50.41, 4.44],
  mons: [50.45, 3.96],
};

/** Valonya'nın sınır kutusu (kamu haritasının açılış görünümü). */
export const VALONYA_SINIRI: [[number, number], [number, number]] = [[49.5, 2.84], [50.82, 6.41]];

export interface HaritaIsareti {
  kod: string;
  takmaAd: string;
  yas: YasAraligi;
  yer: Yer;
  /** Kadın kaydı: yalnız kadın görevli görür. */
  kadin: boolean;
  /** İşaretin konduğu gün (bugüne göre). Ayrı açık rıza aynı gün alınmıştır. */
  gun: number;
  /** Dönüşü yapılmış ve haritadan kaldırılmış işaret: yalnız erişim kaydında kodla anılır. */
  kapandi?: boolean;
}

export const ORNEK_ISARETLER: HaritaIsareti[] = [
  { kod: 'H-DEMO-01', takmaAd: 'Deneb', yas: 1, yer: 'namur', kadin: false, gun: -2 },
  { kod: 'H-DEMO-02', takmaAd: 'Mizar', yas: 2, yer: 'namur', kadin: true, gun: -1 },
  { kod: 'H-DEMO-03', takmaAd: 'Altair', yas: 0, yer: 'liege', kadin: false, gun: -4 },
  { kod: 'H-DEMO-04', takmaAd: 'Rigel', yas: 3, yer: 'liege', kadin: false, gun: -9, kapandi: true },
  { kod: 'H-DEMO-05', takmaAd: 'Mintaka', yas: 1, yer: 'liege', kadin: true, gun: -3 },
  { kod: 'H-DEMO-06', takmaAd: 'Alnilam', yas: 4, yer: 'eupen', kadin: false, gun: -1 },
  { kod: 'H-DEMO-07', takmaAd: 'Alcor', yas: 0, yer: 'charleroi', kadin: false, gun: -6 },
  { kod: 'H-DEMO-08', takmaAd: 'Alkaid', yas: 2, yer: 'mons', kadin: true, gun: -2 },
  { kod: 'H-DEMO-09', takmaAd: 'Alnitak', yas: 1, yer: 'marche', kadin: false, gun: -5 },
];

/** Dönüş taahhüdü: modelin genel kuralı, 5 iş günü. */
export const DONUS_IS_GUNU = 5;

export type ErisimRolu = 'bolgeSorumlusu' | 'camiIrtibat' | 'kadinGorevli' | 'musavirlik';
export type ErisimIslemi = 'goruntuledi' | 'donus' | 'denetim';

export interface ErisimSatiri {
  gun: number;
  saat: string;
  rol: ErisimRolu;
  yer?: Yer;
  islem: ErisimIslemi;
  /** İşaret kodu (denetim satırında yok). Takma ad, yaş ve ilçe erişim kaydına yazılmaz. */
  kod?: string;
}

/** Kurgusal erişim kaydı (kim, hangi işarete, ne zaman baktı). Önizlemede eklenen satırlar localStorage'dadır. */
export const ORNEK_ERISIM: ErisimSatiri[] = [
  { gun: -9, saat: '10:14', rol: 'bolgeSorumlusu', yer: 'liege', islem: 'goruntuledi', kod: 'H-DEMO-04' },
  { gun: -8, saat: '16:40', rol: 'bolgeSorumlusu', yer: 'liege', islem: 'donus', kod: 'H-DEMO-04' },
  { gun: -7, saat: '08:55', rol: 'musavirlik', islem: 'denetim' },
  { gun: -4, saat: '17:22', rol: 'bolgeSorumlusu', yer: 'liege', islem: 'goruntuledi', kod: 'H-DEMO-03' },
  { gun: -3, saat: '11:05', rol: 'kadinGorevli', yer: 'liege', islem: 'goruntuledi', kod: 'H-DEMO-05' },
  { gun: -2, saat: '18:20', rol: 'camiIrtibat', yer: 'namur', islem: 'goruntuledi', kod: 'H-DEMO-01' },
  { gun: -1, saat: '14:02', rol: 'kadinGorevli', yer: 'namur', islem: 'goruntuledi', kod: 'H-DEMO-02' },
  { gun: -1, saat: '15:47', rol: 'camiIrtibat', yer: 'eupen', islem: 'goruntuledi', kod: 'H-DEMO-06' },
];

/* ── Buluşma sonrası anket (anonim, buluşma başına toplu) ──────────────────────────────── */

/**
 * Küçük grup eşiği: bundan az yanıtlı buluşmada sonuç GÖSTERİLMEZ. Arayüzde sayı yazılmaz
 * («çok küçük gruplarda sonuç gösterilmez»); kesin eşik DPIA ile Müşavirlik kararıyla belirlenecektir.
 */
export const KUCUK_GRUP_ESIGI = 5;

export interface AnketSonucu {
  id: string;
  /** Bağlı olduğu buluşmanın faaliyet günlüğündeki günü, yeri ve türü (SABIT_KAYITLAR). */
  gun: number;
  yer: Yer;
  tur: FaaliyetTuru;
  yanit: number;
  /** Aşağıdaki dağılımlar yalnız eşiği geçen buluşmada tutulur; küçük grupta hiç yoktur. */
  memnuniyet?: [number, number, number, number, number];
  konu?: [number, number, number];
  dil?: [number, number, number];
  sure?: [number, number, number];
  /** Sözlükteki `anket.istekler` sırasıyla; birden fazla seçilebildiği için toplamı yanıt sayısını aşar. */
  istekler?: [number, number, number, number, number, number, number, number];
  tekrar?: [number, number, number];
}

export const ORNEK_ANKETLER: AnketSonucu[] = [
  {
    id: 'a1', gun: -9, yer: 'namur', tur: 'bolgeselBulusma', yanit: 14,
    memnuniyet: [0, 0, 1, 5, 8], konu: [10, 3, 1], dil: [11, 2, 1], sure: [2, 10, 2],
    istekler: [7, 4, 3, 5, 2, 6, 8, 4], tekrar: [12, 2, 0],
  },
  { id: 'a2', gun: -16, yer: 'arlon', tur: 'aylikBulusma', yanit: 3 },
];
