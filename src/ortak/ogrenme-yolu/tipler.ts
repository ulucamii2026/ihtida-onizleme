/** Yeni Müslümanlar için 12 haftalık öğrenme yolu: yalnız tipler (siteden içe aktarma yok). */
export type Dil = 'tr' | 'fr' | 'en' | 'nl' | 'de';
export type Metin = Record<Dil, string>;

export type MiniSoru = {
  /** `h01-1`, `h01-2` … */
  id: string;
  soru: Metin;
  /** 3 ya da 4 şık, birbirinden farklı. */
  siklar: Metin[];
  /** Doğru şıkkın sırası (0 tabanlı). */
  dogru: number;
  /** Künye: yalnız eser/madde adı, sayfaya basılmaz. */
  kaynak: string;
};

export type HaftaNo = 'h01' | 'h02' | 'h03' | 'h04' | 'h05' | 'h06' | 'h07' | 'h08' | 'h09' | 'h10' | 'h11' | 'h12';

export type Hafta = {
  id: HaftaNo;
  adim: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  baslik: Metin;
  /** Tek cümlelik hedef. */
  hedef: Metin;
  /** Dil başına en fazla 900 karakter. */
  metin: Metin;
  /** Haftanın somut küçük uygulaması. */
  yap: Metin;
  /** Tam 2 soru. */
  sorular: MiniSoru[];
  /** 1–4 kaynak bağlantısı. */
  kaynaklar: { ad: Metin; url: string }[];
  /** Yalnız mevcut video kimlikleri (YouTube). */
  video?: Partial<Record<'tr' | 'en', string>>;
  durum: Record<Dil, 'taslak' | 'onayli'>;
};

export type Adim = { no: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; baslik: Metin };

export type Yol = {
  surum: 1;
  /** En fazla 600 karakter; yükümlülüklerin ertelenmediğini söyler. */
  giris: Metin;
  adimlar: Adim[];
  haftalar: Hafta[];
};
