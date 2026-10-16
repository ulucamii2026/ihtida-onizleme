/** @jsxImportSource preact */
/**
 * Koordinatör görünümü: özet sayılar, aşamalara göre bütün dosyalar (pano), geciken işler, görev atama
 * (yalnız seçim kutuları — serbest metin yok), görev listesi ve hatırlatmalar.
 */
import { useState } from 'preact/hooks';
import { useYerelDurum, doldur } from '../../lib/yerelDurum';
import { gecikenler, randevular } from '../../lib/dosyalar';
import {
  ASAMALAR, GOREV_TURLERI, ORNEK_GOREVLER, ORNEK_GOREVLILER,
  type GorevTuru, type OrnekGorev, type OrnekKisi,
} from '../../data/ornek-dosyalar';
import { AsamaRozeti, Ikon, Kart, KisiAdi, gorevliAdi, gunEtiketi, tarihYaz, type M } from './ortak';
import type { RolOzellikleri } from './PanelUygulamasi';

export const GOREV_ANAHTARI = 'gorevler:v1';

function DosyaKarti({ k, m, yerel }: { k: OrnekKisi; m: M; yerel: string }) {
  let alt = '';
  if (k.asama === 'basvuru') alt = gunEtiketi(k.basvuruGun, m);
  else if (k.asama === 'hazirlik' && k.randevuGun !== undefined) alt = `${m.panel.koordinator.hazirlikGorusmesi} · ${tarihYaz(k.randevuGun, yerel)}`;
  else if ((k.asama === 'torenPlan' || k.asama === 'torenYapildi') && k.torenGun !== undefined) alt = tarihYaz(k.torenGun, yerel);
  else if (k.takipAyi && k.sonrakiGun !== undefined) alt = `${doldur(m.ortak.takipAyi, { ay: k.takipAyi })} · ${tarihYaz(k.sonrakiGun, yerel)}`;
  const gec = (k.asama === 'basvuru' && -k.basvuruGun > 5) || (k.sonrakiGun !== undefined && k.sonrakiGun < 0 && (k.asama === 'takip' || k.asama === 'belgeVerildi'));
  return (
    <li class={`min-w-0 rounded-xl border bg-white p-2.5 ${gec ? 'border-dy-koyu shadow-[inset_3px_0_0_#B8231F]' : 'border-cizgi'}`} data-dosya={k.kod}>
      <p class="ui flex items-center justify-between gap-1 text-[0.8rem] font-bold">
        <span>{k.kod}</span>
        <span class="rounded bg-kagit-2 px-1.5 text-[0.7rem] font-semibold text-dy-gri-koyu uppercase">{k.dil}</span>
      </p>
      <p class="mt-0.5 truncate text-[0.9rem] leading-snug"><KisiAdi kisi={k} m={m} kisa /></p>
      <p class="truncate text-[0.8rem] text-dy-gri-koyu">{m.yerler[k.yer]}</p>
      {alt && <p class={`ui mt-1 truncate text-[0.72rem] font-semibold ${gec ? 'text-dy-koyu' : 'text-dy-altin-koyu'}`}>{alt}</p>}
    </li>
  );
}

export default function Koordinator({ m, yerel, kisiler }: RolOzellikleri) {
  const p = m.panel.koordinator;
  const [gorevler, setGorevler] = useYerelDurum<OrnekGorev[]>(GOREV_ANAHTARI, ORNEK_GOREVLER);
  const [secim, setSecim] = useState<{ kod: string; gorevli: string; tur: GorevTuru; sure: 'g1' | 'g3' | 'g7' }>({
    kod: kisiler[0]?.kod ?? '', gorevli: ORNEK_GOREVLILER[0].id, tur: 'takipGorusmesi', sure: 'g3',
  });
  const [bildirim, setBildirim] = useState('');

  const geciken = gecikenler(kisiler);
  const yaklasan = randevular(kisiler).filter((r) => r.gun >= 0 && r.gun <= 14);
  const buHafta = yaklasan.filter((r) => r.gun <= 6).length;

  const ata = (e: Event) => {
    e.preventDefault();
    const sonGun = { g1: 1, g3: 3, g7: 7 }[secim.sure];
    const yeni: OrnekGorev = { id: `g${Date.now()}`, kod: secim.kod, tur: secim.tur, gorevli: secim.gorevli, sonGun, durum: 'yeni', mesajlar: [] };
    setGorevler((g) => [yeni, ...g]);
    setBildirim(doldur(p.atandi, { kod: secim.kod }));
  };

  const ozet = [
    { ad: p.ozet.aktif, n: kisiler.length, ikon: 'belge' as const, renk: 'text-dy-metin' },
    { ad: p.ozet.belgeBekleyen, n: kisiler.filter((k) => k.asama === 'torenYapildi').length, ikon: 'kurum' as const, renk: 'text-[#7A5410]' },
    { ad: p.ozet.geciken, n: geciken.length, ikon: 'uyari' as const, renk: 'text-dy-koyu' },
    { ad: p.ozet.buHafta, n: buHafta, ikon: 'takvim' as const, renk: 'text-bdv' },
  ];

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4" data-ozet>
        {ozet.map((o) => (
          <li class="kart flex min-w-0 items-center gap-3 p-3.5">
            <span class={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kagit-2 ${o.renk}`}><Ikon ad={o.ikon} boyut={20} /></span>
            <span class="min-w-0">
              <span class={`ui block text-2xl leading-none font-bold tabular-nums ${o.renk}`}>{o.n}</span>
              <span class="ui mt-1 block text-[0.8rem] leading-tight font-semibold hyphens-auto text-dy-gri-koyu [overflow-wrap:anywhere]">{o.ad}</span>
            </span>
          </li>
        ))}
      </ul>

      <Kart baslik={p.panoBaslik} id="k-pano">
        <div class="-mx-1 overflow-x-auto px-1 pb-1">
          <div class="grid auto-cols-[minmax(11.5rem,1fr)] grid-flow-col gap-2.5 xl:grid-flow-row xl:grid-cols-6" data-pano>
            {ASAMALAR.map((a) => {
              const liste = kisiler.filter((k) => k.asama === a);
              return (
                <section class="min-w-0 rounded-2xl bg-kagit p-2" aria-label={m.asamalar[a]}>
                  <h4 class="mb-2 flex items-center justify-between gap-1 px-0.5">
                    <AsamaRozeti asama={a} m={m} />
                    <span class="ui text-sm font-bold text-dy-gri-koyu tabular-nums">{liste.length}</span>
                  </h4>
                  <ul class="grid gap-2">
                    {liste.map((k) => <DosyaKarti k={k} m={m} yerel={yerel} />)}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </Kart>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Kart baslik={p.gecikenBaslik} id="k-geciken" sag={<span class="rozet border border-[#F0C4C1] bg-[#FBEDEC] text-dy-koyu">{geciken.length}</span>}>
          {geciken.length === 0 ? <p class="text-sm">{m.ortak.yok}</p> : (
            <ul class="grid gap-2" data-geciken>
              {geciken.map((g) => (
                <li class="flex items-start gap-2 rounded-xl bg-[#FBEDEC] p-3 text-[0.95rem]">
                  <Ikon ad="uyari" boyut={18} class="mt-0.5 shrink-0 text-dy-koyu" />
                  <span>{g.tur === 'basvuru'
                    ? doldur(p.gecikenBasvuru, { kod: g.kisi.kod, n: g.gun })
                    : doldur(p.gecikenTakip, { kod: g.kisi.kod, ay: g.kisi.takipAyi ?? '', n: g.gun })}</span>
                </li>
              ))}
            </ul>
          )}
          <h4 class="ui mt-5 mb-2 text-sm font-bold">{p.hatirlatmaBaslik}</h4>
          <ul class="grid gap-1.5 text-[0.95rem]" data-hatirlatmalar>
            {yaklasan.slice(0, 6).map((r) => (
              <li class="flex items-center gap-2">
                <Ikon ad="saat" boyut={16} class="shrink-0 text-dy-altin-koyu" />
                <span>
                  {r.tur === 'toren' && doldur(p.hatirlatmaToren, { kod: r.kisi.kod, tarih: `${tarihYaz(r.gun, yerel)} (${gunEtiketi(r.gun, m)})` })}
                  {r.tur === 'takip' && doldur(p.hatirlatmaTakip, { kod: r.kisi.kod, ay: r.ay ?? '', tarih: `${tarihYaz(r.gun, yerel)} (${gunEtiketi(r.gun, m)})` })}
                  {r.tur === 'hazirlik' && doldur(p.hatirlatmaRandevu, { kod: r.kisi.kod, tur: p.hazirlikGorusmesi, tarih: `${tarihYaz(r.gun, yerel)} (${gunEtiketi(r.gun, m)})` })}
                </span>
              </li>
            ))}
          </ul>
        </Kart>

        <Kart baslik={p.gorevAtaBaslik} id="k-gorev-ata">
          <form class="grid gap-3 sm:grid-cols-2" onSubmit={ata} data-gorev-ata>
            <div>
              <label class="alan-etiket" for="ga-dosya">{p.dosya}</label>
              <select id="ga-dosya" class="alan" value={secim.kod} onChange={(e) => setSecim({ ...secim, kod: e.currentTarget.value })}>
                {kisiler.map((k) => <option value={k.kod}>{k.kod} · {m.yerler[k.yer]}</option>)}
              </select>
            </div>
            <div>
              <label class="alan-etiket" for="ga-gorevli">{p.gorevli}</label>
              <select id="ga-gorevli" class="alan" value={secim.gorevli} onChange={(e) => setSecim({ ...secim, gorevli: e.currentTarget.value })}>
                {ORNEK_GOREVLILER.map((g) => <option value={g.id}>{gorevliAdi(g, m)}</option>)}
              </select>
            </div>
            <div>
              <label class="alan-etiket" for="ga-tur">{p.gorevTuru}</label>
              <select id="ga-tur" class="alan" value={secim.tur} onChange={(e) => setSecim({ ...secim, tur: e.currentTarget.value as GorevTuru })}>
                {GOREV_TURLERI.map((t) => <option value={t}>{m.gorevTurleri[t]}</option>)}
              </select>
            </div>
            <div>
              <label class="alan-etiket" for="ga-sure">{p.sonTarih}</label>
              <select id="ga-sure" class="alan" value={secim.sure} onChange={(e) => setSecim({ ...secim, sure: e.currentTarget.value as 'g1' | 'g3' | 'g7' })}>
                {(['g1', 'g3', 'g7'] as const).map((s) => <option value={s}>{p.sureler[s]}</option>)}
              </select>
            </div>
            <div class="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" class="dugme dugme-birincil" data-gorev-ata-dugme><Ikon ad="gorev" boyut={18} />{p.ata}</button>
              <p class="ui text-sm font-semibold text-[#35592A]" role="status" aria-live="polite">{bildirim}</p>
            </div>
          </form>

          <h4 class="ui mt-5 mb-2 text-sm font-bold">{p.gorevlerBaslik}</h4>
          <ul class="grid max-h-72 gap-2 overflow-y-auto" data-gorev-listesi>
            {gorevler.map((g) => (
              <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cizgi bg-kagit px-3 py-2 text-[0.92rem]">
                <span class="min-w-0">
                  <span class="ui font-bold">{g.kod}</span> · {m.gorevTurleri[g.tur]}
                  <span class="block text-[0.82rem] text-dy-gri-koyu">{gorevliAdi(ORNEK_GOREVLILER.find((x) => x.id === g.gorevli), m)} · {tarihYaz(g.sonGun, yerel)}</span>
                </span>
                <span class={`rozet border ${g.durum === 'tamam' ? 'border-[#C5D8B8] bg-[#EAF1E4] text-[#35592A]' : g.durum === 'suruyor' ? 'border-[#9DBBD1] bg-[#E6F0F6] text-bdv' : 'border-[#F0C4C1] bg-[#FBEDEC] text-dy-koyu'}`}>{m.gorevDurumlari[g.durum]}</span>
              </li>
            ))}
          </ul>
        </Kart>
      </div>
    </div>
  );
}
