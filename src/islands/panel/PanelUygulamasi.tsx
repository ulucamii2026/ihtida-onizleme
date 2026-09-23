/** @jsxImportSource preact */
/**
 * KOORDİNATÖRLÜK PANELİ (önizleme, 2. faz) — rol değiştiricili tek adacık.
 * Giriş yok: «Önizleme: rol seçimi» görünür bir denetimdir. Bütün veriler kurgusaldır (src/data/ornek-dosyalar.ts);
 * yapılan gösterim değişiklikleri yalnız bu tarayıcının localStorage'ında tutulur. AĞ İSTEĞİ YOKTUR.
 */
import { useMemo, useState } from 'preact/hooks';
import OnizlemeModal from '../OnizlemeModal';
import { useYerelDurum, hepsiniSil, doldur } from '../../lib/yerelDurum';
import { DOSYA_ANAHTARI, etkinKisiler, type Degisiklikler } from '../../lib/dosyalar';
import { PANEL_GEZINTI, type PanelRolu } from '../../lib/gezinti';
import { Ikon, type IkonAdi, type M } from './ortak';
import { BOLGE_SORUMLUSU_BOLGESI, DIN_GOREVLISI_YERI } from '../../data/ornek-dosyalar';
import Musavirlik from './Musavirlik';
import Koordinator from './Koordinator';
import BolgeSorumlusu from './BolgeSorumlusu';
import DinGorevlisi from './DinGorevlisi';
import KisiselAlan from './KisiselAlan';

type Alan = keyof M['alanlar'];

/** Veri en aza indirme: her rolün gördüğü alanlar (arayüzde görünür kılınır). */
const GORUNUR: Record<PanelRolu, Alan[]> = {
  musavirlik: ['kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'kimlik', 'uyruk', 'belgeler', 'belgeNo', 'takip', 'istatistik'],
  koordinator: ['kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'belgeNo', 'takip', 'istatistik'],
  bolge: ['kod', 'ad', 'dil', 'asama', 'cami', 'tarihler', 'takip'],
  dinGorevlisi: ['kod', 'ad', 'dil', 'iletisim', 'tarihler'],
  muhtedi: ['ad', 'dil', 'iletisim', 'asama', 'tarihler', 'belgeNo', 'takip'],
};
const TUM_ALANLAR: Alan[] = ['kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'kimlik', 'uyruk', 'belgeler', 'belgeNo', 'takip', 'istatistik'];

const ROL_IKON: Record<PanelRolu, IkonAdi> = {
  koordinator: 'kisiler',
  musavirlik: 'kurum',
  bolge: 'takvim',
  dinGorevlisi: 'kisi',
  muhtedi: 'kalkan',
};

interface Props { m: M; yerel: string; appHref: string }

export default function PanelUygulamasi({ m, yerel, appHref }: Props) {
  const [rol, setRol] = useYerelDurum<PanelRolu>('panel:rol', 'koordinator');
  const [degisiklikler, setDegisiklikler] = useYerelDurum<Degisiklikler>(DOSYA_ANAHTARI, {});
  const [modal, setModal] = useState(false);
  const kisiler = useMemo(() => etkinKisiler(degisiklikler), [degisiklikler]);
  const p = m.panel;
  const aktifRol: PanelRolu = (PANEL_GEZINTI as readonly string[]).includes(rol) ? rol : 'koordinator';

  const ortak = { m, yerel, kisiler, degisiklikler, setDegisiklikler, modalAc: () => setModal(true) };
  const gorunur = GORUNUR[aktifRol];
  const gorunmez = TUM_ALANLAR.filter((a) => !gorunur.includes(a));
  const baslik = {
    musavirlik: p.musavirlik.baslik,
    koordinator: p.koordinator.baslik,
    bolge: doldur(p.bolge.baslik, { bolge: m.bolgeler[BOLGE_SORUMLUSU_BOLGESI] }),
    dinGorevlisi: doldur(p.dinGorevlisi.baslik, { yer: m.yerler[DIN_GOREVLISI_YERI] }),
    muhtedi: p.muhtedi.baslik,
  }[aktifRol];
  const aciklama = { musavirlik: '', koordinator: '', bolge: p.bolge.aciklama, dinGorevlisi: p.dinGorevlisi.aciklama, muhtedi: p.muhtedi.aciklama }[aktifRol];

  return (
    <div data-panel data-rol={aktifRol}>
      {/* Önizleme: rol seçimi — gerçek platformda rol girişle belirlenir */}
      <div class="border-b border-cizgi bg-white">
        <div class="kap py-3">
          <div class="rounded-2xl border-2 border-dashed border-dy-altin bg-dy-altin-acik/60 p-3 sm:p-3.5" role="group" aria-labelledby="rol-secimi-baslik">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p id="rol-secimi-baslik" class="ui text-[0.8rem] font-bold tracking-[0.06em] text-[#5A4F33] uppercase">{p.rolSecimi}</p>
              <p class="text-sm text-[#5A4F33]">{p.rolSecimiNot}</p>
            </div>
            <div class="mt-2 flex flex-wrap gap-1.5" data-rol-secici>
              {PANEL_GEZINTI.map((r) => (
                <button
                  type="button"
                  data-rol-dugme={r}
                  aria-pressed={aktifRol === r}
                  onClick={() => setRol(r)}
                  class={`ui inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3.5 text-sm font-semibold transition-colors ${
                    aktifRol === r ? 'border-dy-koyu bg-dy-koyu text-white' : 'border-[#D9CFB8] bg-white text-dy-metin hover:border-dy-koyu'
                  }`}
                >
                  <Ikon ad={ROL_IKON[r]} boyut={18} />
                  {p.rolAdlari[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div class="kap py-6 sm:py-8">
        <div>
          <p class="ust-etiket">{doldur(p.kimOlarak, { rol: p.rolAdlari[aktifRol] })}</p>
          <h2 class="mt-1 text-[1.6rem] font-bold sm:text-[1.9rem]">{baslik}</h2>
          {aciklama && <p class="mt-1.5 max-w-3xl text-dy-gri-koyu">{aciklama}</p>}
        </div>
        <div class="kart mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-2.5 text-sm" data-veri-azaltma>
          <span class="ui inline-flex items-center gap-1.5 font-bold text-bdv"><Ikon ad="kalkan" boyut={17} />{p.veriAzaltma}</span>
          <span class="ui text-xs font-semibold text-dy-gri-koyu">{p.gorunur}:</span>
          {gorunur.map((a) => (
            <span class="rozet border border-[#9DBBD1] bg-[#E6F0F6] text-bdv" data-alan-gorunur={a}><Ikon ad="goz" boyut={13} />{m.alanlar[a]}</span>
          ))}
          {gorunmez.length > 0 && <span class="ui ml-1 text-xs font-semibold text-dy-gri-koyu">{p.gorunmez}:</span>}
          {gorunmez.map((a) => (
            <span class="rozet border border-cizgi bg-kagit-2 text-dy-gri-koyu line-through decoration-1" data-alan-gizli={a}><Ikon ad="gozKapali" boyut={13} />{m.alanlar[a]}</span>
          ))}
        </div>

        <div class="mt-5" data-rol-icerik={aktifRol}>
          {aktifRol === 'musavirlik' && <Musavirlik {...ortak} />}
          {aktifRol === 'koordinator' && <Koordinator {...ortak} />}
          {aktifRol === 'bolge' && <BolgeSorumlusu {...ortak} />}
          {aktifRol === 'dinGorevlisi' && <DinGorevlisi {...ortak} />}
          {aktifRol === 'muhtedi' && <KisiselAlan {...ortak} />}
        </div>

        <div class="mt-10 flex flex-col gap-3 border-t border-cizgi pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p class="max-w-xl text-sm text-dy-gri-koyu">{m.ortak.sifirlaNot}</p>
          <div class="flex flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap">
            <a class="dugme dugme-ikincil" href={appHref}><Ikon ad="telefon" boyut={18} />{p.uygulamaAc}</a>
            <button type="button" class="dugme dugme-ikincil" data-sifirla onClick={() => { hepsiniSil(); location.reload(); }}>
              <Ikon ad="cevrim" boyut={18} />{m.ortak.sifirla}
            </button>
          </div>
        </div>
      </div>

      <OnizlemeModal acik={modal} kapat={() => setModal(false)} m={m.modal} />
    </div>
  );
}

export interface RolOzellikleri {
  m: M;
  yerel: string;
  kisiler: ReturnType<typeof etkinKisiler>;
  degisiklikler: Degisiklikler;
  setDegisiklikler: (d: Degisiklikler | ((o: Degisiklikler) => Degisiklikler)) => void;
  modalAc: () => void;
}
