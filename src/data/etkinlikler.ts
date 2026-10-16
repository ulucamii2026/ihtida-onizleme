/**
 * KURGUSAL örnek etkinlikler (önizleme). Başlık/açıklama/dil metinleri sözlükte
 * `etkinlikler.liste[i]` içindedir; sıra burada ve sözlükte aynıdır.
 */
export const ORNEK_ETKINLIKLER = [
  { tarih: '2026-10-17', saat: '14:00', yer: 'Namur' },
  { tarih: '2026-11-07', saat: '11:30', yer: 'Liège' },
  { tarih: '2026-11-21', saat: '15:00', yer: 'Bruxelles / Brussel' },
  { tarih: '2026-12-05', saat: '14:30', yer: 'Marche-en-Famenne' },
  { tarih: '2027-01-30', saat: '14:00', yer: 'Gent' },
  { tarih: '2027-02-20', saat: '17:30', yer: 'Charleroi' },
] as const;

/** Belge doğrulama önizlemesinde tek geçerli örnek numara ve kişisel olmayan alanlar. */
export const ORNEK_BELGE = { no: 'BE-2026-DEMO-0001', tarih: '2026-09-15' } as const;
