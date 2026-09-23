/**
 * ÖNİZLEME DURUMU — /panel/ ve /app/ yalnız KURGUSAL kayıtlar üzerindeki gösterim durumunu
 * (verilen örnek Belge No, işaretlenen takip, okunan bildirim…) bu tarayıcının localStorage'ında tutar.
 * Serbest metin yazılamaz; hiçbir değer ağa gönderilmez. Kamu formlarının (1. faz) kuralı değişmez:
 * onların verisi hiçbir yerde saklanmaz.
 */
import { useEffect, useState } from 'preact/hooks';

const ONEK = 'ihtida-onizleme:';

export function oku<T>(anahtar: string, varsayilan: T): T {
  try {
    const ham = localStorage.getItem(ONEK + anahtar);
    return ham === null ? varsayilan : (JSON.parse(ham) as T);
  } catch {
    return varsayilan;
  }
}

export function yaz<T>(anahtar: string, deger: T): void {
  try {
    localStorage.setItem(ONEK + anahtar, JSON.stringify(deger));
  } catch {
    /* gizli pencere / kota: önizleme bellekte çalışmayı sürdürür */
  }
}

export function hepsiniSil(): void {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(ONEK)).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* yok say */
  }
}

/** useState + localStorage (yalnız önizleme durumu). */
export function useYerelDurum<T>(anahtar: string, varsayilan: T): [T, (d: T | ((o: T) => T)) => void] {
  const [deger, setDeger] = useState<T>(() => oku(anahtar, varsayilan));
  useEffect(() => { yaz(anahtar, deger); }, [anahtar, deger]);
  return [deger, setDeger];
}

/** '{n} gün' gibi yer tutucuları doldurur. */
export function doldur(kalip: string, d: Record<string, string | number>): string {
  return kalip.replace(/\{(\w+)\}/g, (_, k: string) => String(d[k] ?? `{${k}}`));
}
