/** @jsxImportSource preact */
/**
 * Panel ve personel uygulaması için ortak parçalar: tarih biçimleri, kişi adı (kurgusal / kodlu kayıt),
 * aşama rozeti, ikonlar. Ağ isteği yapan hiçbir şey yoktur.
 */
import type { ComponentChildren } from 'preact';
import type { PanelSozluk } from '../../i18n/panel/tipler';
import { gunTarihi, type Asama, type OrnekKisi, type OrnekGorevli } from '../../data/ornek-dosyalar';
import { doldur } from '../../lib/yerelDurum';

export type M = PanelSozluk;

export function gunEtiketi(fark: number, m: M): string {
  if (fark === 0) return m.ortak.bugun;
  if (fark === 1) return m.ortak.yarin;
  if (fark === -1) return m.ortak.dun;
  return fark > 0 ? doldur(m.ortak.gunSonra, { n: fark }) : doldur(m.ortak.gunOnce, { n: -fark });
}

/** Yer tutuculu metni JSX olarak doldurur; değerler bölünmez (ör. «M-DEMO-11» satır sonunda kırılmaz). */
export function Doldur({ kalip, d }: { kalip: string; d: Record<string, string | number> }) {
  const parcalar = kalip.split(/(\{\w+\})/g);
  return (
    <>
      {parcalar.map((x) => {
        const e = /^\{(\w+)\}$/.exec(x);
        return e && e[1] in d ? <span class="whitespace-nowrap">{String(d[e[1]])}</span> : x;
      })}
    </>
  );
}

export function tarihYaz(fark: number, yerel: string, secenek: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  return new Intl.DateTimeFormat(yerel, secenek).format(gunTarihi(fark));
}

export function tamTarih(fark: number, yerel: string): string {
  return tarihYaz(fark, yerel, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function gorevliAdi(g: OrnekGorevli | undefined, m: M): string {
  if (!g) return '—';
  if (g.rol === 'koordinator') return m.roller.koordinator;
  return doldur(m.roller[g.rol], { yer: g.yer ? m.yerler[g.yer] : '' });
}

export function camiAdi(k: OrnekKisi, m: M): string {
  return doldur(m.ornekCami, { yer: m.yerler[k.yer] });
}

/** Kişinin adı: kodlu kayıtta ad asla gösterilmez; kurgusal adlar her zaman etiketlenir. */
export function KisiAdi({ kisi, m, kisa = false }: { kisi: OrnekKisi; m: M; kisa?: boolean }) {
  if (kisi.kodluKayit) {
    return (
      <span class="inline-flex items-center gap-1.5" title={m.ortak.kodluKayitAciklama}>
        <Ikon ad="kilit" boyut={15} class="text-dy-gri-koyu" />
        <span class="italic text-dy-gri-koyu">{m.ortak.kodluKayit}</span>
      </span>
    );
  }
  return (
    <span>
      {kisi.ad}
      {!kisa && <span class="ml-1 text-[0.8em] font-normal text-dy-altin-koyu">({m.ortak.kurgusal})</span>}
    </span>
  );
}

const ASAMA_RENK: Record<Asama, string> = {
  basvuru: 'bg-[#FBEDEC] text-dy-koyu border-[#F0C4C1]',
  hazirlik: 'bg-dy-altin-acik text-[#5A4F33] border-[#D9CFB8]',
  torenPlan: 'bg-[#EAF1E4] text-[#35592A] border-[#C5D8B8]',
  torenYapildi: 'bg-[#FFF3D6] text-[#7A5410] border-[#EBCF8F]',
  belgeVerildi: 'bg-[#E6F0F6] text-bdv border-[#9DBBD1]',
  takip: 'bg-kagit-2 text-dy-metin border-cizgi',
};

export function AsamaRozeti({ asama, m, ek }: { asama: Asama; m: M; ek?: string }) {
  return (
    <span class={`rozet border ${ASAMA_RENK[asama]}`}>
      {m.asamalar[asama]}{ek ? ` · ${ek}` : ''}
    </span>
  );
}

export function Kart({ baslik, children, class: sinif = '', sag, id }: { baslik?: ComponentChildren; children: ComponentChildren; class?: string; sag?: ComponentChildren; id?: string }) {
  return (
    <section class={`kart min-w-0 p-4 sm:p-5 ${sinif}`} aria-labelledby={id}>
      {baslik && (
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id={id} class="text-[1.05rem] font-bold">{baslik}</h3>
          {sag}
        </div>
      )}
      {children}
    </section>
  );
}

/** Basit yatay çubuk grafiği (toplu sayılar). Renk tek; değer metin olarak da yazılır. */
export function Cubuklar({ satirlar, baslik }: { satirlar: { etiket: string; deger: number }[]; baslik: string }) {
  const enBuyuk = Math.max(1, ...satirlar.map((s) => s.deger));
  return (
    <figure>
      <figcaption class="ui mb-2 text-sm font-semibold text-dy-gri-koyu">{baslik}</figcaption>
      <ul class="grid gap-1.5">
        {satirlar.map((s) => (
          <li class="grid grid-cols-[minmax(0,11rem)_1fr_2rem] items-center gap-2 text-sm">
            <span class="truncate">{s.etiket}</span>
            <span class="h-3 rounded-full bg-kagit-2" aria-hidden="true">
              <span class="block h-3 rounded-full bg-bdv" style={{ width: `${(s.deger / enBuyuk) * 100}%` }} />
            </span>
            <span class="ui text-right font-semibold tabular-nums">{s.deger}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ── İkonlar (satır çizgili SVG, dekoratif) ─────────────────────────────────────────────── */
const YOLLAR = {
  zil: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  onay: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  onayDaire: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
  takvim: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  sayac: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  gorev: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 11l2 2 4-4M8.5 17h7"/>',
  kitap: '<path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H3.5A1.5 1.5 0 0 1 2 16z"/><path d="M22 5.5A1.5 1.5 0 0 0 20.5 4H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h6a1.5 1.5 0 0 0 1.5-1.5z"/>',
  kilit: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  belge: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  mesaj: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  kisi: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  kisiler: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  uyari: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  saat: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  indir: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  kalkan: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z"/>',
  goz: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  gozKapali: '<path d="M3 3l18 18M10.6 5.6A10.8 10.8 0 0 1 12 5.5C18.4 5.5 22 12 22 12a17 17 0 0 1-3.2 3.9M6.2 6.9A16.4 16.4 0 0 0 2 12s3.6 6.5 10 6.5a9.7 9.7 0 0 0 4.4-1"/>',
  ok: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  geri: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arti: '<path d="M12 5v14M5 12h14"/>',
  eksi: '<path d="M5 12h14"/>',
  duyuru: '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
  cevrim: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  kurum: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  telefon: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
} as const;
export type IkonAdi = keyof typeof YOLLAR;

export function Ikon({ ad, boyut = 20, class: sinif = '' }: { ad: IkonAdi; boyut?: number; class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      class={sinif}
      dangerouslySetInnerHTML={{ __html: YOLLAR[ad] }}
    />
  );
}
