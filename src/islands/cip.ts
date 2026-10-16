/**
 * Seçim çipi sınıfları (kamu formları): gizli radio/checkbox + görünür etiket. Klavye odağı etiketin çevresinde
 * halka olarak görünür (has-[input:focus-visible]). Serbest metin yerine seçim gereken yerlerde kullanılır.
 */
export function cipSinifi(secili: boolean): string {
  return [
    'ui inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-3.5 text-[0.95rem] font-semibold transition-colors',
    'has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bdv',
    secili ? 'border-bdv bg-[#E6F0F6] text-bdv' : 'border-cizgi bg-white text-dy-metin hover:border-bdv',
  ].join(' ');
}
