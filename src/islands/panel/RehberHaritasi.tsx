/** @jsxImportSource preact */
/**
 * RIZA ESASLI REHBER HARİTASI — görevli tarafı (Öneri 18, önizleme).
 *  - bolge   → bölge ihtida sorumlusu: yalnız kendi bölgesindeki işaretler (önizlemede Liège bölgesi).
 *  - cami    → din görevlisi rolü «cami irtibat kişisi» olarak: yalnız caminin ilçesi (önizlemede Namur).
 *  - toplu   → koordinatör: TEK TEK İŞARET YOK; yalnız toplulaştırılmış sayı ve «kim neyi görür».
 *  - denetim → Müşavirlik: işaret yok; erişim kaydının kodlu denetimi (takma ad, yaş, ilçe gösterilmez).
 * Kadın kayıtlı işaretler yalnız «kadın görevli» görünümünde görünür (rol kutusundaki önizleme anahtarı).
 * Harita, satır içi SVG şemadır (valonya-sema.ts): karo sunucusu yok, AĞ İSTEĞİ YOK.
 * Gösterim durumu (dönüşü yapılan işaretler, eklenen erişim satırları) `ihtida-onizleme:harita:*` anahtarlarında
 * tutulur; paneldeki «Önizleme verisini sıfırla» düğmesi siler. Serbest metin yoktur.
 */
import { useMemo, useState } from 'preact/hooks';
import { useYerelDurum, doldur } from '../../lib/yerelDurum';
import { YERLER, type Yer } from '../../data/ornek-dosyalar';
import type { ErisimRolu, ErisimSatiri, HaritaIsareti } from '../../data/ornek-moduller';
import { acikIsaretler, erisimKaydi, isGunuSonra, isaretBul, isaretGorunurMu, saatSimdi } from '../../lib/moduller';
import { ETIKET_YONU, SEMA_GENISLIK, SEMA_YUKSEKLIK, VALONYA_YOLU, YER_NOKTASI } from '../../data/valonya-sema';
import { Ikon, Kart, gunEtiketi, tamTarih, tarihYaz, type M } from './ortak';

export const HARITA_DURUM = 'harita:durum:v1';
export const HARITA_ERISIM = 'harita:erisim:v1';

export type HaritaGorunumu = 'bolge' | 'cami' | 'toplu' | 'denetim';

interface Props {
  m: M;
  yerel: string;
  gorunum: HaritaGorunumu;
  /** Görevlinin kapsamı: bölge görünümünde bölgedeki ilçeler, cami görünümünde caminin ilçesi. */
  yerler: Yer[];
  /** «Kadın görevli» önizleme görünümü. */
  kadin: boolean;
  kamuHref: string;
}

export default function RehberHaritasi({ m, yerel, gorunum, yerler, kadin, kamuHref }: Props) {
  const [kapananlar, setKapananlar] = useYerelDurum<Record<string, true>>(HARITA_DURUM, {});
  const [eklenen, setEklenen] = useYerelDurum<ErisimSatiri[]>(HARITA_ERISIM, []);
  const satirEkle = (s: ErisimSatiri) => setEklenen((e) => [...e, s].slice(-30));

  if (gorunum === 'toplu' || gorunum === 'denetim') {
    return (
      <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
        <PilotNotu m={m} />
        <div class="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-start">
          <ToplamKarti m={m} toplam={acikIsaretler(kapananlar).length} />
          {gorunum === 'toplu'
            ? <KimNeyiGorur m={m} kamuHref={kamuHref} />
            : <Denetim m={m} yerel={yerel} satirlar={erisimKaydi(eklenen)} denetle={() => satirEkle({ gun: 0, saat: saatSimdi(), rol: 'musavirlik', islem: 'denetim' })} />}
        </div>
      </div>
    );
  }
  return (
    <GorevliGorunumu
      m={m} yerel={yerel} tur={gorunum} yerler={yerler} kadin={kadin}
      kapananlar={kapananlar} kapat={(kod) => setKapananlar((k) => ({ ...k, [kod]: true }))}
      eklenen={eklenen} satirEkle={satirEkle}
    />
  );
}

/* ── Ortak parçalar ───────────────────────────────────────────────────────────────────── */

function PilotNotu({ m }: { m: M }) {
  return (
    <p class="ui flex items-start gap-2.5 rounded-2xl border-2 border-dashed border-dy-altin bg-dy-altin-acik/60 px-4 py-3 text-[0.95rem] font-semibold text-[#5A4F33]" data-pilot-notu>
      <Ikon ad="uyari" boyut={20} class="mt-0.5 shrink-0" />
      {m.panel.harita.pilotNot}
    </p>
  );
}

function rolEtiketi(s: ErisimSatiri, m: M): string {
  if (s.rol === 'musavirlik') return m.roller.musavirlik;
  return doldur(m.roller[s.rol], { yer: s.yer ? m.yerler[s.yer] : '' });
}

function satirMetni(s: ErisimSatiri, m: M, yerel: string): string {
  const h = m.panel.harita;
  return doldur(h.erisimSatiri, {
    tarih: tarihYaz(s.gun, yerel, { day: '2-digit', month: '2-digit' }),
    saat: s.saat,
    rol: rolEtiketi(s, m),
    islem: doldur(h.islemler[s.islem], { kod: s.kod ?? '' }),
  });
}

function ErisimListesi({ m, yerel, satirlar }: { m: M; yerel: string; satirlar: ErisimSatiri[] }) {
  return (
    <ol class="grid max-h-64 gap-1 overflow-y-auto font-mono text-[0.8rem] leading-snug" data-erisim-kaydi-harita>
      {satirlar.map((s) => (
        <li class="rounded-md bg-kagit px-2 py-1 [overflow-wrap:anywhere]" data-erisim-islem={s.islem}>{satirMetni(s, m, yerel)}</li>
      ))}
    </ol>
  );
}

/* ── Koordinatör ve Müşavirlik: işaret yok ────────────────────────────────────────────── */

function ToplamKarti({ m, toplam }: { m: M; toplam: number }) {
  const h = m.panel.harita;
  return (
    <Kart baslik={h.toplamIsaret} id="h-toplam">
      <p class="ui text-4xl leading-none font-bold text-bdv tabular-nums" data-isaret-toplam>{toplam}</p>
      <p class="mt-4 flex items-start gap-2 rounded-xl bg-kagit-2 px-3 py-2.5 text-[0.95rem] font-semibold text-dy-metin" data-isaret-yok-notu>
        <Ikon ad="gozKapali" boyut={18} class="mt-0.5 shrink-0 text-dy-gri-koyu" />
        {h.aciklamalar.toplu}
      </p>
    </Kart>
  );
}

function KimNeyiGorur({ m, kamuHref }: { m: M; kamuHref: string }) {
  const h = m.panel.harita;
  return (
    <Kart baslik={h.kimGorurBaslik} id="h-kim">
      <ul class="grid gap-2.5 text-[0.95rem]" data-kim-neyi-gorur>
        {h.kimGorur.map((t) => (
          <li class="flex items-start gap-2.5"><Ikon ad="kalkan" boyut={18} class="mt-0.5 shrink-0 text-bdv" /><span>{t}</span></li>
        ))}
      </ul>
      <a class="dugme dugme-ikincil mt-4" href={kamuHref}><Ikon ad="harita" boyut={18} />{h.kamuSayfasi}</a>
    </Kart>
  );
}

function Denetim({ m, yerel, satirlar, denetle }: { m: M; yerel: string; satirlar: ErisimSatiri[]; denetle: () => void }) {
  const h = m.panel.harita;
  return (
    <Kart baslik={h.denetimBaslik} id="h-denetim">
      <p class="mb-2 text-[0.95rem] text-dy-gri-koyu">{h.aciklamalar.denetim}</p>
      <ErisimListesi m={m} yerel={yerel} satirlar={satirlar} />
      <button type="button" class="dugme dugme-ikincil mt-3" data-erisim-denetle onClick={denetle}>
        <Ikon ad="onayDaire" boyut={18} />{h.denetle}
      </button>
    </Kart>
  );
}

/* ── Görevli görünümü: liste + şema + erişim kaydı ───────────────────────────────────── */

interface GorevliProps {
  m: M;
  yerel: string;
  tur: 'bolge' | 'cami';
  yerler: Yer[];
  kadin: boolean;
  kapananlar: Record<string, true>;
  kapat: (kod: string) => void;
  eklenen: ErisimSatiri[];
  satirEkle: (s: ErisimSatiri) => void;
}

function GorevliGorunumu({ m, yerel, tur, yerler, kadin, kapananlar, kapat, eklenen, satirEkle }: GorevliProps) {
  const h = m.panel.harita;
  const [acik, setAcik] = useState<string | null>(null);
  const [bildirim, setBildirim] = useState('');
  const gorunen = acikIsaretler(kapananlar).filter((i) => isaretGorunurMu(i, { yerler, kadin }));
  const sayilar = useMemo(() => {
    const s: Partial<Record<Yer, number>> = {};
    for (const i of gorunen) s[i.yer] = (s[i.yer] ?? 0) + 1;
    return s;
  }, [gorunen.map((i) => i.kod).join()]);
  // Bu görünümdeki kişinin erişim kaydındaki rolü (kadın görevli görünümü ayrı rol olarak yazılır)
  const benimRolum: ErisimRolu = kadin ? 'kadinGorevli' : tur === 'bolge' ? 'bolgeSorumlusu' : 'camiIrtibat';
  const kayit = erisimKaydi(eklenen).filter((s) =>
    s.islem === 'denetim' || (!!s.yer && yerler.includes(s.yer) && (kadin || !isaretBul(s.kod)?.kadin)));

  const ayrintiDegistir = (i: HaritaIsareti) => {
    if (acik === i.kod) { setAcik(null); return; }
    setAcik(i.kod);
    satirEkle({ gun: 0, saat: saatSimdi(), rol: benimRolum, yer: yerler[0], islem: 'goruntuledi', kod: i.kod });
  };
  const donusYapildi = (i: HaritaIsareti) => {
    kapat(i.kod);
    satirEkle({ gun: 0, saat: saatSimdi(), rol: benimRolum, yer: yerler[0], islem: 'donus', kod: i.kod });
    setAcik(null);
    setBildirim(doldur(h.kaldirildi, { kod: i.kod }));
  };

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      <PilotNotu m={m} />
      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <Kart baslik={h.listeBaslik} id="h-liste" sag={<span class="rozet border border-cizgi bg-kagit-2" data-isaret-sayisi>{gorunen.length}</span>}>
          <p class="sr-only" role="status" aria-live="polite">{bildirim}</p>
          {bildirim && (
            <p class="mb-3 flex items-start gap-2 rounded-xl border border-[#C5D8B8] bg-[#EAF1E4] px-3 py-2 text-sm font-semibold text-[#35592A]" data-isaret-bildirim>
              <Ikon ad="onayDaire" boyut={17} class="mt-0.5 shrink-0" />{bildirim}
            </p>
          )}
          {gorunen.length === 0 ? (
            <p class="rounded-xl bg-kagit p-4 text-sm">{h.bos}</p>
          ) : (
            <ul class="grid gap-2.5" data-isaret-listesi>
              {gorunen.map((i) => {
                const son = isGunuSonra(i.gun);
                const gecti = son < 0;
                const acikMi = acik === i.kod;
                return (
                  <li class="rounded-xl border border-cizgi bg-kagit p-3.5" data-isaret={i.kod} data-yer={i.yer} data-kadin={i.kadin ? 'evet' : 'hayir'}>
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="ui font-bold">
                          <span class="whitespace-nowrap">{i.kod}</span> · {i.takmaAd}
                          <span class="ml-1 text-[0.8em] font-normal text-dy-altin-koyu">({m.ortak.kurgusal})</span>
                        </p>
                        <p class="text-sm text-dy-gri-koyu">{h.yas}: {m.yasAraliklari[i.yas]} · {h.ilce}: {m.yerler[i.yer]}</p>
                        <p class="text-sm text-dy-gri-koyu">{doldur(h.kondu, { tarih: gunEtiketi(i.gun, m) })}</p>
                        <p class={`ui mt-0.5 flex items-start gap-1.5 text-sm font-semibold ${gecti ? 'text-dy-koyu' : 'text-bdv'}`}>
                          <Ikon ad={gecti ? 'uyari' : 'saat'} boyut={15} class="mt-[0.2em] shrink-0" />
                          <span>{gecti ? h.gecikti : doldur(h.sonGun, { tarih: tarihYaz(son, yerel, { weekday: 'long', day: 'numeric', month: 'long' }) })}</span>
                        </p>
                      </div>
                      {i.kadin && (
                        <span class="rozet border border-[#D9CFB8] bg-dy-altin-acik text-[#5A4F33]"><Ikon ad="kilit" boyut={13} />{h.kadinKaydi}</span>
                      )}
                    </div>
                    <div class="mt-2.5 flex flex-wrap gap-2">
                      <button type="button" class="dugme dugme-ikincil px-3.5 py-1.5 text-sm" aria-expanded={acikMi} aria-controls={`ayrinti-${i.kod}`}
                        data-isaret-ac={i.kod} onClick={() => ayrintiDegistir(i)}>
                        <Ikon ad="goz" boyut={17} />{acikMi ? h.kapat : h.ac}
                      </button>
                      <button type="button" class="dugme dugme-birincil px-3.5 py-1.5 text-sm" data-donus-yapildi={i.kod} onClick={() => donusYapildi(i)}>
                        <Ikon ad="onay" boyut={17} />{h.donusYapildi}
                      </button>
                    </div>
                    {acikMi && (
                      <div id={`ayrinti-${i.kod}`} class="mt-2.5 grid gap-1.5 rounded-lg border border-dashed border-[#B9B2A4] bg-white p-3 text-sm" data-isaret-ayrinti={i.kod}>
                        <p class="flex items-start gap-2"><Ikon ad="onayDaire" boyut={16} class="mt-0.5 shrink-0 text-[#35592A]" />{doldur(h.rizaVar, { tarih: tamTarih(i.gun, yerel) })}</p>
                        <p class="flex items-start gap-2 text-dy-gri-koyu"><Ikon ad="kilit" boyut={16} class="mt-0.5 shrink-0" />{h.iletisimNot}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div class="mt-4 grid gap-2">
            <p class="flex items-start gap-2 rounded-xl bg-kagit-2 px-3 py-2 text-sm text-dy-gri-koyu" data-isaret-disi>
              <Ikon ad="gozKapali" boyut={16} class="mt-0.5 shrink-0" />{tur === 'bolge' ? h.digerBolgeler : h.digerIlceler}
            </p>
            {!kadin && (
              <p class="flex items-start gap-2 rounded-xl bg-kagit-2 px-3 py-2 text-sm text-dy-gri-koyu" data-kadin-gizli>
                <Ikon ad="gozKapali" boyut={16} class="mt-0.5 shrink-0" />{h.kadinGizli}
              </p>
            )}
          </div>
        </Kart>

        <Kart baslik={h.semaBaslik} id="h-sema">
          <ValonyaSemasi m={m} kapsam={yerler} sayilar={sayilar} />
          <p class="mt-3 text-sm text-dy-gri-koyu">{h.semaNot}</p>
          <p class="mt-1 text-xs text-dy-gri-koyu">{h.semaKaynak}</p>
        </Kart>
      </div>

      <Kart baslik={h.erisimBaslik} id="h-erisim">
        <p class="mb-2 text-[0.95rem] text-dy-gri-koyu">{h.erisimAciklama}</p>
        <ErisimListesi m={m} yerel={yerel} satirlar={kayit} />
      </Kart>
    </div>
  );
}

/**
 * Valonya şeması: yalnız ilçe merkezleri. Kapsamdaki ilçelerde açık işaret sayısı lacivert daire içinde yazılır;
 * kapsam dışındaki ilçeler gri noktadır ve sayı taşımaz (başka bölgenin işareti bu rolde hiç hesaplanmaz).
 */
export function ValonyaSemasi({ m, kapsam, sayilar }: { m: M; kapsam: Yer[]; sayilar: Partial<Record<Yer, number>> }) {
  const h = m.panel.harita;
  const ozet = kapsam.map((y) => doldur(h.ilceIsaret, { yer: m.yerler[y], n: sayilar[y] ?? 0 })).join(', ');
  return (
    <svg viewBox={`0 0 ${SEMA_GENISLIK} ${SEMA_YUKSEKLIK}`} class="ui block h-auto w-full" role="img" aria-label={`${h.semaBaslik}: ${ozet}`} data-harita-semasi>
      <path d={VALONYA_YOLU} fill="#F3EEE5" stroke="#B9B2A4" stroke-width="1.5" stroke-linejoin="round" />
      {YERLER.map((y) => {
        const [x, yy] = YER_NOKTASI[y];
        const icinde = kapsam.includes(y);
        const n = sayilar[y] ?? 0;
        const r = icinde && n > 0 ? 16 : icinde ? 7 : 5;
        const yon = ETIKET_YONU[y];
        const etiket = {
          sag: { x: x + r + 6, y: yy, anchor: 'start' as const, baseline: 'central' as const },
          alt: { x, y: yy + r + 17, anchor: 'middle' as const, baseline: 'auto' as const },
          ust: { x, y: yy - r - 8, anchor: 'middle' as const, baseline: 'auto' as const },
        }[yon];
        return (
          <g data-harita-yer={y} data-harita-sayi={icinde ? n : undefined}>
            {icinde && n > 0 ? (
              <>
                <circle cx={x} cy={yy} r={r} fill="#004878" stroke="#fff" stroke-width="2.5" />
                <text x={x} y={yy} text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="700" fill="#fff">{n}</text>
              </>
            ) : (
              <circle cx={x} cy={yy} r={r} fill={icinde ? '#fff' : '#8E887D'} stroke={icinde ? '#004878' : 'none'} stroke-width="2.5" />
            )}
            <text x={etiket.x} y={etiket.y} text-anchor={etiket.anchor} dominant-baseline={etiket.baseline}
              font-size="17" font-weight={icinde ? '700' : '500'} fill={icinde ? '#2B2B2B' : '#6E6A62'}>
              {m.yerler[y]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
