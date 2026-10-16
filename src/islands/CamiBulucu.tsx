/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import 'leaflet/dist/leaflet.css';
import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet';
import type { Cami, IlKodu, BolgeDili } from '../data/camiler';

/**
 * Cami bulucu: süzgeç + liste + Leaflet haritası. Veri derleme anında gömülüdür (fetch YOK).
 * Tek dış istek: OpenStreetMap harita karoları (tile.openstreetmap.org) — CSP'de yalnız o izinli.
 */
interface Metin {
  ara: string; il: string; tumu: string; bolgeDili: string; dilFr: string; dilNl: string; dilDe: string; dilIki: string;
  sonuc: string; sonucYok: string; harita: string; haritaYukleniyor: string;
  haritadaGoster: string; kaynak: string;
}
interface Props { camiler: Cami[]; m: Metin; iller: Record<IlKodu, string>; ilSirasi: IlKodu[]; yerel: string }

const TR_KATLAMA = (s: string, yerel: string) =>
  s.toLocaleLowerCase(yerel).normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');

export default function CamiBulucu({ camiler, m, iller, ilSirasi, yerel }: Props) {
  const [arama, setArama] = useState('');
  const [il, setIl] = useState<IlKodu | ''>('');
  const [dil, setDil] = useState<BolgeDili | ''>('');
  const [haritaHazir, setHaritaHazir] = useState(false);

  const haritaKutusu = useRef<HTMLDivElement>(null);
  const harita = useRef<LMap | null>(null);
  const katman = useRef<LayerGroup | null>(null);
  const isaretler = useRef<Map<string, CircleMarker>>(new Map());

  const dilAdi: Record<BolgeDili, string> = { fr: m.dilFr, nl: m.dilNl, de: m.dilDe, 'fr-nl': m.dilIki };

  const suzulmus = useMemo(() => {
    const q = TR_KATLAMA(arama.trim(), yerel);
    return camiler.filter((c) =>
      (!il || c.il === il) &&
      (!dil || c.bolgeDili === dil || (dil !== 'de' && c.bolgeDili === 'fr-nl')) &&
      (!q || TR_KATLAMA(`${c.ad} ${c.sehir} ${c.postaKodu}`, yerel).includes(q)),
    );
  }, [camiler, arama, il, dil, yerel]);

  // Aynı belediye merkezine düşen camiler üst üste binmesin: küçük, sabit bir kaydırma.
  const konumlar = useMemo(() => {
    const sayac = new Map<string, number>();
    const sonuc = new Map<string, [number, number]>();
    for (const c of camiler) {
      if (!c.konum) continue;
      const anahtar = c.konum.join(',');
      const n = sayac.get(anahtar) ?? 0;
      sayac.set(anahtar, n + 1);
      const aci = n * 2.4;
      sonuc.set(c.id, n === 0 ? c.konum : [c.konum[0] + Math.cos(aci) * 0.006 * Math.ceil(n / 6), c.konum[1] + Math.sin(aci) * 0.009 * Math.ceil(n / 6)]);
    }
    return sonuc;
  }, [camiler]);

  useEffect(() => {
    let iptal = false;
    import('leaflet').then((L) => {
      if (iptal || !haritaKutusu.current || harita.current) return;
      const h = L.map(haritaKutusu.current, { scrollWheelZoom: false, attributionControl: true }).setView([50.6, 4.6], 8);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(h);
      h.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>'); // bayraksız, tarafsız önek
      harita.current = h;
      katman.current = L.layerGroup().addTo(h);
      setHaritaHazir(true);
    });
    return () => { iptal = true; harita.current?.remove(); harita.current = null; };
  }, []);

  useEffect(() => {
    if (!haritaHazir || !katman.current || !harita.current) return;
    import('leaflet').then((L) => {
      const k = katman.current!;
      k.clearLayers();
      isaretler.current.clear();
      const sinir: [number, number][] = [];
      for (const c of suzulmus) {
        const p = konumlar.get(c.id);
        if (!p) continue;
        const kutu = document.createElement('div');
        const b = document.createElement('strong'); b.textContent = c.ad; kutu.append(b);
        const y = document.createElement('div'); y.textContent = `${c.adres}, ${c.postaKodu} ${c.sehir}`; kutu.append(y);
        const i = L.circleMarker(p, {
          radius: 7,
          color: '#fff', weight: 2,
          fillColor: '#B8231F', fillOpacity: 0.95,
        }).bindPopup(kutu).bindTooltip(c.ad);
        i.addTo(k);
        isaretler.current.set(c.id, i);
        sinir.push(p);
      }
      if (sinir.length) harita.current!.fitBounds(sinir, { padding: [28, 28], maxZoom: 12 });
    });
  }, [haritaHazir, suzulmus, konumlar]);

  const haritadaGoster = (id: string) => {
    const i = isaretler.current.get(id);
    if (!i || !harita.current) return;
    harita.current.setView(i.getLatLng(), 13);
    i.openPopup();
    haritaKutusu.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div class="grid gap-6">
      <div class="kart grid gap-4 p-4 sm:grid-cols-3 sm:items-end sm:p-5">
        <div>
          <label class="alan-etiket" for="cb-ara">{m.ara}</label>
          <input id="cb-ara" type="search" class="alan" value={arama} onInput={(e) => setArama(e.currentTarget.value)} autocomplete="off" />
        </div>
        <div>
          <label class="alan-etiket" for="cb-il">{m.il}</label>
          <select id="cb-il" class="alan" value={il} onChange={(e) => setIl(e.currentTarget.value as IlKodu | '')}>
            <option value="">{m.tumu}</option>
            {ilSirasi.map((k) => <option value={k}>{iller[k]}</option>)}
          </select>
        </div>
        <div>
          <label class="alan-etiket" for="cb-dil">{m.bolgeDili}</label>
          <select id="cb-dil" class="alan" value={dil} onChange={(e) => setDil(e.currentTarget.value as BolgeDili | '')}>
            <option value="">{m.tumu}</option>
            <option value="fr">{m.dilFr}</option>
            <option value="nl">{m.dilNl}</option>
            <option value="de">{m.dilDe}</option>
          </select>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div class="order-2 lg:order-1">
          <p class="ui mb-3 text-sm font-semibold text-dy-gri-koyu" role="status" aria-live="polite">
            {m.sonuc.replace('{n}', String(suzulmus.length))}
          </p>
          {suzulmus.length === 0 ? (
            <p class="kart p-5">{m.sonucYok}</p>
          ) : (
            <ul class="grid max-h-[36rem] gap-2.5 overflow-y-auto pr-1" data-cami-listesi>
              {suzulmus.map((c) => (
                <li class="kart p-4">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <h3 class="text-base font-bold">{c.ad} <span class="font-semibold text-dy-gri-koyu">· {c.sehir}</span></h3>
                  </div>
                  <p class="mt-1 text-[0.95rem]">{c.adres}, {c.postaKodu} {c.sehir}</p>
                  <p class="mt-1 text-sm text-dy-gri-koyu">{iller[c.il]} · {dilAdi[c.bolgeDili]} · {c.kurum}</p>
                  {c.konum && (
                    <button type="button" class="ui mt-2 text-sm font-semibold text-dy-koyu underline underline-offset-2" onClick={() => haritadaGoster(c.id)}>
                      {m.haritadaGoster}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div class="order-1 lg:order-2">
          <div class="kart relative overflow-hidden lg:sticky lg:top-4">
            <div ref={haritaKutusu} role="region" aria-label={m.harita} class="h-[20rem] w-full bg-kagit-2 sm:h-[26rem] lg:h-[34rem]" />
            {!haritaHazir && <p class="absolute inset-x-0 top-0 p-4 text-sm text-dy-gri-koyu">{m.haritaYukleniyor}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
