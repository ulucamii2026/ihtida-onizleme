/**
 * KURGUSAL ÖRNEK KAYITLAR — yalnız /panel/ ve /app/ önizlemesi için (2. faz).
 *
 * - Kişiler gerçek DEĞİLDİR: `M-DEMO-01…12` kodlu, adlar sıradan ön adlardır ve arayüzde her zaman
 *   «kurgusal» etiketiyle gösterilir. Telefon, adres, kimlik numarası YOKTUR.
 * - Camiler gerçek cami adı değil, «şehir · örnek cami» biçimindedir (gerçek bir camiye kayıt bağlanmaz).
 * - Personel yalnız rol etiketiyle görünür (ör. «Din görevlisi (Namur)»); gerçek ad yoktur.
 * - Tarihler BUGÜNE GÖRE gün farkıyla tutulur; böylece «3. ay görüşmesi yarın» gibi hatırlatmalar
 *   sunum hangi gün yapılırsa yapılsın doğru görünür. Görünen metinler sözlüktedir (src/i18n/panel/).
 */

export type Asama = 'basvuru' | 'hazirlik' | 'torenPlan' | 'torenYapildi' | 'belgeVerildi' | 'takip';
export const ASAMALAR: Asama[] = ['basvuru', 'hazirlik', 'torenPlan', 'torenYapildi', 'belgeVerildi', 'takip'];

export type Yer = 'namur' | 'liege' | 'eupen' | 'charleroi' | 'mons' | 'marche' | 'arlon';
export type Bolge = 'namurLux' | 'liege' | 'hainaut';
export type KisiDili = 'fr' | 'nl' | 'de' | 'en' | 'tr' | 'ar';
export type Iletisim = 'eposta' | 'mesaj' | 'yuzyuze';
export type Uyruk = 'be' | 'fr' | 'nl' | 'de' | 'gb';
export type TakipAyi = 1 | 3 | 6 | 12;

export const YER_BOLGE: Record<Yer, Bolge> = {
  namur: 'namurLux', marche: 'namurLux', arlon: 'namurLux',
  liege: 'liege', eupen: 'liege',
  charleroi: 'hainaut', mons: 'hainaut',
};
export const BOLGELER: Bolge[] = ['namurLux', 'liege', 'hainaut'];
export const YERLER: Yer[] = ['namur', 'marche', 'arlon', 'liege', 'eupen', 'charleroi', 'mons'];

export interface OrnekKisi {
  kod: string;
  /** Kurgusal ön ad + soyadın baş harfi. Arayüz her zaman «kurgusal» etiketi ekler. */
  ad: string;
  cinsiyet: 'K' | 'E';
  dogumYili: number;
  uyruk: Uyruk;
  dil: KisiDili;
  iletisim: Iletisim;
  yer: Yer;
  asama: Asama;
  /** Başvuru günü (bugüne göre gün farkı, negatif = geçmiş). */
  basvuruGun: number;
  /** Planlanan ya da yapılan tören günü. */
  torenGun?: number;
  /** Belge No (yalnız belge verilmiş kayıtlarda). */
  belgeNo?: string;
  belgeGun?: number;
  /** Takip aşamasındaki kişiler için sıradaki değerlendirme ayı ve günü. */
  takipAyi?: TakipAyi;
  sonrakiGun?: number;
  /** Sıradaki randevu türü (hazırlık görüşmesi vb.) ve günü — takvimde görünür. */
  randevuGun?: number;
  /** Kişinin kişisel alanda tamamladığı «İlk Adımlar» ders sayısı. */
  dersTamam: number;
  /** Aile baskısı riski → kodlu (gizli) kayıt: adı hiçbir listede görünmez. */
  kodluKayit?: boolean;
}

export const ORNEK_KISILER: OrnekKisi[] = [
  { kod: 'M-DEMO-01', ad: 'Sarah D.', cinsiyet: 'K', dogumYili: 1994, uyruk: 'be', dil: 'fr', iletisim: 'mesaj', yer: 'namur', asama: 'takip', basvuruGun: -121, torenGun: -90, belgeNo: 'BE-2026-DEMO-0007', belgeGun: -84, takipAyi: 3, sonrakiGun: 1, dersTamam: 9 },
  { kod: 'M-DEMO-02', ad: 'Thomas L.', cinsiyet: 'E', dogumYili: 1989, uyruk: 'be', dil: 'fr', iletisim: 'eposta', yer: 'liege', asama: 'hazirlik', basvuruGun: -9, randevuGun: 2, dersTamam: 2 },
  { kod: 'M-DEMO-03', ad: 'Élise M.', cinsiyet: 'K', dogumYili: 2001, uyruk: 'be', dil: 'fr', iletisim: 'mesaj', yer: 'marche', asama: 'takip', basvuruGun: -58, torenGun: -25, belgeNo: 'BE-2026-DEMO-0011', belgeGun: -19, takipAyi: 1, sonrakiGun: 5, dersTamam: 4 },
  { kod: 'M-DEMO-04', ad: 'Kevin R.', cinsiyet: 'E', dogumYili: 1997, uyruk: 'fr', dil: 'fr', iletisim: 'yuzyuze', yer: 'charleroi', asama: 'belgeVerildi', basvuruGun: -41, torenGun: -8, belgeNo: 'BE-2026-DEMO-0012', belgeGun: -3, takipAyi: 1, sonrakiGun: 22, dersTamam: 3 },
  { kod: 'M-DEMO-05', ad: 'Aurélie B.', cinsiyet: 'K', dogumYili: 1986, uyruk: 'be', dil: 'fr', iletisim: 'eposta', yer: 'mons', asama: 'torenPlan', basvuruGun: -30, torenGun: 9, dersTamam: 3, kodluKayit: true },
  { kod: 'M-DEMO-06', ad: 'Jonas V.', cinsiyet: 'E', dogumYili: 1992, uyruk: 'be', dil: 'nl', iletisim: 'mesaj', yer: 'liege', asama: 'torenYapildi', basvuruGun: -35, torenGun: -3, dersTamam: 3 },
  { kod: 'M-DEMO-07', ad: 'Laura W.', cinsiyet: 'K', dogumYili: 1990, uyruk: 'gb', dil: 'en', iletisim: 'eposta', yer: 'namur', asama: 'takip', basvuruGun: -212, torenGun: -178, belgeNo: 'BE-2026-DEMO-0002', belgeGun: -171, takipAyi: 6, sonrakiGun: 4, dersTamam: 12 },
  { kod: 'M-DEMO-08', ad: 'Maxime G.', cinsiyet: 'E', dogumYili: 1983, uyruk: 'be', dil: 'fr', iletisim: 'yuzyuze', yer: 'arlon', asama: 'takip', basvuruGun: -401, torenGun: -371, belgeNo: 'BE-2025-DEMO-0031', belgeGun: -365, takipAyi: 12, sonrakiGun: -6, dersTamam: 12 },
  { kod: 'M-DEMO-09', ad: 'Nathalie S.', cinsiyet: 'K', dogumYili: 1999, uyruk: 'de', dil: 'de', iletisim: 'eposta', yer: 'eupen', asama: 'torenPlan', basvuruGun: -22, torenGun: 16, dersTamam: 2 },
  { kod: 'M-DEMO-10', ad: 'Pieter J.', cinsiyet: 'E', dogumYili: 2003, uyruk: 'nl', dil: 'nl', iletisim: 'mesaj', yer: 'charleroi', asama: 'basvuru', basvuruGun: -7, dersTamam: 0 },
  { kod: 'M-DEMO-11', ad: 'Julie P.', cinsiyet: 'K', dogumYili: 1995, uyruk: 'be', dil: 'fr', iletisim: 'mesaj', yer: 'namur', asama: 'basvuru', basvuruGun: 0, dersTamam: 1 },
  { kod: 'M-DEMO-12', ad: 'Marc H.', cinsiyet: 'E', dogumYili: 1978, uyruk: 'be', dil: 'fr', iletisim: 'eposta', yer: 'marche', asama: 'torenYapildi', basvuruGun: -44, torenGun: -1, dersTamam: 4 },
];

/** Kişisel alan önizlemesinde kullanılan kurgusal kişi. */
export const KISISEL_ALAN_KODU = 'M-DEMO-03';

/** Personel: yalnız rol + yer. Gerçek ad yoktur. */
export type RolTuru = 'dinGorevlisi' | 'bolgeSorumlusu' | 'kardesAile' | 'koordinator';
export interface OrnekGorevli { id: string; rol: RolTuru; yer?: Yer }
export const ORNEK_GOREVLILER: OrnekGorevli[] = [
  { id: 'dg-namur', rol: 'dinGorevlisi', yer: 'namur' },
  { id: 'dg-marche', rol: 'dinGorevlisi', yer: 'marche' },
  { id: 'dg-arlon', rol: 'dinGorevlisi', yer: 'arlon' },
  { id: 'dg-liege', rol: 'dinGorevlisi', yer: 'liege' },
  { id: 'dg-eupen', rol: 'dinGorevlisi', yer: 'eupen' },
  { id: 'dg-charleroi', rol: 'dinGorevlisi', yer: 'charleroi' },
  { id: 'dg-mons', rol: 'dinGorevlisi', yer: 'mons' },
  { id: 'bs-liege', rol: 'bolgeSorumlusu', yer: 'liege' },
  { id: 'bs-namur', rol: 'bolgeSorumlusu', yer: 'namur' },
  { id: 'bs-charleroi', rol: 'bolgeSorumlusu', yer: 'charleroi' },
  { id: 'ka-namur', rol: 'kardesAile', yer: 'namur' },
  { id: 'ka-marche', rol: 'kardesAile', yer: 'marche' },
];

/** Önizleme rollerinin «kendi» kapsamı. */
export const BOLGE_SORUMLUSU_BOLGESI: Bolge = 'liege';
export const DIN_GOREVLISI_YERI: Yer = 'namur';

/** Görev türleri (metinler sözlükte `gorevTurleri`). */
export type GorevTuru = 'hazirlikPlanla' | 'takipGorusmesi' | 'kardesAileEslestir' | 'belgeTeslim' | 'torenHazirla';
export const GOREV_TURLERI: GorevTuru[] = ['hazirlikPlanla', 'takipGorusmesi', 'kardesAileEslestir', 'belgeTeslim', 'torenHazirla'];
export type GorevDurumu = 'yeni' | 'suruyor' | 'tamam';

export interface OrnekGorev {
  id: string;
  kod: string;
  tur: GorevTuru;
  gorevli: string;
  sonGun: number;
  durum: GorevDurumu;
  /** Mesaj dizisi: sözlükteki `mesajlar` anahtarları (kişiler yalnız kodla anılır). */
  mesajlar: { kimden: 'koordinator' | 'gorevli' | 'bolge'; metin: MesajAnahtari; gun: number; saat: string }[];
}

export type MesajAnahtari = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7';

export const ORNEK_GOREVLER: OrnekGorev[] = [
  {
    id: 'g1', kod: 'M-DEMO-11', tur: 'hazirlikPlanla', gorevli: 'dg-namur', sonGun: 3, durum: 'yeni',
    mesajlar: [{ kimden: 'koordinator', metin: 'm1', gun: 0, saat: '09:12' }],
  },
  {
    id: 'g2', kod: 'M-DEMO-01', tur: 'takipGorusmesi', gorevli: 'dg-namur', sonGun: 1, durum: 'suruyor',
    mesajlar: [
      { kimden: 'koordinator', metin: 'm2', gun: -2, saat: '14:40' },
      { kimden: 'gorevli', metin: 'm3', gun: -1, saat: '10:05' },
    ],
  },
  {
    id: 'g3', kod: 'M-DEMO-07', tur: 'kardesAileEslestir', gorevli: 'dg-namur', sonGun: 6, durum: 'suruyor',
    mesajlar: [
      { kimden: 'bolge', metin: 'm4', gun: -5, saat: '16:20' },
      { kimden: 'gorevli', metin: 'm5', gun: -4, saat: '11:02' },
    ],
  },
  {
    id: 'g4', kod: 'M-DEMO-06', tur: 'belgeTeslim', gorevli: 'dg-liege', sonGun: 10, durum: 'yeni',
    mesajlar: [{ kimden: 'koordinator', metin: 'm6', gun: -1, saat: '17:30' }],
  },
  {
    id: 'g5', kod: 'M-DEMO-08', tur: 'takipGorusmesi', gorevli: 'dg-arlon', sonGun: -6, durum: 'yeni',
    mesajlar: [{ kimden: 'koordinator', metin: 'm7', gun: -9, saat: '08:50' }],
  },
];

/** Hazır yanıtlar (serbest metin yok → önizlemeye gerçek veri yazılamaz). */
export const HAZIR_YANITLAR = ['y1', 'y2', 'y3'] as const;
export type HazirYanit = (typeof HAZIR_YANITLAR)[number];

/**
 * SAHA SAYIMI — yalnız toplu sayılar (yıl, cinsiyet, dil). Kişi düzeyinde kayıt DEĞİLDİR.
 * Camilerin «bize ulaşmadan önce Müslüman olmuş» kişileri bildirdiği envanter formunun çıktısı.
 */
export const SAHA_SAYIMI = [
  { yil: 2024, kadin: 11, erkek: 8, diller: { fr: 12, nl: 3, de: 1, en: 2, tr: 0, ar: 1 } },
  { yil: 2025, kadin: 14, erkek: 9, diller: { fr: 15, nl: 4, de: 1, en: 2, tr: 1, ar: 0 } },
  { yil: 2026, kadin: 9, erkek: 7, diller: { fr: 11, nl: 3, de: 1, en: 1, tr: 0, ar: 0 } },
] as const;

/** Tarih yardımcıları: gün farkını bugünün tarihine çevirir (yerel saat, gün başı). */
export function gunTarihi(fark: number, bugun = new Date()): Date {
  const t = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  t.setDate(t.getDate() + fark);
  return t;
}

export function kisiBul(kod: string): OrnekKisi | undefined {
  return ORNEK_KISILER.find((k) => k.kod === kod);
}
