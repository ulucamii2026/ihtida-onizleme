/** Diller, sayfa anahtarları ve yerelleştirilmiş yollar — tek kaynak. */

export const DILLER = ['tr', 'fr', 'nl', 'de', 'en'] as const;
export type Dil = (typeof DILLER)[number];

/** Kök dil seçicide öne çıkarılan dil (Belçika — Valonya önceliği). */
export const VARSAYILAN_DIL: Dil = 'fr';

/** Her dilin kendi adıyla gösterimi ve HTML `lang` değeri. */
export const DIL_BILGI: Record<Dil, { ad: string; kisa: string; htmlLang: string; tarihYerel: string }> = {
  tr: { ad: 'Türkçe', kisa: 'TR', htmlLang: 'tr', tarihYerel: 'tr-TR' },
  fr: { ad: 'Français', kisa: 'FR', htmlLang: 'fr-BE', tarihYerel: 'fr-BE' },
  nl: { ad: 'Nederlands', kisa: 'NL', htmlLang: 'nl-BE', tarihYerel: 'nl-BE' },
  de: { ad: 'Deutsch', kisa: 'DE', htmlLang: 'de', tarihYerel: 'de-BE' },
  en: { ad: 'English', kisa: 'EN', htmlLang: 'en', tarihYerel: 'en-GB' },
};

/** Kamuya açık sayfalar (1. faz). Ana sayfa `ana` ayrıca ele alınır. */
export const SAYFALAR = [
  'basvuru',
  'ilkAdimlar',
  'camiler',
  'kardesAile',
  'etkinlikler',
  'dogrula',
  'aile',
  'iletisim',
  'gizlilik',
] as const;
export type Sayfa = (typeof SAYFALAR)[number];
export type SayfaVeyaAna = Sayfa | 'ana';

/** Yerelleştirilmiş adres parçaları. Değiştirirken testteki yol listesi kendiliğinden güncellenir. */
export const SLUGLAR: Record<Dil, Record<Sayfa, string>> = {
  tr: {
    basvuru: 'basvuru', ilkAdimlar: 'ilk-adimlar', camiler: 'cami-bul', kardesAile: 'kardes-aile',
    etkinlikler: 'etkinlikler', dogrula: 'belge-dogrula', aile: 'aileler-icin', iletisim: 'iletisim', gizlilik: 'gizlilik',
  },
  fr: {
    basvuru: 'demande', ilkAdimlar: 'premiers-pas', camiler: 'mosquees', kardesAile: 'accompagnement',
    etkinlikler: 'activites', dogrula: 'verifier', aile: 'pour-les-proches', iletisim: 'contact', gizlilik: 'confidentialite',
  },
  nl: {
    basvuru: 'aanvraag', ilkAdimlar: 'eerste-stappen', camiler: 'moskeeen', kardesAile: 'buddygezin',
    etkinlikler: 'activiteiten', dogrula: 'verifieren', aile: 'voor-familie', iletisim: 'contact', gizlilik: 'privacy',
  },
  de: {
    basvuru: 'antrag', ilkAdimlar: 'erste-schritte', camiler: 'moscheen', kardesAile: 'patenfamilie',
    etkinlikler: 'veranstaltungen', dogrula: 'pruefen', aile: 'fuer-angehoerige', iletisim: 'kontakt', gizlilik: 'datenschutz',
  },
  en: {
    basvuru: 'application', ilkAdimlar: 'first-steps', camiler: 'mosques', kardesAile: 'buddy-family',
    etkinlikler: 'events', dogrula: 'verify', aile: 'for-families', iletisim: 'contact', gizlilik: 'privacy',
  },
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Kök göreli adres üretir: yol('fr','basvuru') → '/fr/demande/'. */
export function yol(dil: Dil, sayfa: SayfaVeyaAna = 'ana'): string {
  return sayfa === 'ana' ? `${BASE}/${dil}/` : `${BASE}/${dil}/${SLUGLAR[dil][sayfa]}/`;
}

/** public/ altındaki bir dosyanın adresini base'e göre üretir. */
export function varlik(yol: string): string {
  return `${BASE}/${yol.replace(/^\//, '')}`;
}

export function dilMi(x: string | undefined): x is Dil {
  return !!x && (DILLER as readonly string[]).includes(x);
}
