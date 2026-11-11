/**
 * İlerleme işaretleri — yalnız bu cihaz. Hesap eşitlemesi sonra aynı arayüzü uygulayan ikinci bir depo ile bağlanır.
 * Tarayıcı depolaması kapalı ya da dolu olsa da sayfa çalışır (işaretler o oturumda bellekte kalır).
 */
export interface IlerlemeDeposu {
  /** İşaretli hafta kimlikleri (`h01`…). */
  hepsi(): string[];
  isaretliMi(id: string): boolean;
  ayarla(id: string, isaretli: boolean): void;
  temizle(): void;
}

const ANAHTAR = 'ihtida-onizleme:ogrenme:v1'; // `ihtida-onizleme:` öneki «önizleme verisini sıfırla» ile birlikte silinir

export function cihazDeposu(): IlerlemeDeposu {
  let bellek = new Set<string>();
  try {
    const ham = localStorage.getItem(ANAHTAR);
    const liste: unknown = ham ? JSON.parse(ham) : [];
    if (Array.isArray(liste)) bellek = new Set(liste.filter((x): x is string => typeof x === 'string' && /^h\d{2}$/.test(x)));
  } catch { /* depolama yok: bellekte sürer */ }
  const kaydet = () => {
    try { localStorage.setItem(ANAHTAR, JSON.stringify([...bellek].sort())); } catch { /* yok say */ }
  };
  return {
    hepsi: () => [...bellek].sort(),
    isaretliMi: (id) => bellek.has(id),
    ayarla(id, isaretli) {
      if (isaretli) bellek.add(id); else bellek.delete(id);
      kaydet();
    },
    temizle() {
      bellek = new Set();
      try { localStorage.removeItem(ANAHTAR); } catch { /* yok say */ }
    },
  };
}

// shortcut: yalnız cihaz deposu var; hesap eşitlemesi (Firebase) canlı proje kararından sonra `IlerlemeDeposu`'nu uygulayan
// bir ikinci depo olarak buraya bağlanır (cihaz deposu çevrim dışı yedek kalır).
export const depo: IlerlemeDeposu = cihazDeposu();
