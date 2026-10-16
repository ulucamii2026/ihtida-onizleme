/** @jsxImportSource preact */
/**
 * BULUŞMA SONRASI ANKET — koordinatörün toplu sonuç kartları (Öneri 14, önizleme).
 * Yalnız buluşma başına toplu sayılar; kişi, yanıt satırı ya da serbest metin yoktur. Yanıt sayısı küçük grup
 * eşiğinin altındaysa sonuç HİÇ açılmaz ve yanıt sayısı da yazılmaz (eşik değeri arayüzde gösterilmez).
 * Soru ve seçenek metinleri kamu sözlüğünden gelir (tek kaynak: src/i18n/<dil>.ts → anket).
 */
import { KUCUK_GRUP_ESIGI, ORNEK_ANKETLER, type AnketSonucu } from '../../data/ornek-moduller';
import type { Sozluk } from '../../i18n/tipler';
import { doldur } from '../../lib/yerelDurum';
import { Cubuklar, Ikon, Kart, camiAdiYer, tamTarih, type M } from './ortak';

export type KamuAnket = Sozluk['anket'];

interface Props { m: M; yerel: string; anket: KamuAnket; anketHref: string }

export default function AnketSonuclari({ m, yerel, anket, anketHref }: Props) {
  const p = m.panel.anket;
  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      {ORNEK_ANKETLER.map((a) => {
        const baslik = `${m.faaliyetTurleri[a.tur]} · ${camiAdiYer(a.yer, m)} · ${tamTarih(a.gun, yerel)}`;
        return a.yanit >= KUCUK_GRUP_ESIGI && a.memnuniyet
          ? <Sonuc m={m} yerel={yerel} anket={anket} a={a} baslik={baslik} />
          : (
            <Kart baslik={baslik} id={`an-${a.id}`}>
              <div class="flex items-start gap-3 rounded-xl border border-dashed border-[#B9B2A4] bg-kagit p-4" data-anket-gizli={a.id}>
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kagit-2 text-dy-gri-koyu"><Ikon ad="kilit" boyut={20} /></span>
                <div>
                  <p class="ui font-bold">{p.gizli}</p>
                  <p class="mt-1 text-sm text-dy-gri-koyu">{p.gizliAciklama}</p>
                </div>
              </div>
            </Kart>
          );
      })}
      <div class="flex flex-col gap-3 rounded-2xl border border-cizgi bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex items-start gap-2 text-sm text-dy-gri-koyu"><Ikon ad="anket" boyut={18} class="mt-0.5 shrink-0 text-bdv" />{p.kagitNot}</p>
        <a class="dugme dugme-ikincil sm:shrink-0" href={anketHref}><Ikon ad="ok" boyut={18} />{p.anketSayfasi}</a>
      </div>
    </div>
  );
}

function Sonuc({ m, yerel, anket, a, baslik }: { m: M; yerel: string; anket: KamuAnket; a: AnketSonucu; baslik: string }) {
  const p = m.panel.anket;
  const memnuniyet = a.memnuniyet!;
  const ortalama = memnuniyet.reduce((t, n, i) => t + n * (i + 1), 0) / a.yanit;
  const sayi = new Intl.NumberFormat(yerel, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const ucluler: { soru: string; secenekler: readonly string[]; dagilim?: readonly number[]; kimlik: string }[] = [
    { kimlik: 'konu', soru: anket.sorular.konu, secenekler: anket.evetKismenHayir, dagilim: a.konu },
    { kimlik: 'dil', soru: anket.sorular.dil, secenekler: anket.evetKismenHayir, dagilim: a.dil },
    { kimlik: 'sure', soru: anket.sorular.sure, secenekler: anket.sureSecenekleri, dagilim: a.sure },
    { kimlik: 'tekrar', soru: anket.sorular.tekrar, secenekler: anket.tekrarSecenekleri, dagilim: a.tekrar },
  ];
  const istekler = (a.istekler ?? [])
    .map((n, i) => ({ etiket: anket.istekler[i], deger: n }))
    .sort((x, y) => y.deger - x.deger);
  const enBuyuk = Math.max(1, ...istekler.map((x) => x.deger));

  return (
    <Kart baslik={baslik} id={`an-${a.id}`} sag={<span class="rozet border border-[#9DBBD1] bg-[#E6F0F6] text-bdv">{doldur(p.yanit, { n: a.yanit })}</span>}>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2" data-anket-sonuc={a.id}>
        <div>
          <p class="ui text-sm font-semibold text-dy-gri-koyu">{p.ortalama}</p>
          <p class="ui mt-1 text-4xl leading-none font-bold text-bdv tabular-nums" data-anket-ortalama>
            {sayi.format(ortalama)} <span class="text-lg font-semibold text-dy-gri-koyu">/ 5</span>
          </p>
          <div class="mt-4">
            <Cubuklar baslik={p.memnuniyetDagilimi} satirlar={memnuniyet.map((n, i) => ({ etiket: String(i + 1), deger: n }))} />
          </div>
        </div>
        <ul class="grid content-start gap-3">
          {ucluler.map((u) => (
            <li data-anket-soru={u.kimlik}>
              <p class="ui text-[0.9rem] leading-snug font-semibold">{u.soru}</p>
              <p class="mt-1 flex flex-wrap gap-1.5">
                {u.secenekler.map((s, i) => (
                  <span class="rozet border border-cizgi bg-kagit text-dy-metin">{s} <span class="tabular-nums text-bdv">{u.dagilim?.[i] ?? 0}</span></span>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <figure class="md:col-span-2">
          <figcaption class="ui mb-2 text-sm font-semibold text-dy-gri-koyu">{p.istekBaslik} · <span class="font-normal">{anket.cokluSecim}</span></figcaption>
          <ul class="grid gap-2 sm:grid-cols-2 sm:gap-x-6">
            {istekler.map((x) => (
              <li class="text-sm">
                <span class="flex items-baseline justify-between gap-2"><span>{x.etiket}</span><span class="ui font-semibold tabular-nums">{x.deger}</span></span>
                <span class="mt-1 block h-2.5 rounded-full bg-kagit-2" aria-hidden="true">
                  <span class="block h-2.5 rounded-full bg-bdv" style={{ width: `${(x.deger / enBuyuk) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </Kart>
  );
}
