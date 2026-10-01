/** @jsxImportSource preact */
/**
 * MERKEZÎ FAALİYET GÜNLÜĞÜ (Öneri 17, önizleme) — KİŞİSİZ: tarih, cami, tür, cinsiyete göre katılımcı sayısı, dil.
 * Üç görünüm:
 *  - cami  → din görevlisi / cami irtibat kişisi (önizlemede Namur): yalnız seçim + sayaçtan oluşan giriş formu ve
 *            caminin son kurgusal kayıtları. Form değerleri YALNIZ bellektedir (useState); gönderim önizleme penceresini açar.
 *  - bolge → bölge ihtida sorumlusu (önizlemede Liège bölgesi): bölgedeki kayıtların tablosu (son 90 gün).
 *  - toplu → koordinatör ve Müşavirlik: çeyrek toplamları, SVG sütun grafiği, «Üç aylık rapor» (önizleme penceresi).
 * Ağ isteği yoktur; bütün sayılar src/data/ornek-moduller.ts içindeki sabit tohumlu üreticiden gelir.
 */
import { useMemo, useState } from 'preact/hooks';
import { doldur } from '../../lib/yerelDurum';
import type { Yer } from '../../data/ornek-dosyalar';
import { FAALIYET_DILLERI, FAALIYET_TURLERI, type Faaliyet, type FaaliyetDili, type FaaliyetTuru } from '../../data/ornek-moduller';
import { FAALIYETLER, bolgeDagilimi, ceyrekOzetleri, ceyrekParcalari, eksenAdimi, katilimci, type CeyrekOzeti } from '../../lib/moduller';
import { Cubuklar, Ikon, Kart, camiAdiYer, tamTarih, tarihYaz, type M } from './ortak';

export type FaaliyetGorunumu = 'cami' | 'bolge' | 'toplu';

interface Props {
  m: M;
  yerel: string;
  gorunum: FaaliyetGorunumu;
  /** cami görünümünde caminin yeri; bölge görünümünde bölgedeki yerler. */
  yerler: Yer[];
  modalAc: () => void;
}

export default function FaaliyetGunlugu({ m, yerel, gorunum, yerler, modalAc }: Props) {
  if (gorunum === 'cami') return <CamiGorunumu m={m} yerel={yerel} yer={yerler[0]} modalAc={modalAc} />;
  if (gorunum === 'bolge') return <BolgeGorunumu m={m} yerel={yerel} yerler={yerler} />;
  return <TopluGorunum m={m} modalAc={modalAc} />;
}

/* ── Ortak tablo ──────────────────────────────────────────────────────────────────────── */

function KayitTablosu({ m, yerel, kayitlar, camiSutunu, veri, baslikId }: { m: M; yerel: string; kayitlar: Faaliyet[]; camiSutunu: boolean; veri: 'cami' | 'bolge'; baslikId: string }) {
  const s = m.panel.faaliyet.sutunlar;
  const topla = (f: (x: Faaliyet) => number) => kayitlar.reduce((t, x) => t + f(x), 0);
  return (
    // Dar ekranda tablo yatay kayar; kaydırma alanı klavyeyle de odaklanabilir.
    <div class="overflow-x-auto rounded-xl border border-cizgi" tabIndex={0} role="region" aria-labelledby={baslikId}>
      <table
        class={`w-full text-left text-[0.95rem] ${camiSutunu ? 'min-w-[44rem]' : 'min-w-[34rem]'}`}
        data-cami-gunlugu={veri === 'cami' ? '' : undefined}
        data-bolge-gunlugu={veri === 'bolge' ? '' : undefined}
      >
        <thead class="ui bg-kagit-2 text-xs text-dy-gri-koyu">
          <tr>
            <th scope="col" class="px-3 py-2">{s.tarih}</th>
            {camiSutunu && <th scope="col" class="px-3 py-2">{s.cami}</th>}
            <th scope="col" class="px-3 py-2">{s.tur}</th>
            <th scope="col" class="px-3 py-2 text-right">{s.kadin}</th>
            <th scope="col" class="px-3 py-2 text-right">{s.erkek}</th>
            <th scope="col" class="px-3 py-2 text-right">{s.toplam}</th>
            <th scope="col" class="px-3 py-2">{s.dil}</th>
          </tr>
        </thead>
        <tbody>
          {kayitlar.map((f) => (
            <tr class="border-t border-cizgi odd:bg-white even:bg-kagit/60" data-faaliyet-kaydi={f.id}>
              <td class="px-3 py-2 whitespace-nowrap tabular-nums">{tamTarih(f.gun, yerel)}</td>
              {camiSutunu && <td class="px-3 py-2">{camiAdiYer(f.yer, m)}</td>}
              <td class="px-3 py-2">{m.faaliyetTurleri[f.tur]}</td>
              <td class="px-3 py-2 text-right tabular-nums">{f.kadin}</td>
              <td class="px-3 py-2 text-right tabular-nums">{f.erkek}</td>
              <td class="ui px-3 py-2 text-right font-semibold tabular-nums">{katilimci(f)}</td>
              <td class="px-3 py-2">{m.diller[f.dil]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot class="ui border-t-2 border-cizgi bg-kagit-2 text-sm font-bold">
          <tr>
            <th scope="row" class="px-3 py-2" colSpan={camiSutunu ? 3 : 2}>{s.toplam}</th>
            <td class="px-3 py-2 text-right tabular-nums">{topla((x) => x.kadin)}</td>
            <td class="px-3 py-2 text-right tabular-nums">{topla((x) => x.erkek)}</td>
            <td class="px-3 py-2 text-right tabular-nums">{topla(katilimci)}</td>
            <td class="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ── Cami irtibat kişisi: giriş formu (yalnız seçim ve sayaç) ─────────────────────────────── */

function Adimlayici({ m, etiket, deger, degis, kimlik }: { m: M; etiket: string; deger: number; degis: (n: number) => void; kimlik: 'K' | 'E' }) {
  const s = m.app.sayim;
  return (
    <div class="flex items-center justify-between gap-2 rounded-xl border border-cizgi bg-white px-3 py-1.5" data-faaliyet-sayac={kimlik}>
      <span class="ui text-[0.95rem] font-semibold">{etiket}</span>
      <span class="flex items-center gap-1">
        <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-cizgi text-dy-metin disabled:opacity-40"
          aria-label={`${s.azalt}: ${etiket}`} disabled={deger === 0} data-faaliyet-azalt={kimlik} onClick={() => degis(Math.max(0, deger - 1))}>
          <Ikon ad="eksi" boyut={18} />
        </button>
        <output class="ui w-9 text-center text-lg font-bold tabular-nums" aria-live="polite">{deger}</output>
        <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-bdv bg-bdv text-white disabled:opacity-40"
          aria-label={`${s.artir}: ${etiket}`} disabled={deger >= 99} data-faaliyet-artir={kimlik} onClick={() => degis(Math.min(99, deger + 1))}>
          <Ikon ad="arti" boyut={18} />
        </button>
      </span>
    </div>
  );
}

interface GirisFormu { gun: number; tur: FaaliyetTuru; kadin: number; erkek: number; dil: FaaliyetDili }

function CamiGorunumu({ m, yerel, yer, modalAc }: { m: M; yerel: string; yer: Yer; modalAc: () => void }) {
  const p = m.panel.faaliyet;
  // Form değerleri yalnız bu bileşenin belleğindedir: localStorage'a yazılmaz, gönderilmez.
  const [form, setForm] = useState<GirisFormu>({ gun: 0, tur: 'camiDersi', kadin: 0, erkek: 0, dil: 'fr' });
  const son = useMemo(() => FAALIYETLER.filter((f) => f.yer === yer).slice(0, 8), [yer]);
  const gunler = Array.from({ length: 14 }, (_, i) => -i);
  const gunAdi = (g: number) => {
    const t = tarihYaz(g, yerel, { weekday: 'long', day: 'numeric', month: 'long' });
    return g === 0 ? `${m.ortak.bugun} · ${t}` : g === -1 ? `${m.ortak.dun} · ${t}` : t;
  };

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
      <Kart baslik={p.formBaslik} id="f-form" sag={<span class="rozet rozet-ornek">{m.ortak.kurgusal}</span>}>
        <form class="grid gap-4" onSubmit={(e) => { e.preventDefault(); modalAc(); }} data-faaliyet-formu>
          <div class="grid gap-3">
            <div>
              <label class="alan-etiket" for="fg-tarih">{p.tarih}</label>
              <select id="fg-tarih" class="alan" value={form.gun} onChange={(e) => setForm({ ...form, gun: Number(e.currentTarget.value) })}>
                {gunler.map((g) => <option value={g}>{gunAdi(g)}</option>)}
              </select>
            </div>
            <div>
              <label class="alan-etiket" for="fg-tur">{p.tur}</label>
              <select id="fg-tur" class="alan" value={form.tur} onChange={(e) => setForm({ ...form, tur: e.currentTarget.value as FaaliyetTuru })}>
                {FAALIYET_TURLERI.map((t) => <option value={t}>{m.faaliyetTurleri[t]}</option>)}
              </select>
            </div>
          </div>
          <fieldset class="grid gap-2">
            <legend class="alan-etiket">{p.katilimci}</legend>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Adimlayici m={m} etiket={p.kadin} kimlik="K" deger={form.kadin} degis={(n) => setForm({ ...form, kadin: n })} />
              <Adimlayici m={m} etiket={p.erkek} kimlik="E" deger={form.erkek} degis={(n) => setForm({ ...form, erkek: n })} />
            </div>
            <p class="ui text-sm font-semibold text-dy-gri-koyu" data-faaliyet-toplam>{doldur(p.toplam, { n: form.kadin + form.erkek })}</p>
          </fieldset>
          <div>
            <label class="alan-etiket" for="fg-dil">{p.dil}</label>
            <select id="fg-dil" class="alan" value={form.dil} onChange={(e) => setForm({ ...form, dil: e.currentTarget.value as FaaliyetDili })}>
              {FAALIYET_DILLERI.map((d) => <option value={d}>{m.diller[d]}</option>)}
            </select>
          </div>
          <p class="flex items-start gap-2 text-sm text-dy-gri-koyu"><Ikon ad="kalkan" boyut={16} class="mt-0.5 shrink-0 text-bdv" />{p.formNot}</p>
          <div>
            <button type="submit" class="dugme dugme-birincil" data-faaliyet-gonder><Ikon ad="onay" boyut={18} />{p.gonder}</button>
          </div>
        </form>
      </Kart>

      <Kart baslik={p.sonKayitlar} id="f-son" sag={<span class="text-sm text-dy-gri-koyu">{camiAdiYer(yer, m)}</span>}>
        <KayitTablosu m={m} yerel={yerel} kayitlar={son} camiSutunu={false} veri="cami" baslikId="f-son" />
      </Kart>
    </div>
  );
}

/* ── Bölge ihtida sorumlusu: bölge düzeyinde tablo ──────────────────────────────────────── */

function BolgeGorunumu({ m, yerel, yerler }: { m: M; yerel: string; yerler: Yer[] }) {
  const p = m.panel.faaliyet;
  const kayitlar = useMemo(() => FAALIYETLER.filter((f) => yerler.includes(f.yer) && f.gun >= -90), [yerler]);
  return (
    <Kart baslik={p.bolgeBaslik} id="f-bolge" sag={<span class="rozet border border-cizgi bg-kagit-2">{kayitlar.length}</span>}>
      <KayitTablosu m={m} yerel={yerel} kayitlar={kayitlar} camiSutunu veri="bolge" baslikId="f-bolge" />
      <p class="mt-4 inline-flex items-start gap-2 rounded-xl bg-kagit-2 px-3 py-2 text-sm text-dy-gri-koyu" data-faaliyet-bolge-disi>
        <Ikon ad="gozKapali" boyut={16} class="mt-0.5 shrink-0" />{p.bolgeNot}
      </p>
    </Kart>
  );
}

/* ── Koordinatör ve Müşavirlik: çeyrek toplamları ───────────────────────────────────────── */

function TopluGorunum({ m, modalAc }: { m: M; modalAc: () => void }) {
  const p = m.panel.faaliyet;
  const ozet = useMemo(() => ceyrekOzetleri(), []);
  const rapor = ozet[ozet.length - 2]; // son tamamlanmış çeyrek
  const dagilim = useMemo(() => bolgeDagilimi(rapor.anahtar), [rapor.anahtar]);
  const ad = (o: CeyrekOzeti) => doldur(p.ceyrek, ceyrekParcalari(o.anahtar));

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
        <Kart baslik={p.grafikBaslik} id="f-grafik">
          <p class="mb-3 text-sm text-dy-gri-koyu">{p.grafikAciklama}</p>
          <CeyrekGrafigi m={m} ozet={ozet} rapor={rapor.anahtar} />
        </Kart>
        <Kart baslik={doldur(p.bolgeDagilimi, { ceyrek: ad(rapor) })} id="f-dagilim">
          <Cubuklar baslik={p.ceyrekSutunlar.toplam} satirlar={dagilim.map((d) => ({ etiket: m.bolgeler[d.bolge], deger: d.katilimci }))} />
          <div class="mt-5 border-t border-cizgi pt-4">
            <button type="button" class="dugme dugme-birincil" data-uc-aylik-rapor onClick={modalAc}><Ikon ad="belge" boyut={18} />{p.rapor}</button>
            <p class="mt-2 text-sm text-dy-gri-koyu">{p.raporNot}</p>
          </div>
        </Kart>
      </div>

      <Kart baslik={p.ceyrekTablo} id="f-ceyrek">
        <div class="overflow-x-auto rounded-xl border border-cizgi" tabIndex={0} role="region" aria-labelledby="f-ceyrek">
          <table class="w-full min-w-[36rem] text-left text-[0.95rem]" data-ceyrek-tablosu>
            <thead class="ui bg-kagit-2 text-xs text-dy-gri-koyu">
              <tr>
                <th scope="col" class="px-3 py-2">{p.ceyrekSutunlar.ceyrek}</th>
                <th scope="col" class="px-3 py-2 text-right">{p.ceyrekSutunlar.faaliyet}</th>
                <th scope="col" class="px-3 py-2 text-right">{p.ceyrekSutunlar.cami}</th>
                <th scope="col" class="px-3 py-2 text-right">{p.ceyrekSutunlar.kadin}</th>
                <th scope="col" class="px-3 py-2 text-right">{p.ceyrekSutunlar.erkek}</th>
                <th scope="col" class="px-3 py-2 text-right">{p.ceyrekSutunlar.toplam}</th>
              </tr>
            </thead>
            <tbody>
              {ozet.map((o) => (
                <tr class={`border-t border-cizgi tabular-nums ${o.anahtar === rapor.anahtar ? 'bg-[#E6F0F6]/60' : ''}`} data-ceyrek={o.anahtar}>
                  <th scope="row" class="ui px-3 py-2 font-semibold whitespace-nowrap">
                    {ad(o)}{o.devam && <span class="ml-1.5 text-xs font-medium text-dy-gri-koyu">({p.devamEdiyor})</span>}
                  </th>
                  <td class="px-3 py-2 text-right">{o.faaliyet}</td>
                  <td class="px-3 py-2 text-right">{o.cami}</td>
                  <td class="px-3 py-2 text-right">{o.kadin}</td>
                  <td class="px-3 py-2 text-right">{o.erkek}</td>
                  <td class="ui px-3 py-2 text-right font-bold">{o.toplam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-sm text-dy-gri-koyu">{p.katilimNot}</p>
      </Kart>
    </div>
  );
}

/**
 * Tek seri sütun grafiği: tamamlanan çeyrekler #004878, süren çeyrek #5F8AAD (ikisi de beyaz zeminde doğrulandı).
 * Sütun ≤ 24 px, üst köşeler 4 px yuvarlak, taban düz; ince ızgara; değer etiketi yalnız rapor çeyreğinde.
 * Üzerine gelince / odaklanınca ipucu; aynı sayılar yandaki tabloda da vardır.
 */
function CeyrekGrafigi({ m, ozet, rapor }: { m: M; ozet: CeyrekOzeti[]; rapor: number }) {
  const p = m.panel.faaliyet;
  const [etkin, setEtkin] = useState<number | null>(null);
  const G = 520, Y = 250, SOL = 46, SAG = 10, UST = 22, ALT = 46;
  const enBuyuk = Math.max(1, ...ozet.map((o) => o.toplam));
  const adim = eksenAdimi(enBuyuk, 5);
  const tavan = Math.ceil(enBuyuk / adim) * adim;
  const yY = (v: number) => UST + (Y - UST - ALT) * (1 - v / tavan);
  const bant = (G - SOL - SAG) / ozet.length;
  const gen = 22;
  const cizgiler = Array.from({ length: Math.round(tavan / adim) + 1 }, (_, i) => i * adim);
  const ipucu = (o: CeyrekOzeti) => doldur(p.ipucu, { ceyrek: doldur(p.ceyrek, ceyrekParcalari(o.anahtar)), n: o.toplam, f: o.faaliyet });

  return (
    <div class="relative mx-auto max-w-[33rem]">
      <svg viewBox={`0 0 ${G} ${Y}`} class="ui block h-auto w-full" role="group" aria-label={p.grafikBaslik} data-ceyrek-grafigi>
        {cizgiler.map((v) => (
          <g>
            <line x1={SOL} x2={G - SAG} y1={yY(v)} y2={yY(v)} stroke={v === 0 ? '#B9B2A4' : '#E2DACB'} stroke-width="1" shape-rendering="crispEdges" />
            <text x={SOL - 8} y={yY(v)} text-anchor="end" dominant-baseline="central" font-size="12" fill="#5C5E61">{v}</text>
          </g>
        ))}
        {ozet.map((o, i) => {
          const x = SOL + i * bant + (bant - gen) / 2;
          const yt = yY(o.toplam);
          const yb = yY(0);
          const r = Math.min(4, (yb - yt) / 2, gen / 2);
          const d = `M${x},${yb}V${yt + r}A${r},${r} 0 0 1 ${x + r},${yt}H${x + gen - r}A${r},${r} 0 0 1 ${x + gen},${yt + r}V${yb}Z`;
          const orta = x + gen / 2;
          return (
            <g
              tabIndex={0}
              role="img"
              aria-label={`${ipucu(o)}${o.devam ? ` (${p.devamEdiyor})` : ''}`}
              data-grafik-sutun={o.anahtar}
              onMouseEnter={() => setEtkin(i)}
              onMouseLeave={() => setEtkin(null)}
              onFocus={() => setEtkin(i)}
              onBlur={() => setEtkin(null)}
              class="group outline-none"
            >
              {/* Klavye odağında sütun alanı lacivert çerçeveyle belirir (fare üzerine gelince yalnız zemin açılır). */}
              <rect x={SOL + i * bant + 2} y={UST - 12} width={bant - 4} height={yb - UST + 12} rx="6" fill={etkin === i ? '#F3EEE5' : 'transparent'}
                stroke-width="2" class="group-focus-visible:stroke-[#004878]" />
              {o.toplam > 0 && <path d={d} fill={o.devam ? '#5F8AAD' : '#004878'} />}
              {o.anahtar === rapor && (
                <text x={orta} y={yt - 7} text-anchor="middle" font-size="13" font-weight="700" fill="#2B2B2B">{o.toplam}</text>
              )}
              <text x={orta} y={yb + 18} text-anchor="middle" font-size="12.5" font-weight="600" fill="#2B2B2B">
                {doldur(p.ceyrekKisa, ceyrekParcalari(o.anahtar))}
              </text>
              {o.devam && <text x={orta} y={yb + 34} text-anchor="middle" font-size="11.5" fill="#5C5E61">({p.devamEdiyor})</text>}
            </g>
          );
        })}
      </svg>
      {etkin !== null && (() => {
        const o = ozet[etkin];
        const sol = ((SOL + etkin * bant + bant / 2) / G) * 100;
        const ust = (yY(o.toplam) / Y) * 100;
        const kayma = etkin === 0 ? '-20%' : etkin === ozet.length - 1 ? '-80%' : '-50%';
        return (
          <div class="ui pointer-events-none absolute z-10 rounded-lg bg-dy-metin px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-md"
            style={{ left: `${sol}%`, top: `${ust}%`, transform: `translate(${kayma}, calc(-100% - 10px))` }} role="presentation" data-grafik-ipucu>
            {ipucu(o)}
          </div>
        );
      })()}
    </div>
  );
}
