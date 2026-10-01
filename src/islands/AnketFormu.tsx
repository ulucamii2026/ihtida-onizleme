/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import OnizlemeModal, { type ModalMetni } from './OnizlemeModal';
import { cipSinifi } from './cip';
import type { Sozluk } from '../i18n/tipler';

/**
 * BULUŞMA SONRASI TEK SAYFALIK ANKET (Öneri 14, önizleme) — anonim: ad alanı YOK, serbest metin YOK, bütün sorular
 * isteğe bağlı. Cevaplar yalnız bu bileşenin belleğindedir (useState); gönderim yalnız «Önizleme: gönderim kapalı»
 * penceresini açar. Gerçek platformda yanıtlar buluşma başına toplanır; çok küçük gruplarda sonuç gösterilmez.
 */
interface Props { t: Sozluk['anket']; modal: ModalMetni }

type Uclu = 0 | 1 | 2 | null;
interface Cevaplar { memnuniyet: number | null; konu: Uclu; dil: Uclu; sure: Uclu; istekler: boolean[]; tekrar: Uclu }

export default function AnketFormu({ t, modal }: Props) {
  const bos = (): Cevaplar => ({ memnuniyet: null, konu: null, dil: null, sure: null, istekler: t.istekler.map(() => false), tekrar: null });
  const [c, setC] = useState<Cevaplar>(bos);
  const [acik, setAcik] = useState(false);

  // Bileşen değil, JSX döndüren işlev: her çizimde yeni bileşen türü oluşmasın (odak kaybolmasın).
  const uclu = (ad: 'konu' | 'dil' | 'sure' | 'tekrar', soru: string, secenekler: readonly string[]) => (
    <fieldset class="grid gap-2.5" data-anket-soru={ad}>
      <legend class="alan-etiket">{soru}</legend>
      <div class="flex flex-wrap gap-2">
        {secenekler.map((s, i) => (
          <label class={cipSinifi(c[ad] === i)} data-secenek={i}>
            <input type="radio" name={`an-${ad}`} class="sr-only" checked={c[ad] === i} onChange={() => setC({ ...c, [ad]: i as Uclu })} />
            {s}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form class="kart grid gap-7 p-4 sm:p-7" noValidate data-demo-form="anket" onSubmit={(e) => { e.preventDefault(); setAcik(true); }}>
      <fieldset class="grid gap-2.5" data-anket-soru="memnuniyet">
        <legend class="alan-etiket">{t.sorular.memnuniyet}</legend>
        <div class="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label class={`${cipSinifi(c.memnuniyet === n)} min-w-12 justify-center`} data-memnuniyet={n}>
              <input type="radio" name="an-memnuniyet" class="sr-only" checked={c.memnuniyet === n} onChange={() => setC({ ...c, memnuniyet: n })} />
              {n}
            </label>
          ))}
        </div>
        <p class="ui flex flex-wrap justify-between gap-x-4 text-sm text-dy-gri-koyu sm:max-w-[22rem]">
          <span>{t.memnuniyetUclari[0]}</span><span>{t.memnuniyetUclari[1]}</span>
        </p>
      </fieldset>

      {uclu('konu', t.sorular.konu, t.evetKismenHayir)}
      {uclu('dil', t.sorular.dil, t.evetKismenHayir)}
      {uclu('sure', t.sorular.sure, t.sureSecenekleri)}

      <fieldset class="grid gap-2.5" data-anket-soru="istekler">
        <legend class="alan-etiket">{t.sorular.istekler}</legend>
        <p class="-mt-1 text-sm text-dy-gri-koyu">{t.cokluSecim}</p>
        <ul class="grid gap-2 sm:grid-cols-2">
          {t.istekler.map((s, i) => (
            <li>
              <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-cizgi bg-white px-3.5 py-2 has-[input:checked]:border-bdv has-[input:checked]:bg-[#E6F0F6]/60 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bdv" data-istek={i}>
                <input type="checkbox" class="h-5 w-5 shrink-0 accent-[#004878]" checked={c.istekler[i]}
                  onChange={(e) => { const y = [...c.istekler]; y[i] = e.currentTarget.checked; setC({ ...c, istekler: y }); }} />
                <span class="text-[0.95rem]">{s}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {uclu('tekrar', t.sorular.tekrar, t.tekrarSecenekleri)}

      <div class="flex flex-wrap items-center gap-3 border-t border-cizgi pt-5">
        <button type="submit" class="dugme dugme-birincil" data-demo-gonder>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          {t.gonder}
        </button>
        <button type="button" class="dugme dugme-ikincil" onClick={() => setC(bos())} data-anket-temizle>{t.temizle}</button>
        <p class="w-full text-sm text-dy-gri-koyu">{t.bellekNot}</p>
      </div>
      <OnizlemeModal acik={acik} kapat={() => setAcik(false)} m={modal} />
    </form>
  );
}
