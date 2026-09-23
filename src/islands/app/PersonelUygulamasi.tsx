/** @jsxImportSource preact */
/**
 * PERSONEL UYGULAMASI (PWA önizlemesi, 2. faz) — telefon öncelikli (390 px).
 * Kurgusal kullanıcı: «Din görevlisi (Namur)». Alt gezinti: Bildirimler · Onay · Takip · Sayım · Görevler · Kaynaklar.
 * Durum yalnız localStorage'da (kurgusal kayıtlar); serbest metin alanı yok; AĞ İSTEĞİ YOK.
 */
import type { ComponentChildren } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import OnizlemeModal from '../OnizlemeModal';
import { useYerelDurum, doldur } from '../../lib/yerelDurum';
import { DOSYA_ANAHTARI, etkinKisiler, randevular, type Degisiklikler } from '../../lib/dosyalar';
import { APP_GEZINTI, type AppSekmesi } from '../../lib/gezinti';
import {
  DIN_GOREVLISI_YERI, HAZIR_YANITLAR, ORNEK_GOREVLER,
  type GorevDurumu, type HazirYanit, type OrnekGorev, type TakipAyi,
} from '../../data/ornek-dosyalar';
import { Doldur, Ikon, KisiAdi, gunEtiketi, tarihYaz, type IkonAdi, type M } from '../panel/ortak';

const GOREVLI_ID = 'dg-namur';
const GOREV_ANAHTARI = 'gorevler:v1';

const SEKME_IKON: Record<AppSekmesi, IkonAdi> = {
  bildirimler: 'zil', onay: 'onayDaire', takip: 'takvim', sayim: 'sayac', gorevler: 'gorev', kaynaklar: 'kitap',
};

interface Props { m: M; yerel: string; dilBaglantilari: { dil: string; kisa: string; ad: string; href: string; aktif: boolean }[] }

type TakipIsareti = 'gorusuldu' | 'ulasilamadi' | 'ertele';
type Sayim = { yil: number; K: number; E: number; diller: Record<'fr' | 'nl' | 'de' | 'en' | 'tr' | 'ar', number> };
const BOS_SAYIM: Sayim = { yil: 2026, K: 0, E: 0, diller: { fr: 0, nl: 0, de: 0, en: 0, tr: 0, ar: 0 } };

const saatSimdi = () => new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });

export default function PersonelUygulamasi({ m, yerel, dilBaglantilari }: Props) {
  const a = m.app;
  const [sekme, setSekme] = useYerelDurum<AppSekmesi>('app:sekme', 'bildirimler');
  const [okunan, setOkunan] = useYerelDurum<string[]>('app:okundu', []);
  const [degisiklikler, setDegisiklikler] = useYerelDurum<Degisiklikler>(DOSYA_ANAHTARI, {});
  const [gorevler, setGorevler] = useYerelDurum<OrnekGorev[]>(GOREV_ANAHTARI, ORNEK_GOREVLER);
  const [modal, setModal] = useState(false);
  const modalAc = () => setModal(true);

  const kisiler = useMemo(() => etkinKisiler(degisiklikler), [degisiklikler]);
  const camide = kisiler.filter((k) => k.yer === DIN_GOREVLISI_YERI);
  const benimGorevlerim = gorevler.filter((g) => g.gorevli === GOREVLI_ID);
  const aktif: AppSekmesi = (APP_GEZINTI as readonly string[]).includes(sekme) ? sekme : 'bildirimler';

  // Bildirimler (kurgusal, bugüne göre)
  const g1 = ORNEK_GOREVLER[0];
  const bildirimler: { id: string; ikon: IkonAdi; baslik: ComponentChildren; metin: ComponentChildren; saat: string; hedef: AppSekmesi; vurgu?: boolean }[] = [
    { id: 'b1', ikon: 'kisi', baslik: <Doldur kalip={a.bildirimler.yeniBasvuru} d={{ kod: 'M-DEMO-11' }} />, metin: a.bildirimler.yeniBasvuruMetin, saat: '09:12', hedef: 'onay', vurgu: true },
    { id: 'b2', ikon: 'saat', baslik: <Doldur kalip={a.bildirimler.hatirlatma} d={{ kod: 'M-DEMO-01', ay: 3 }} />, metin: a.bildirimler.hatirlatmaMetin, saat: '08:00', hedef: 'takip' },
    { id: 'b3', ikon: 'gorev', baslik: doldur(a.bildirimler.gorevAtandi, { gorev: m.gorevTurleri[g1.tur] }), metin: <Doldur kalip={a.bildirimler.gorevAtandiMetin} d={{ kod: g1.kod }} />, saat: g1.mesajlar[0].saat, hedef: 'gorevler' },
    { id: 'b4', ikon: 'duyuru', baslik: a.bildirimler.duyuru, metin: a.bildirimler.duyuruMetin, saat: tarihYaz(-1, yerel), hedef: 'kaynaklar' },
  ];
  const okunmamis = bildirimler.filter((b) => !okunan.includes(b.id)).length;
  const onayBekleyen = camide.filter((k) => ['basvuru', 'hazirlik', 'torenPlan'].includes(k.asama)).length;
  const rozet: Partial<Record<AppSekmesi, number>> = {
    bildirimler: okunmamis,
    onay: onayBekleyen,
    gorevler: benimGorevlerim.filter((g) => g.durum === 'yeni').length,
  };

  return (
    <div class="app-kok relative flex min-h-[calc(100dvh-4rem)] flex-col bg-kagit lg:h-full lg:min-h-0" data-app data-sekme={aktif}>
      {/* Üst çubuk */}
      <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-cizgi bg-white px-4 py-2.5 lg:static">
        <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dy-koyu text-white" aria-hidden="true"><Ikon ad="kisi" boyut={20} /></span>
        <div class="min-w-0 flex-1">
          <p class="ui truncate text-[0.95rem] leading-tight font-bold">{doldur(a.kimlik, { yer: m.yerler[DIN_GOREVLISI_YERI] })}</p>
          <p class="ui truncate text-xs font-semibold text-dy-gri-koyu">{a.sayfaBaslik} · {a.ustEtiket}</p>
        </div>
        <details class="relative shrink-0">
          <summary class="ui inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-cizgi px-3 text-sm font-bold" aria-label={m.ortak.dilSecimi}>
            {dilBaglantilari.find((d) => d.aktif)?.kisa}
          </summary>
          <ul class="absolute right-0 z-30 mt-1 grid w-40 gap-0.5 rounded-xl border border-cizgi bg-white p-1.5 shadow-lg">
            {dilBaglantilari.map((d) => (
              <li><a href={d.href} lang={d.dil} class={`ui block rounded-lg px-3 py-2 text-sm font-semibold no-underline ${d.aktif ? 'bg-dy-koyu text-white hover:text-white' : 'text-dy-metin hover:bg-kagit'}`}>{d.ad}</a></li>
            ))}
          </ul>
        </details>
      </header>

      <div class="flex-1 px-4 pt-4 pb-28 lg:overflow-y-auto lg:pb-24" data-app-icerik>
        {aktif === 'bildirimler' && (
          <section aria-labelledby="s-bildirim">
            <div class="mb-3 flex items-center justify-between gap-2">
              <h2 id="s-bildirim" class="text-xl font-bold">{a.bildirimler.baslik}</h2>
              {okunmamis > 0 && (
                <button type="button" class="ui text-sm font-semibold text-dy-koyu underline underline-offset-2" onClick={() => setOkunan(bildirimler.map((b) => b.id))}>{a.bildirimler.hepsiOkundu}</button>
              )}
            </div>
            <ul class="grid gap-2.5" data-bildirimler>
              {bildirimler.map((b) => {
                const okundu = okunan.includes(b.id);
                return (
                  <li>
                    <button type="button" data-bildirim={b.id}
                      onClick={() => { setOkunan((o) => (o.includes(b.id) ? o : [...o, b.id])); setSekme(b.hedef); }}
                      class={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${okundu ? 'border-cizgi bg-white' : 'border-[#F0C4C1] bg-white shadow-[inset_4px_0_0_#B8231F]'}`}>
                      <span class={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${b.vurgu && !okundu ? 'bg-dy-koyu text-white' : 'bg-kagit-2 text-dy-koyu'}`}><Ikon ad={b.ikon} boyut={19} /></span>
                      <span class="min-w-0 flex-1">
                        <span class="flex items-start justify-between gap-2">
                          <span class={`ui text-[0.95rem] leading-snug ${okundu ? 'font-semibold' : 'font-bold'}`}>{b.baslik}</span>
                          <span class="ui shrink-0 text-xs text-dy-gri-koyu tabular-nums">{b.saat}</span>
                        </span>
                        <span class="mt-0.5 block text-[0.9rem] leading-snug text-dy-gri-koyu">{b.metin}</span>
                      </span>
                      {!okundu && <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-dy-kirmizi" aria-label={a.bildirimler.okundu} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {aktif === 'onay' && <Onay m={m} yerel={yerel} camide={camide} setDegisiklikler={setDegisiklikler} />}
        {aktif === 'takip' && <Takip m={m} yerel={yerel} camide={camide} modalAc={modalAc} />}
        {aktif === 'sayim' && <SahaSayimi m={m} modalAc={modalAc} />}
        {aktif === 'gorevler' && <Gorevler m={m} yerel={yerel} gorevler={benimGorevlerim} setGorevler={setGorevler} kisiler={kisiler} />}
        {aktif === 'kaynaklar' && <Kaynaklar m={m} modalAc={modalAc} />}
      </div>

      {/* Alt gezinti */}
      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-cizgi bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:absolute" aria-label={a.sayfaBaslik}>
        <ul class="mx-auto grid max-w-lg grid-cols-6">
          {APP_GEZINTI.map((s) => (
            <li>
              <button type="button" data-app-sekme={s} aria-current={aktif === s ? 'page' : undefined} onClick={() => setSekme(s)}
                class={`ui relative flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-0.5 px-0 text-[0.64rem] leading-tight font-semibold tracking-[-0.015em] ${aktif === s ? 'text-dy-koyu' : 'text-dy-gri-koyu'}`}>
                {aktif === s && <span class="absolute inset-x-2.5 top-0 h-[3px] rounded-b-full bg-dy-koyu" aria-hidden="true" />}
                <span class="relative">
                  <Ikon ad={SEKME_IKON[s]} boyut={22} />
                  {!!rozet[s] && <span class="absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-dy-kirmizi px-1 text-[0.62rem] font-bold text-white">{rozet[s]}</span>}
                </span>
                <span class="max-w-full truncate">{a.sekmeler[s]}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <OnizlemeModal acik={modal} kapat={() => setModal(false)} m={m.modal} />
    </div>
  );
}

/* ── Onay ────────────────────────────────────────────────────────────────────────────── */
function Onay({ m, yerel, camide, setDegisiklikler }: { m: M; yerel: string; camide: ReturnType<typeof etkinKisiler>; setDegisiklikler: (f: (d: Degisiklikler) => Degisiklikler) => void }) {
  const o = m.app.onay;
  const [tarihSecimi, setTarihSecimi] = useState<Record<string, number>>({});
  const adim = (asama: string) => ({ basvuru: 0, hazirlik: 1, torenPlan: 2, torenYapildi: 3 } as Record<string, number>)[asama] ?? 4;
  const liste = camide.filter((k) => ['basvuru', 'hazirlik', 'torenPlan', 'torenYapildi'].includes(k.asama));
  const degistir = (kod: string, d: Degisiklikler[string]) => setDegisiklikler((x) => ({ ...x, [kod]: { ...(x[kod] ?? {}), ...d } }));
  const secenekler = [7, 14, 21];

  return (
    <section aria-labelledby="s-onay">
      <h2 id="s-onay" class="text-xl font-bold">{o.baslik}</h2>
      <p class="mt-1 text-[0.95rem] text-dy-gri-koyu">{o.aciklama}</p>
      <ul class="mt-3 grid gap-3" data-onaylar>
        {liste.map((k) => {
          const n = adim(k.asama);
          return (
            <li class="rounded-2xl border border-cizgi bg-white p-3.5" data-onay-kisi={k.kod}>
              <p class="ui font-bold">{k.kod} · <KisiAdi kisi={k} m={m} /></p>
              <p class="text-sm text-dy-gri-koyu">{m.diller[k.dil]} · {m.iletisim[k.iletisim]}</p>
              <ol class="mt-3 grid grid-cols-4 gap-1" aria-label={o.baslik}>
                {o.adimlar.map((t, i) => (
                  <li class="ui text-center text-[0.68rem] leading-tight font-semibold">
                    <span class={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs ${i < n + 1 ? 'bg-bdv text-white' : 'border-2 border-cizgi text-dy-gri-koyu'}`}>{i < n + 1 ? <Ikon ad="onay" boyut={15} /> : i + 1}</span>
                    <span class={i < n + 1 ? 'text-bdv' : 'text-dy-gri-koyu'}>{t}</span>
                  </li>
                ))}
              </ol>
              <div class="mt-3 grid gap-2">
                {k.asama === 'basvuru' && (
                  <button type="button" class="dugme dugme-birincil w-full" data-onay="hazirlik" onClick={() => degistir(k.kod, { asama: 'hazirlik', randevuGun: 0 })}>
                    <Ikon ad="onay" boyut={18} />{o.hazirlikYapildi}
                  </button>
                )}
                {k.asama === 'hazirlik' && (
                  <>
                    <label class="alan-etiket mb-0" for={`tt-${k.kod}`}>{o.torenTarihi}</label>
                    <select id={`tt-${k.kod}`} class="alan" value={tarihSecimi[k.kod] ?? ''} onChange={(e) => setTarihSecimi({ ...tarihSecimi, [k.kod]: Number(e.currentTarget.value) })}>
                      <option value="">{o.torenTarihiSec}</option>
                      {secenekler.map((g) => <option value={g}>{tarihYaz(g, yerel, { weekday: 'long', day: 'numeric', month: 'long' })}</option>)}
                    </select>
                    <button type="button" class="dugme dugme-birincil w-full" data-onay="tarih" disabled={!tarihSecimi[k.kod]}
                      onClick={() => degistir(k.kod, { asama: 'torenPlan', torenGun: tarihSecimi[k.kod] })}>
                      <Ikon ad="takvim" boyut={18} />{o.torenTarihi}
                    </button>
                  </>
                )}
                {k.asama === 'torenPlan' && (
                  <>
                    <p class="text-sm">{o.torenTarihi}: <strong>{k.torenGun !== undefined ? tarihYaz(k.torenGun, yerel, { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}</strong></p>
                    <button type="button" class="dugme dugme-birincil w-full" data-onay="toren" onClick={() => degistir(k.kod, { asama: 'torenYapildi', torenGun: 0 })}>
                      <Ikon ad="onayDaire" boyut={18} />{o.torenYapildi}
                    </button>
                  </>
                )}
                {k.asama === 'torenYapildi' && (
                  <p class="ui flex items-center gap-2 rounded-xl bg-[#EAF1E4] p-3 text-sm font-semibold text-[#35592A]" data-onay-tamam>
                    <Ikon ad="kurum" boyut={18} />{o.musavirligeGitti}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Takip ───────────────────────────────────────────────────────────────────────────── */
function Takip({ m, yerel, camide, modalAc }: { m: M; yerel: string; camide: ReturnType<typeof etkinKisiler>; modalAc: () => void }) {
  const t = m.app.takip;
  const f = m.panel.dinGorevlisi;
  const [isaret, setIsaret] = useYerelDurum<Record<string, TakipIsareti>>('app:takip', {});
  const [acikForm, setAcikForm] = useState<string | null>(null);
  const [form, setForm] = useState<{ maddeler: boolean[]; durum: number }>({ maddeler: f.maddeler.map(() => false), durum: 0 });
  const liste = randevular(camide).filter((r) => r.tur === 'takip');
  const etiket: Record<TakipIsareti, string> = { gorusuldu: t.gorusuldu, ulasilamadi: t.ulasilamadi, ertele: t.ertele };

  return (
    <section aria-labelledby="s-takip">
      <h2 id="s-takip" class="text-xl font-bold">{t.baslik}</h2>
      <p class="mt-1 text-[0.95rem] text-dy-gri-koyu">{t.aciklama}</p>
      <ul class="mt-3 grid gap-3" data-takip-listesi>
        {liste.map((r) => {
          const k = r.kisi;
          const durum = isaret[k.kod];
          return (
            <li class="rounded-2xl border border-cizgi bg-white p-3.5" data-takip-kisi={k.kod}>
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="ui font-bold">{k.kod} · <KisiAdi kisi={k} m={m} kisa /></p>
                  <p class="text-sm text-dy-gri-koyu">{doldur(m.ortak.takipAyi, { ay: r.ay ?? '' })}</p>
                </div>
                <span class={`ui shrink-0 rounded-lg px-2 py-1 text-center text-xs font-bold ${r.gun <= 1 ? 'bg-dy-koyu text-white' : 'bg-kagit-2 text-dy-metin'}`}>
                  {gunEtiketi(r.gun, m)}<span class="block font-semibold opacity-90">{tarihYaz(r.gun, yerel)}</span>
                </span>
              </div>
              {durum ? (
                <p class="ui mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#EAF1E4] px-3 py-2.5 text-sm font-semibold text-[#35592A]" data-takip-isaretli>
                  <span class="inline-flex items-center gap-1.5"><Ikon ad="onayDaire" boyut={17} />{doldur(t.isaretlendi, { durum: etiket[durum] })}</span>
                  <button type="button" class="underline underline-offset-2" onClick={() => { const y = { ...isaret }; delete y[k.kod]; setIsaret(y); }}>{t.geriAl}</button>
                </p>
              ) : (
                <div class="mt-3 grid grid-cols-3 gap-1.5">
                  {(['gorusuldu', 'ulasilamadi', 'ertele'] as const).map((d) => (
                    <button type="button" data-takip-isaret={d} onClick={() => setIsaret({ ...isaret, [k.kod]: d })}
                      class={`ui min-h-12 rounded-xl border-2 px-1 text-[0.8rem] leading-tight font-bold ${d === 'gorusuldu' ? 'border-bdv bg-bdv text-white' : 'border-cizgi bg-white text-dy-metin'}`}>
                      {etiket[d]}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" class="ui mt-2.5 text-sm font-semibold text-dy-koyu underline underline-offset-2" data-takip-form-ac={k.kod}
                onClick={() => setAcikForm(acikForm === k.kod ? null : k.kod)} aria-expanded={acikForm === k.kod}>
                {acikForm === k.kod ? t.formKapat : doldur(t.formAc, { ay: r.ay ?? '' })}
              </button>
              {acikForm === k.kod && (
                <form class="mt-2 grid gap-2 rounded-xl bg-kagit p-3" onSubmit={(e) => { e.preventDefault(); modalAc(); }}>
                  {f.maddeler.map((x, i) => (
                    <label class="flex min-h-10 items-center gap-2.5 text-[0.92rem]">
                      <input type="checkbox" class="h-5 w-5 accent-[#004878]" checked={form.maddeler[i]}
                        onChange={(e) => { const y = [...form.maddeler]; y[i] = e.currentTarget.checked; setForm({ ...form, maddeler: y }); }} />{x}
                    </label>
                  ))}
                  <fieldset>
                    <legend class="alan-etiket">{f.durumBaslik}</legend>
                    <div class="flex flex-wrap gap-1.5">
                      {f.durumlar.map((x, i) => (
                        <label class={`ui inline-flex min-h-10 cursor-pointer items-center rounded-full border-2 px-3 text-[0.8rem] font-semibold ${form.durum === i ? 'border-bdv bg-[#E6F0F6] text-bdv' : 'border-cizgi bg-white'}`}>
                          <input type="radio" name={`d-${k.kod}`} class="sr-only" checked={form.durum === i} onChange={() => setForm({ ...form, durum: i })} />{x}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button type="submit" class="dugme dugme-birincil w-full" data-takip-form-kaydet>{f.kaydet}</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Sayac({ s, etiket, deger, degis, id }: { s: M['app']['sayim']; etiket: string; deger: number; degis: (n: number) => void; id: string }) {
  return (
    <div class="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-1.5" data-sayac={id}>
    <span class="ui text-[0.95rem] font-semibold">{etiket}</span>
    <span class="flex items-center gap-1">
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-cizgi text-dy-metin disabled:opacity-40" aria-label={`${s.azalt}: ${etiket}`} disabled={deger === 0} onClick={() => degis(Math.max(0, deger - 1))}><Ikon ad="eksi" boyut={18} /></button>
      <output class="ui w-9 text-center text-lg font-bold tabular-nums" aria-live="polite">{deger}</output>
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-bdv bg-bdv text-white" aria-label={`${s.artir}: ${etiket}`} data-artir={id} onClick={() => degis(deger + 1)}><Ikon ad="arti" boyut={18} /></button>
    </span>
  </div>
  );
}

/* ── Saha sayımı (yalnız toplu sayı) ─────────────────────────────────────────────────── */
function SahaSayimi({ m, modalAc }: { m: M; modalAc: () => void }) {
  const s = m.app.sayim;
  const [sayim, setSayim] = useYerelDurum<Sayim>('app:sayim', BOS_SAYIM);
  const diller = Object.keys(BOS_SAYIM.diller) as (keyof Sayim['diller'])[];
  const cinsiyetToplam = sayim.K + sayim.E;
  const dilToplam = diller.reduce((t, d) => t + sayim.diller[d], 0);

  return (
    <section aria-labelledby="s-sayim">
      <h2 id="s-sayim" class="text-xl font-bold">{s.baslik}</h2>
      <p class="mt-1 text-[0.95rem] text-dy-gri-koyu">{s.aciklama}</p>
      <form class="mt-3 grid gap-4" onSubmit={(e) => { e.preventDefault(); modalAc(); }} data-saha-formu>
        <div>
          <label class="alan-etiket" for="sy-yil">{s.yil}</label>
          <select id="sy-yil" class="alan" value={sayim.yil} onChange={(e) => setSayim({ ...sayim, yil: Number(e.currentTarget.value) })}>
            {[2024, 2025, 2026].map((y) => <option value={y}>{y}</option>)}
          </select>
        </div>
        <fieldset class="grid gap-1.5 rounded-2xl bg-kagit-2 p-2">
          <legend class="alan-etiket px-1">{s.cinsiyet}</legend>
          <Sayac s={s} id="K" etiket={m.cinsiyetler.K} deger={sayim.K} degis={(n) => setSayim({ ...sayim, K: n })} />
          <Sayac s={s} id="E" etiket={m.cinsiyetler.E} deger={sayim.E} degis={(n) => setSayim({ ...sayim, E: n })} />
        </fieldset>
        <fieldset class="grid gap-1.5 rounded-2xl bg-kagit-2 p-2">
          <legend class="alan-etiket px-1">{s.dil}</legend>
          {diller.map((d) => (
            <Sayac s={s} id={d} etiket={m.diller[d]} deger={sayim.diller[d]} degis={(n) => setSayim({ ...sayim, diller: { ...sayim.diller, [d]: n } })} />
          ))}
        </fieldset>
        <p class="ui text-sm font-bold">{doldur(s.toplam, { n: cinsiyetToplam })}</p>
        {cinsiyetToplam !== dilToplam && <p class="flex items-start gap-2 rounded-xl bg-[#FFF3D6] p-3 text-sm text-[#7A5410]" role="status"><Ikon ad="uyari" boyut={17} class="mt-0.5 shrink-0" />{s.uyari}</p>}
        <button type="submit" class="dugme dugme-birincil w-full" data-sayim-gonder disabled={cinsiyetToplam === 0 || cinsiyetToplam !== dilToplam}>{s.gonder}</button>
      </form>
    </section>
  );
}

/* ── Görevler + mesaj kutusu ─────────────────────────────────────────────────────────── */
function Gorevler({ m, yerel, gorevler, setGorevler, kisiler }: {
  m: M; yerel: string; gorevler: OrnekGorev[]; kisiler: ReturnType<typeof etkinKisiler>;
  setGorevler: (f: (g: OrnekGorev[]) => OrnekGorev[]) => void;
}) {
  const g = m.app.gorevler;
  const [secili, setSecili] = useState<string | null>(null);
  const [yanitlar, setYanitlar] = useYerelDurum<Record<string, { y: HazirYanit; saat: string }[]>>('app:yanitlar', {});
  const gorev = gorevler.find((x) => x.id === secili);
  const durumYap = (id: string, durum: GorevDurumu) => setGorevler((l) => l.map((x) => (x.id === id ? { ...x, durum } : x)));
  const durumRenk = (d: GorevDurumu) => d === 'tamam' ? 'border-[#C5D8B8] bg-[#EAF1E4] text-[#35592A]' : d === 'suruyor' ? 'border-[#9DBBD1] bg-[#E6F0F6] text-bdv' : 'border-[#F0C4C1] bg-[#FBEDEC] text-dy-koyu';

  if (gorev) {
    const kisi = kisiler.find((k) => k.kod === gorev.kod);
    return (
      <section aria-labelledby="s-gorev" data-gorev-ayrinti={gorev.id}>
        <button type="button" class="ui mb-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-dy-koyu" onClick={() => setSecili(null)}><Ikon ad="geri" boyut={18} />{g.geri}</button>
        <div class="rounded-2xl border border-cizgi bg-white p-3.5">
          <div class="flex items-start justify-between gap-2">
            <h2 id="s-gorev" class="text-lg font-bold">{m.gorevTurleri[gorev.tur]}</h2>
            <span class={`rozet shrink-0 border ${durumRenk(gorev.durum)}`}>{m.gorevDurumlari[gorev.durum]}</span>
          </div>
          <p class="ui mt-0.5 text-sm font-semibold">{gorev.kod}{kisi ? ` · ${m.diller[kisi.dil]}` : ''}</p>
          <p class="text-sm text-dy-gri-koyu">{doldur(g.sonTarih, { tarih: `${tarihYaz(gorev.sonGun, yerel)} (${gunEtiketi(gorev.sonGun, m)})` })}</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            {(['suruyor', 'tamam'] as const).map((d) => (
              <button type="button" class={`dugme ${d === 'tamam' ? 'dugme-birincil' : 'dugme-ikincil'} px-2 text-sm`} data-gorev-durum={d} disabled={gorev.durum === d} onClick={() => durumYap(gorev.id, d)}>{g.durumYap[d]}</button>
            ))}
          </div>
        </div>
        <h3 class="ui mt-4 mb-2 text-sm font-bold">{g.mesajlar}</h3>
        <ol class="grid gap-2" data-mesaj-dizisi>
          {gorev.mesajlar.map((x) => (
            <li class={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.93rem] leading-snug ${x.kimden === 'gorevli' ? 'ml-auto rounded-br-md bg-bdv text-white' : 'rounded-bl-md border border-cizgi bg-white'}`}>
              <span class={`ui mb-0.5 block text-[0.7rem] font-bold ${x.kimden === 'gorevli' ? 'text-white/85' : 'text-dy-gri-koyu'}`}>{g.kimden[x.kimden]} · {tarihYaz(x.gun, yerel)} {x.saat}</span>
              {m.mesajlar[x.metin]}
            </li>
          ))}
          {(yanitlar[gorev.id] ?? []).map((x) => (
            <li class="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-bdv px-3.5 py-2.5 text-[0.93rem] leading-snug text-white" data-yerel-yanit>
              <span class="ui mb-0.5 block text-[0.7rem] font-bold text-white/85">{g.kimden.gorevli} · {tarihYaz(0, yerel)} {x.saat}</span>
              {m.hazirYanitlar[x.y]}
            </li>
          ))}
        </ol>
        <p class="ui mt-4 mb-1.5 text-xs font-semibold text-dy-gri-koyu">{g.hazirYanit}</p>
        <div class="grid gap-1.5" data-hazir-yanitlar>
          {HAZIR_YANITLAR.map((y) => (
            <button type="button" class="ui min-h-11 rounded-xl border-2 border-cizgi bg-white px-3 text-left text-sm font-semibold hover:border-bdv" data-hazir-yanit={y}
              onClick={() => setYanitlar({ ...yanitlar, [gorev.id]: [...(yanitlar[gorev.id] ?? []), { y, saat: saatSimdi() }] })}>
              {m.hazirYanitlar[y]}
            </button>
          ))}
        </div>
        <p class="mt-2 text-xs text-dy-gri-koyu">{g.kisiNotu}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="s-gorevler">
      <h2 id="s-gorevler" class="text-xl font-bold">{g.baslik}</h2>
      <ul class="mt-3 grid gap-2.5" data-gorevler>
        {gorevler.map((x) => {
          const son = x.mesajlar[x.mesajlar.length - 1];
          const adet = x.mesajlar.length + (yanitlar[x.id]?.length ?? 0);
          return (
            <li>
              <button type="button" class="w-full rounded-2xl border border-cizgi bg-white p-3.5 text-left" data-gorev={x.id} onClick={() => setSecili(x.id)}>
                <span class="flex items-start justify-between gap-2">
                  <span class="ui text-[0.95rem] leading-snug font-bold">{m.gorevTurleri[x.tur]}</span>
                  <span class={`rozet shrink-0 border ${durumRenk(x.durum)}`}>{m.gorevDurumlari[x.durum]}</span>
                </span>
                <span class="ui mt-0.5 block text-sm font-semibold text-dy-koyu">{x.kod}</span>
                <span class="mt-0.5 block text-[0.82rem] text-dy-gri-koyu">{doldur(g.sonTarih, { tarih: `${tarihYaz(x.sonGun, yerel)} (${gunEtiketi(x.sonGun, m)})` })}</span>
                {son && <span class="mt-2 line-clamp-2 block rounded-xl bg-kagit px-3 py-2 text-[0.85rem] leading-snug text-dy-metin"><Ikon ad="mesaj" boyut={14} class="mr-1 inline text-dy-gri-koyu" />{m.mesajlar[son.metin]}</span>}
                <span class="ui mt-1.5 block text-right text-xs font-semibold text-dy-gri-koyu">{g.mesajlar}: {adet}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p class="mt-2 text-xs text-dy-gri-koyu">{g.kisiNotu}</p>
    </section>
  );
}

/* ── Duyurular / e-eğitim / dokümanlar ───────────────────────────────────────────────── */
function Kaynaklar({ m, modalAc }: { m: M; modalAc: () => void }) {
  const k = m.app.kaynaklar;
  const [egitim, setEgitim] = useYerelDurum<number[]>('app:egitim', [0]);
  return (
    <section aria-labelledby="s-kaynak" class="grid gap-5">
      <h2 id="s-kaynak" class="text-xl font-bold">{k.baslik}</h2>
      <div>
        <h3 class="ui mb-2 flex items-center gap-2 text-sm font-bold"><Ikon ad="duyuru" boyut={17} class="text-dy-koyu" />{k.duyurular}</h3>
        <ul class="grid gap-2">
          {k.duyuruListesi.map((d) => (
            <li class="rounded-2xl border border-cizgi bg-white p-3.5">
              <p class="ui text-[0.95rem] font-bold">{d.baslik}</p>
              <p class="mt-0.5 text-[0.9rem] text-dy-gri-koyu">{d.metin}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 class="ui mb-2 flex items-center justify-between gap-2 text-sm font-bold">
          <span class="inline-flex items-center gap-2"><Ikon ad="kitap" boyut={17} class="text-dy-koyu" />{k.egitim}</span>
          <span class="font-semibold text-dy-gri-koyu">{doldur(k.egitimDurum, { n: egitim.length })}</span>
        </h3>
        <ul class="grid gap-2">
          {k.egitimListesi.map((e, i) => (
            <li class="flex items-center gap-3 rounded-2xl border border-cizgi bg-white p-3">
              <span class={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${egitim.includes(i) ? 'bg-[#EAF1E4] text-[#35592A]' : 'bg-kagit-2 text-dy-gri-koyu'}`}><Ikon ad={egitim.includes(i) ? 'onay' : 'saat'} boyut={17} /></span>
              <span class="min-w-0 flex-1">
                <span class="ui block text-[0.92rem] leading-snug font-semibold">{e.baslik}</span>
                <span class="text-xs text-dy-gri-koyu">{e.sure}</span>
              </span>
              {!egitim.includes(i) && <button type="button" class="dugme dugme-ikincil min-h-10 px-3 text-sm" data-egitim={i} onClick={() => setEgitim([...egitim, i])}>{k.baslat}</button>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 class="ui mb-2 flex items-center gap-2 text-sm font-bold"><Ikon ad="belge" boyut={17} class="text-dy-koyu" />{k.dokumanlar}</h3>
        <ul class="grid gap-2">
          {k.dokumanListesi.map((d) => (
            <li class="flex items-center justify-between gap-3 rounded-2xl border border-cizgi bg-white p-3">
              <span class="ui text-[0.92rem] leading-snug font-semibold">{d}</span>
              <button type="button" class="dugme dugme-ikincil min-h-10 shrink-0 px-3 text-sm" data-dokuman onClick={modalAc}>{k.ac}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
