/**
 * ÖNİZLEME KİLİDİ — tek anahtar. true iken hiçbir form veri göndermez; gönder düğmeleri yalnız
 * «Önizleme: gönderim kapalı» penceresini açar. Gerçek platformda (Müşavirlik onayından sonra)
 * backend bağlanırken bu bayrak ve formların `gonder` işleyicileri birlikte ele alınır.
 */
export const ONIZLEME = true as const;
