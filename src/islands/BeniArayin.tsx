/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import 'leaflet/dist/leaflet.css';
import type { Map as LMap, LayerGroup } from 'leaflet';
import OnizlemeModal, { type ModalMetni } from './OnizlemeModal';
import { cipSinifi } from './cip';
import { TAKMA_ADLAR, VALONYA_SINIRI, YER_KONUM } from '../data/ornek-moduller';
import type { Yer } from '../data/ornek-dosyalar';
import type { Sozluk } from '../i18n/tipler';

/**
 * «BENİ ARAYIN» (Öneri 18, önizleme) — rıza önce: ayrı ve açık rıza işaretlenmeden alanlar açılmaz.
 * Serbest metin YOK: takma ad örnek listeden, yaş aralığı ve ilçe seçimle, cinsiyet çiple seçilir; iletişim alanı kilitlidir.
 * Değerler YALNIZ bu bileşenin belleğindedir (useState): localStorage'a yazılmaz, hiçbir yere gönderilmez.
 * «Beni arayın» yalnız «Önizleme: gönderim kapalı» penceresini açar ve işareti bu ekrandaki haritada ilçe düzeyinde gösterir
 * (görünüm değişmez → yeni harita karosu istenmez). «İşaretimi geri çek» bütün bellek durumunu sıfırlar.
 * Kamuya açık başka işaret GÖSTERİLMEZ: harita yalnız kişinin kendi işaretini, yalnız kendi ekranında gösterir.
 */
interface Props {
  t: Sozluk['beniArayin'];
  modal: ModalMetni;
  seciniz: string;
  yasAraliklari: readonly string[];
  yerler: { kod: Yer; ad: string }[];
  cinsiyetler: { K: string; E: string };
  kurgusal: string;
}

type Cinsiyet = 'K' | 'E';
interface Secim { takmaAd: string; yas: string; ilce: Yer | ''; cinsiyet: Cinsiyet | '' }
interface Isaret { takmaAd: string; yas: number; ilce: Yer; cinsiyet: Cinsiyet }

const BOS: Secim = { takmaAd: '', yas: '', ilce: '', cinsiyet: '' };

export default function BeniArayin({ t, modal, seciniz, yasAraliklari, yerler, cinsiyetler, kurgusal }: Props) {
  const [riza, setRiza] = useState(false);
  const [secim, setSecim] = useState<Secim>(BOS);
  const [isaret, setIsaret] = useState<Isaret | null>(null);
  const [geriCekildi, setGeriCekildi] = useState(false);
  const [acik, setAcik] = useState(false);
  const [haritaHazir, setHaritaHazir] = useState(false);
  const haritaKutusu = useRef<HTMLDivElement>(null);
  const harita = useRef<LMap | null>(null);
  const katman = useRef<LayerGroup | null>(null);

  const hazir = riza && !!secim.takmaAd && secim.yas !== '' && secim.ilce !== '' && !!secim.cinsiyet;
  const durumVar = riza || isaret !== null || Object.values(secim).some((v) => v !== '');
  const yerAdi = (y: Yer) => yerler.find((x) => x.kod === y)?.ad ?? y;

  // Harita: açılışta bir kez (Valonya görünümü). Karolar yalnız burada yüklenir.
  useEffect(() => {
    let iptal = false;
    import('leaflet').then((L) => {
      if (iptal || !haritaKutusu.current || harita.current) return;
      const h = L.map(haritaKutusu.current, { scrollWheelZoom: false, attributionControl: true });
      h.fitBounds(VALONYA_SINIRI, { padding: [8, 8] });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 12,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(h);
      h.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      harita.current = h;
      katman.current = L.layerGroup().addTo(h);
      setHaritaHazir(true);
    });
    return () => { iptal = true; harita.current?.remove(); harita.current = null; };
  }, []);

  // İşaret: ilçe merkezinde ~9 km'lik daire + nokta + kalıcı etiket. Görünüm DEĞİŞMEZ (yeni karo isteği olmasın).
  useEffect(() => {
    if (!haritaHazir || !katman.current) return;
    const k = katman.current;
    k.clearLayers();
    if (!isaret) return;
    import('leaflet').then((L) => {
      const p = YER_KONUM[isaret.ilce];
      L.circle(p, { radius: 9000, color: '#004878', weight: 2, fillColor: '#004878', fillOpacity: 0.12 }).addTo(k);
      const etiket = document.createElement('span');
      etiket.textContent = `${isaret.takmaAd} · ${yerAdi(isaret.ilce)}`;
      L.circleMarker(p, { radius: 7, color: '#fff', weight: 2, fillColor: '#004878', fillOpacity: 1 })
        .bindTooltip(etiket, { permanent: true, direction: 'top', offset: [0, -8] })
        .addTo(k);
    });
  }, [haritaHazir, isaret]);

  const gonder = (e: Event) => {
    e.preventDefault();
    if (!hazir) return;
    setIsaret({ takmaAd: secim.takmaAd, yas: Number(secim.yas), ilce: secim.ilce as Yer, cinsiyet: secim.cinsiyet as Cinsiyet });
    setGeriCekildi(false);
    setAcik(true);
  };

  const geriCek = () => {
    setIsaret(null);
    setSecim(BOS);
    setRiza(false);
    setGeriCekildi(true);
  };

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
      <form class="kart grid gap-5 p-4 sm:p-6" noValidate data-demo-form="beni-arayin" onSubmit={gonder}>
        <fieldset class="rounded-2xl border-2 border-[#9DBBD1] bg-[#E6F0F6]/50 p-4" data-riza-kutusu>
          <legend class="ui px-1.5 text-base font-bold text-bdv">{t.rizaBaslik}</legend>
          <ul class="grid gap-2 text-[0.95rem]">
            {t.rizaMaddeler.map((x) => (
              <li class="flex items-start gap-2.5">
                <svg class="mt-1 shrink-0 text-bdv" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-bdv bg-white p-3.5 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-bdv">
            <input type="checkbox" class="mt-0.5 h-5 w-5 shrink-0 accent-[#004878]" checked={riza} onChange={(e) => setRiza(e.currentTarget.checked)} data-riza-onay />
            <span class="ui text-[0.95rem] font-semibold">{t.rizaOnay}</span>
          </label>
          <p class="mt-2 text-sm text-dy-gri-koyu">{t.rizaAyri}</p>
        </fieldset>

        <fieldset class="grid gap-5 transition-opacity disabled:opacity-55" disabled={!riza} aria-describedby={riza ? undefined : 'ba-riza-bekliyor'} data-isaret-alanlari>
          {!riza && (
            <p id="ba-riza-bekliyor" class="ui flex items-center gap-2 rounded-xl bg-kagit-2 px-3 py-2 text-sm font-semibold text-dy-gri-koyu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
              {t.rizaBekliyor}
            </p>
          )}
          <div role="radiogroup" aria-labelledby="ba-takma-ad-baslik" aria-describedby="ba-takma-ad-yardim">
            <p id="ba-takma-ad-baslik" class="alan-etiket">{t.takmaAd}</p>
            <div class="flex flex-wrap gap-2">
              {TAKMA_ADLAR.map((ad) => (
                <label class={cipSinifi(secim.takmaAd === ad)} data-takma-ad={ad}>
                  <input type="radio" name="ba-takma-ad" class="sr-only" value={ad} checked={secim.takmaAd === ad} onChange={() => setSecim({ ...secim, takmaAd: ad })} />
                  {ad}
                </label>
              ))}
            </div>
            <p id="ba-takma-ad-yardim" class="alan-yardim">{t.takmaAdYardim} <span class="text-dy-altin-koyu">({kurgusal})</span></p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="alan-etiket" for="ba-yas">{t.yas}</label>
              <select id="ba-yas" class="alan" value={secim.yas} onChange={(e) => setSecim({ ...secim, yas: e.currentTarget.value })}>
                <option value="">{seciniz}</option>
                {yasAraliklari.map((y, i) => <option value={String(i)}>{y}</option>)}
              </select>
            </div>
            <div>
              <label class="alan-etiket" for="ba-ilce">{t.ilce}</label>
              <select id="ba-ilce" class="alan" value={secim.ilce} aria-describedby="ba-ilce-yardim" onChange={(e) => setSecim({ ...secim, ilce: e.currentTarget.value as Yer | '' })}>
                <option value="">{seciniz}</option>
                {yerler.map((y) => <option value={y.kod}>{y.ad}</option>)}
              </select>
              <p id="ba-ilce-yardim" class="alan-yardim">{t.ilceYardim}</p>
            </div>
          </div>

          <div role="radiogroup" aria-labelledby="ba-cinsiyet-baslik" aria-describedby="ba-cinsiyet-yardim">
            <p id="ba-cinsiyet-baslik" class="alan-etiket">{t.cinsiyet}</p>
            <div class="flex flex-wrap gap-2">
              {(['K', 'E'] as const).map((c) => (
                <label class={cipSinifi(secim.cinsiyet === c)} data-cinsiyet={c}>
                  <input type="radio" name="ba-cinsiyet" class="sr-only" value={c} checked={secim.cinsiyet === c} onChange={() => setSecim({ ...secim, cinsiyet: c })} />
                  {cinsiyetler[c]}
                </label>
              ))}
            </div>
            <p id="ba-cinsiyet-yardim" class="alan-yardim">{t.cinsiyetYardim}</p>
          </div>

          <div>
            <label class="alan-etiket" for="ba-iletisim">{t.iletisim}</label>
            <div class="relative">
              <svg class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dy-gri-koyu" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
              <input id="ba-iletisim" type="text" class="alan pl-10" disabled value="" aria-describedby="ba-iletisim-yardim" />
            </div>
            <p id="ba-iletisim-yardim" class="alan-yardim">{t.iletisimKilitli}</p>
          </div>
        </fieldset>

        <div class="flex flex-wrap items-center gap-3 border-t border-cizgi pt-4">
          <button type="submit" class="dugme dugme-birincil" disabled={!hazir} data-demo-gonder>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
            {t.gonder}
          </button>
          <button type="button" class="dugme dugme-ikincil" disabled={!durumVar} onClick={geriCek} data-isaret-geri-cek>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
            {t.geriCek}
          </button>
          {!hazir && <p class="w-full text-sm text-dy-gri-koyu" data-eksik>{t.eksik}</p>}
        </div>
        <OnizlemeModal acik={acik} kapat={() => setAcik(false)} m={modal} />
      </form>

      <div class="grid gap-4 lg:sticky lg:top-4">
        <section class="kart overflow-hidden" aria-labelledby="ba-harita-baslik">
          <h3 id="ba-harita-baslik" class="border-b border-cizgi px-4 py-3 text-base font-bold">{t.haritaBaslik}</h3>
          <div class="relative">
            <div ref={haritaKutusu} role="region" aria-label={t.haritaEtiket} class="h-[17rem] w-full bg-kagit-2 sm:h-[21rem]" data-beni-arayin-haritasi />
            {!haritaHazir && <p class="absolute inset-x-0 top-0 p-4 text-sm text-dy-gri-koyu">{t.haritaYukleniyor}</p>}
          </div>
          <p class="px-4 py-3 text-sm text-dy-gri-koyu">{t.haritaNot}</p>
        </section>

        <div aria-live="polite" data-isaret-durumu={isaret ? 'var' : 'yok'}>
          {isaret ? (
            <div class="kart border-l-4 border-l-bdv p-4">
              <p class="ui font-bold">{t.isaretBaslik}</p>
              <p class="mt-1">
                <span class="ui font-semibold">{isaret.takmaAd}</span> <span class="text-sm text-dy-altin-koyu">({kurgusal})</span>
                {' · '}{yasAraliklari[isaret.yas]}{' · '}{yerAdi(isaret.ilce)}
              </p>
              <p class="mt-2 text-sm text-dy-gri-koyu">{t.kimGorur}</p>
              <p class="mt-1 text-sm text-dy-gri-koyu">{t.donus}</p>
            </div>
          ) : geriCekildi ? (
            <p class="kart flex items-start gap-2 p-4 text-sm" data-geri-cekildi>
              <svg class="mt-0.5 shrink-0 text-[#35592A]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.6" /></svg>
              {t.geriCekildi}
            </p>
          ) : (
            <p class="rounded-xl bg-white/70 px-4 py-3 text-sm text-dy-gri-koyu">{t.haritaBos}</p>
          )}
        </div>
      </div>
    </div>
  );
}
