/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import OnizlemeModal, { type ModalMetni } from './OnizlemeModal';

/**
 * ÖRNEK ihtida başvuru formu — yedi adım. Değerler YALNIZ bileşen belleğinde (useState) tutulur:
 * localStorage, çerez, fetch, action YOK. Son düğme yalnız önizleme penceresini açar.
 */
export interface FormMetni {
  adim: string; geri: string; ileri: string; gonder: string; ilerleme: string; seciniz: string; bos: string;
  cami: string; adSoyad: string; adSoyadOrnek: string; cinsiyet: string; kadin: string; erkek: string;
  dogumTarihi: string; uyruk: string; anneAdi: string; babaAdi: string; medeniHal: string; medeniSecenekler: string[];
  meslek: string; eposta: string; epostaOrnek: string; adres: string; postaKodu: string; sehir: string;
  ulasim: string; ulasimYardim: string; torenDili: string; diller: string[]; tarihTercihi: string; tarihYardim: string;
  sessiz: string; belgeNotu: string; vesikalik: string; kimlik: string; imza: string; ek10: string;
  beyanBaslik: string; beyan: string; beyanOnay: string; ozetBaslik: string; ozetNot: string;
}

interface Props {
  f: FormMetni;
  adimlar: { baslik: string; metin: string }[];
  camiler: { id: string; etiket: string }[];
  modal: ModalMetni;
  evet: string;
}

type Degerler = Record<string, string | boolean>;

export default function BasvuruFormu({ f, adimlar, camiler, modal, evet }: Props) {
  const [adim, setAdim] = useState(0);
  const [d, setD] = useState<Degerler>({});
  const [modalAcik, setModalAcik] = useState(false);
  const baslikRef = useRef<HTMLHeadingElement>(null);
  const toplam = adimlar.length;

  const yaz = (ad: string) => (e: Event) => {
    const h = e.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const deger = h instanceof HTMLInputElement && h.type === 'checkbox' ? h.checked : h.value;
    setD((o) => ({ ...o, [ad]: deger }));
  };
  const git = (i: number) => {
    setAdim(i);
    requestAnimationFrame(() => baslikRef.current?.focus());
  };
  const gonder = (e: Event) => {
    e.preventDefault(); // Önizleme: hiçbir veri hiçbir yere gönderilmez.
    setModalAcik(true);
  };

  const metinAlani = (ad: string, etiket: string, tur = 'text', ek: Record<string, string> = {}) => (
    <div>
      <label class="alan-etiket" for={`bf-${ad}`}>{etiket}</label>
      <input id={`bf-${ad}`} name={ad} type={tur} class="alan" value={(d[ad] as string) ?? ''} onInput={yaz(ad)} autocomplete="off" {...ek} />
    </div>
  );
  const secimAlani = (ad: string, etiket: string, secenekler: { v: string; e: string }[]) => (
    <div>
      <label class="alan-etiket" for={`bf-${ad}`}>{etiket}</label>
      <select id={`bf-${ad}`} name={ad} class="alan" value={(d[ad] as string) ?? ''} onChange={yaz(ad)}>
        <option value="">{f.seciniz}</option>
        {secenekler.map((s) => <option value={s.v}>{s.e}</option>)}
      </select>
    </div>
  );
  const kutu = (ad: string, etiket: string) => (
    <label class="flex items-start gap-3 rounded-xl border border-cizgi bg-kagit p-3" for={`bf-${ad}`}>
      <input id={`bf-${ad}`} name={ad} type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[#B8231F]" checked={!!d[ad]} onChange={yaz(ad)} />
      <span class="font-[family-name:var(--font-govde)] font-normal">{etiket}</span>
    </label>
  );
  const kilitliDosya = (etiket: string) => (
    <div>
      <span class="alan-etiket">{etiket}</span>
      <div class="flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#B9B2A4] bg-kagit-2 px-4 text-center text-sm text-dy-gri-koyu" aria-disabled="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" class="mr-2 shrink-0"><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
        <span>{etiket}</span>
      </div>
    </div>
  );

  const ozetSatirlari: [string, string][] = [
    [f.cami, camiler.find((c) => c.id === d.cami)?.etiket ?? ''],
    [f.adSoyad, (d.adSoyad as string) ?? ''],
    [f.cinsiyet, d.cinsiyet === 'k' ? f.kadin : d.cinsiyet === 'e' ? f.erkek : ''],
    [f.dogumTarihi, (d.dogumTarihi as string) ?? ''],
    [f.uyruk, (d.uyruk as string) ?? ''],
    [`${f.anneAdi} / ${f.babaAdi}`, [d.anneAdi, d.babaAdi].filter(Boolean).join(' / ')],
    [f.medeniHal, (d.medeniHal as string) ?? ''],
    [f.meslek, (d.meslek as string) ?? ''],
    [f.eposta, (d.eposta as string) ?? ''],
    [f.adres, [d.adres, d.postaKodu, d.sehir].filter(Boolean).join(', ')],
    [f.torenDili, (d.torenDili as string) ?? ''],
    [f.tarihTercihi, (d.tarihTercihi as string) ?? ''],
    [f.sessiz, d.sessiz ? evet : ''],
    [f.ek10, d.ek10 ? evet : ''],
  ];

  const adimIcerigi = [
    <div class="grid gap-5 sm:grid-cols-2">
      <div class="sm:col-span-2">{secimAlani('cami', f.cami, camiler.map((c) => ({ v: c.id, e: c.etiket })))}</div>
      <div class="sm:col-span-2">{metinAlani('adSoyad', f.adSoyad, 'text', { placeholder: f.adSoyadOrnek })}</div>
      <fieldset>
        <legend class="alan-etiket">{f.cinsiyet}</legend>
        <div class="flex gap-3">
          {[['k', f.kadin], ['e', f.erkek]].map(([v, e]) => (
            <label class="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-cizgi bg-white px-3">
              <input type="radio" name="cinsiyet" value={v} checked={d.cinsiyet === v} onChange={yaz('cinsiyet')} class="h-5 w-5 accent-[#B8231F]" />
              <span class="font-normal">{e}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {metinAlani('dogumTarihi', f.dogumTarihi, 'date')}
      <div class="sm:col-span-2">{metinAlani('uyruk', f.uyruk)}</div>
    </div>,
    <div class="grid gap-5 sm:grid-cols-2">
      {metinAlani('anneAdi', f.anneAdi)}
      {metinAlani('babaAdi', f.babaAdi)}
      {secimAlani('medeniHal', f.medeniHal, f.medeniSecenekler.map((m) => ({ v: m, e: m })))}
      {metinAlani('meslek', f.meslek)}
    </div>,
    <div class="grid gap-5 sm:grid-cols-2">
      <div class="sm:col-span-2">{metinAlani('eposta', f.eposta, 'email', { placeholder: f.epostaOrnek })}</div>
      <div class="sm:col-span-2">{metinAlani('adres', f.adres)}</div>
      {metinAlani('postaKodu', f.postaKodu, 'text', { inputmode: 'numeric' })}
      {metinAlani('sehir', f.sehir)}
      <div class="sm:col-span-2">
        <label class="alan-etiket" for="bf-ulasim">{f.ulasim}</label>
        <textarea id="bf-ulasim" name="ulasim" rows={3} class="alan" aria-describedby="bf-ulasim-y" value={(d.ulasim as string) ?? ''} onInput={yaz('ulasim')} />
        <p id="bf-ulasim-y" class="alan-yardim">{f.ulasimYardim}</p>
      </div>
    </div>,
    <div class="grid gap-5 sm:grid-cols-2">
      {secimAlani('torenDili', f.torenDili, f.diller.map((x) => ({ v: x, e: x })))}
      <div>
        {metinAlani('tarihTercihi', f.tarihTercihi, 'text', { 'aria-describedby': 'bf-tarih-y' })}
        <p id="bf-tarih-y" class="alan-yardim">{f.tarihYardim}</p>
      </div>
      <div class="sm:col-span-2">{kutu('sessiz', f.sessiz)}</div>
    </div>,
    <div class="grid gap-5">
      <p class="rounded-xl border border-dashed border-dy-altin bg-dy-altin-acik/60 p-4 text-[0.975rem]">{f.belgeNotu}</p>
      <div class="grid gap-4 sm:grid-cols-3">
        {kilitliDosya(f.vesikalik)}
        {kilitliDosya(f.kimlik)}
        {kilitliDosya(f.imza)}
      </div>
    </div>,
    <div class="grid gap-5">
      {kutu('ek10', f.ek10)}
      <div class="rounded-xl border border-cizgi bg-kagit p-4">
        <p class="ui text-sm font-bold tracking-[0.06em] uppercase text-dy-altin-koyu">{f.beyanBaslik}</p>
        <p class="mt-1 italic">{f.beyan}</p>
      </div>
      {metinAlani('beyanAd', f.beyanOnay, 'text', { placeholder: f.adSoyadOrnek })}
    </div>,
    <div>
      <h4 class="ui text-base font-bold">{f.ozetBaslik}</h4>
      <p class="alan-yardim">{f.ozetNot}</p>
      <dl class="mt-4 divide-y divide-cizgi rounded-xl border border-cizgi bg-white">
        {ozetSatirlari.map(([k, v]) => (
          <div class="grid gap-1 px-4 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4">
            <dt class="ui text-sm font-semibold text-dy-gri-koyu">{k}</dt>
            <dd class="break-words">{v || f.bos}</dd>
          </div>
        ))}
      </dl>
    </div>,
  ];

  return (
    <form class="kart overflow-hidden" onSubmit={gonder} noValidate data-demo-form="basvuru" aria-labelledby="bf-adim-baslik">
      <nav aria-label={f.ilerleme} class="border-b border-cizgi bg-kagit px-4 py-4 sm:px-6">
        <ol class="flex gap-1.5">
          {adimlar.map((a, i) => (
            <li class="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => git(i)}
                aria-current={i === adim ? 'step' : undefined}
                aria-label={`${i + 1}. ${a.baslik}`}
                class={`block h-2 w-full rounded-full transition-colors ${i < adim ? 'bg-dy-altin' : i === adim ? 'bg-dy-koyu' : 'bg-cizgi'}`}
              />
            </li>
          ))}
        </ol>
        <p class="ui mt-3 text-sm font-semibold text-dy-gri-koyu" aria-live="polite">
          {f.adim.replace('{simdi}', String(adim + 1)).replace('{toplam}', String(toplam))}
        </p>
      </nav>

      <div class="px-4 py-6 sm:px-6">
        <h3 id="bf-adim-baslik" ref={baslikRef} tabIndex={-1} class="text-xl font-bold outline-none sm:text-2xl">
          {adim + 1}. {adimlar[adim].baslik}
        </h3>
        <p class="mt-1 text-dy-gri-koyu">{adimlar[adim].metin}</p>
        <div class="mt-6">{adimIcerigi[adim]}</div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-cizgi bg-kagit px-4 py-4 sm:px-6">
        <button type="button" class="dugme dugme-ikincil" onClick={() => git(Math.max(0, adim - 1))} disabled={adim === 0}>
          {f.geri}
        </button>
        {adim < toplam - 1 ? (
          // Ayrı `key`: aynı DOM düğmesinin tıklama sırasında type="submit"e dönüşüp formu göndermesini önler.
          <button key="ileri" type="button" class="dugme dugme-birincil" onClick={() => git(adim + 1)}>{f.ileri}</button>
        ) : (
          <button key="gonder" type="submit" class="dugme dugme-birincil" data-demo-gonder>{f.gonder}</button>
        )}
      </div>
      <OnizlemeModal acik={modalAcik} kapat={() => setModalAcik(false)} m={modal} />
    </form>
  );
}
