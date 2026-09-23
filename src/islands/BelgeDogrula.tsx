/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * ÖRNEK belge doğrulama. Sorgu tamamen tarayıcıda, sabit tek bir örnek numarayla yapılır (ağ yok).
 * Gerçek platformda yalnız kişisel olmayan alanlar döner: belge türü, tarih, düzenleyen makam, durum.
 */
interface Props {
  m: {
    etiket: string; ornekNot: string; dugme: string; bos: string; bulunamadi: string; gecerli: string;
    alanlar: { belgeTuru: string; tarih: string; makam: string; durum: string };
    degerler: { belgeTuru: string; makam: string; durum: string };
  };
  ornekNo: string;
  ornekTarih: string; // biçimlendirilmiş
  baslangic?: string;
}

type Sonuc = { tur: 'bos' } | { tur: 'yok' } | { tur: 'gecerli' } | null;

const normalle = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '').replace(/[–—]/g, '-');

export default function BelgeDogrula({ m, ornekNo, ornekTarih, baslangic = '' }: Props) {
  const [no, setNo] = useState(baslangic);
  const [sonuc, setSonuc] = useState<Sonuc>(null);
  const sonucRef = useRef<HTMLDivElement>(null);

  const sorgula = (deger: string) => {
    const n = normalle(deger);
    setSonuc(!n ? { tur: 'bos' } : n === ornekNo ? { tur: 'gecerli' } : { tur: 'yok' });
    requestAnimationFrame(() => sonucRef.current?.focus());
  };
  const dogrula = (e: Event) => {
    e.preventDefault();
    sorgula(no);
  };

  // Kare kod bağlantısı: ?no=BE-2026-… → alan doldurulur ve yerel olarak sorgulanır (ağ yok).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('no');
    if (q) { setNo(q); sorgula(q); }
  }, []);

  return (
    <div class="grid gap-5">
      <form class="kart p-4 sm:p-6" onSubmit={dogrula} noValidate data-demo-form="dogrula">
        <label class="alan-etiket" for="belge-no">{m.etiket}</label>
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            id="belge-no" name="belge-no" class="alan ui uppercase tracking-wide sm:flex-1" autocomplete="off" spellcheck={false}
            value={no} onInput={(e) => setNo(e.currentTarget.value)} placeholder="BE-2026-…" aria-describedby="belge-no-y"
          />
          <button type="submit" class="dugme dugme-birincil" data-demo-gonder>{m.dugme}</button>
        </div>
        <p id="belge-no-y" class="alan-yardim">
          {m.ornekNot}{' '}
          <button type="button" class="ui font-semibold text-dy-koyu underline underline-offset-2" onClick={() => setNo(ornekNo)}>{ornekNo}</button>
        </p>
      </form>

      <div ref={sonucRef} tabIndex={-1} aria-live="polite" class="outline-none">
        {sonuc?.tur === 'bos' && <p class="rounded-xl border border-cizgi bg-white p-4" role="status">{m.bos}</p>}
        {sonuc?.tur === 'yok' && <p class="rounded-xl border-l-4 border-dy-koyu bg-white p-4" role="status">{m.bulunamadi}</p>}
        {sonuc?.tur === 'gecerli' && (
          <div class="kart overflow-hidden" data-dogrulama-sonucu>
            <div class="flex items-center gap-3 bg-[#E8F3EC] px-5 py-4 text-[#1D5B34]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z" /><path d="m8.8 12 2.2 2.2 4.4-4.4" /></svg>
              <p class="ui text-lg font-bold">{m.gecerli}</p>
              <span class="ui ml-auto text-sm font-semibold">{ornekNo}</span>
            </div>
            <dl class="grid gap-0 divide-y divide-cizgi">
              {([
                [m.alanlar.belgeTuru, m.degerler.belgeTuru],
                [m.alanlar.tarih, ornekTarih],
                [m.alanlar.makam, m.degerler.makam],
                [m.alanlar.durum, m.degerler.durum],
              ] as const).map(([k, v]) => (
                <div class="grid gap-1 px-5 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                  <dt class="ui text-sm font-semibold text-dy-gri-koyu">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
