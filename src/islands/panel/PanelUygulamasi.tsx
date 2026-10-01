/** @jsxImportSource preact */
/**
 * KOORDİNATÖRLÜK PANELİ (önizleme, 2. faz) — rol değiştiricili tek adacık.
 * Giriş yok: «Önizleme: rol seçimi» görünür bir denetimdir. Bütün veriler kurgusaldır (src/data/ornek-dosyalar.ts,
 * src/data/ornek-moduller.ts); yapılan gösterim değişiklikleri yalnız bu tarayıcının localStorage'ında tutulur. AĞ İSTEĞİ YOKTUR
 * (yeni modüller de statik olarak içe aktarılır: sekme değişince parça yüklenmez).
 * Rolün içinde modül sekmeleri vardır (ROL_MODULLERI): dosyalar · faaliyet günlüğü · buluşma anketleri · rehber haritası.
 * Bölge ve din görevlisi rollerinde «Önizleme: görevli» anahtarı kadın görevli görünümünü açar (kadın kayıtlı işaretler).
 */
import { useMemo, useState } from 'preact/hooks';
import OnizlemeModal from '../OnizlemeModal';
import { useYerelDurum, hepsiniSil, doldur } from '../../lib/yerelDurum';
import { DOSYA_ANAHTARI, etkinKisiler, type Degisiklikler } from '../../lib/dosyalar';
import { PANEL_GEZINTI, PANEL_MODULLERI, type PanelModulu, type PanelRolu } from '../../lib/gezinti';
import { Ikon, type IkonAdi, type M } from './ortak';
import { BOLGE_SORUMLUSU_BOLGESI, DIN_GOREVLISI_YERI, YERLER, YER_BOLGE, type Yer } from '../../data/ornek-dosyalar';
import Musavirlik from './Musavirlik';
import Koordinator from './Koordinator';
import BolgeSorumlusu from './BolgeSorumlusu';
import DinGorevlisi from './DinGorevlisi';
import KisiselAlan from './KisiselAlan';
import FaaliyetGunlugu, { type FaaliyetGorunumu } from './FaaliyetGunlugu';
import RehberHaritasi, { type HaritaGorunumu } from './RehberHaritasi';
import AnketSonuclari, { type KamuAnket } from './AnketSonuclari';

type Alan = keyof M['alanlar'];

/** Veri en aza indirme: her rolün gördüğü alanlar (arayüzde görünür kılınır). */
const GORUNUR: Record<PanelRolu, Alan[]> = {
  musavirlik: ['kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'kimlik', 'uyruk', 'belgeler', 'belgeNo', 'takip', 'istatistik', 'erisimKaydi'],
  koordinator: ['kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'belgeNo', 'takip', 'istatistik'],
  bolge: ['kod', 'ad', 'dil', 'asama', 'cami', 'tarihler', 'takip', 'faaliyet', 'isaretler', 'erisimKaydi'],
  dinGorevlisi: ['kod', 'ad', 'dil', 'iletisim', 'tarihler', 'faaliyet', 'isaretler', 'erisimKaydi'],
  muhtedi: ['ad', 'dil', 'iletisim', 'asama', 'tarihler', 'belgeNo', 'takip'],
};
const TUM_ALANLAR: Alan[] = [
  'kod', 'ad', 'dil', 'iletisim', 'asama', 'cami', 'tarihler', 'kimlik', 'uyruk', 'belgeler', 'belgeNo', 'takip', 'istatistik',
  'faaliyet', 'isaretler', 'kadinIsaretleri', 'erisimKaydi',
];
/** Kadın kayıtlı işaretler («kadinIsaretleri») yalnız bu rollerin «kadın görevli» görünümünde görünür. */
const KADIN_GOREVLI_ROLLERI: PanelRolu[] = ['bolge', 'dinGorevlisi'];

/** Rolün içindeki ekranlar. Koordinatör ve Müşavirlik faaliyet günlüğünü yalnız toplu görür; haritada işaret görmez. */
const ROL_MODULLERI: Record<PanelRolu, PanelModulu[]> = {
  koordinator: ['dosyalar', 'faaliyet', 'anket', 'harita'],
  musavirlik: ['dosyalar', 'faaliyet', 'harita'],
  bolge: ['dosyalar', 'faaliyet', 'harita'],
  dinGorevlisi: ['dosyalar', 'faaliyet', 'harita'],
  muhtedi: ['dosyalar'],
};

const ROL_IKON: Record<PanelRolu, IkonAdi> = {
  koordinator: 'kisiler',
  musavirlik: 'kurum',
  bolge: 'takvim',
  dinGorevlisi: 'kisi',
  muhtedi: 'kalkan',
};
const MODUL_IKON: Record<PanelModulu, IkonAdi> = { dosyalar: 'belge', faaliyet: 'gunluk', anket: 'anket', harita: 'harita' };

/** Bölge sorumlusunun kapsamındaki ilçeler (önizlemede Liège bölgesi: Liège ve Eupen). */
const BOLGE_YERLERI: Yer[] = YERLER.filter((y) => YER_BOLGE[y] === BOLGE_SORUMLUSU_BOLGESI);

/** Kamu sitesine bağlantılar ve anket metinleri (panel sayfası derleme anında kamu sözlüğünden verir). */
export interface KamuVerisi { haritaHref: string; anketHref: string; anket: KamuAnket }

interface Props { m: M; yerel: string; appHref: string; kamu: KamuVerisi }

export default function PanelUygulamasi({ m, yerel, appHref, kamu }: Props) {
  const [rol, setRol] = useYerelDurum<PanelRolu>('panel:rol', 'koordinator');
  const [modul, setModul] = useYerelDurum<PanelModulu>('panel:modul', 'dosyalar');
  const [kadinGorevli, setKadinGorevli] = useYerelDurum<boolean>('harita:kadin-gorevli', false);
  const [degisiklikler, setDegisiklikler] = useYerelDurum<Degisiklikler>(DOSYA_ANAHTARI, {});
  const [modal, setModal] = useState(false);
  const kisiler = useMemo(() => etkinKisiler(degisiklikler), [degisiklikler]);
  const p = m.panel;
  const aktifRol: PanelRolu = (PANEL_GEZINTI as readonly string[]).includes(rol) ? rol : 'koordinator';
  const moduller = ROL_MODULLERI[aktifRol];
  const aktifModul: PanelModulu = (PANEL_MODULLERI as readonly string[]).includes(modul) && moduller.includes(modul) ? modul : 'dosyalar';
  const kadinSecilebilir = KADIN_GOREVLI_ROLLERI.includes(aktifRol);
  const kadin = kadinSecilebilir && kadinGorevli;
  const rolDegistir = (r: PanelRolu) => { setRol(r); setModul('dosyalar'); };

  const modalAc = () => setModal(true);
  const ortak = { m, yerel, kisiler, degisiklikler, setDegisiklikler, modalAc, kamu };
  const gorunurKume = new Set<Alan>([...GORUNUR[aktifRol], ...(kadin ? (['kadinIsaretleri'] as Alan[]) : [])]);
  const gorunur = TUM_ALANLAR.filter((a) => gorunurKume.has(a));
  const gorunmez = TUM_ALANLAR.filter((a) => !gorunurKume.has(a));

  // Modüllerde görünüm: bölge sorumlusu → bölge, din görevlisi → cami irtibat kişisi, diğerleri → toplu
  const faaliyetGorunumu: FaaliyetGorunumu = aktifRol === 'bolge' ? 'bolge' : aktifRol === 'dinGorevlisi' ? 'cami' : 'toplu';
  const haritaGorunumu: HaritaGorunumu =
    aktifRol === 'bolge' ? 'bolge' : aktifRol === 'dinGorevlisi' ? 'cami' : aktifRol === 'musavirlik' ? 'denetim' : 'toplu';
  const kapsam: Yer[] = aktifRol === 'bolge' ? BOLGE_YERLERI : [DIN_GOREVLISI_YERI];
  const yerDoldur = { bolge: m.bolgeler[BOLGE_SORUMLUSU_BOLGESI], yer: doldur(m.ornekCami, { yer: m.yerler[DIN_GOREVLISI_YERI] }) };

  const dosyaBaslik = {
    musavirlik: p.musavirlik.baslik,
    koordinator: p.koordinator.baslik,
    bolge: doldur(p.bolge.baslik, { bolge: m.bolgeler[BOLGE_SORUMLUSU_BOLGESI] }),
    dinGorevlisi: doldur(p.dinGorevlisi.baslik, { yer: m.yerler[DIN_GOREVLISI_YERI] }),
    muhtedi: p.muhtedi.baslik,
  }[aktifRol];
  const dosyaAciklama = { musavirlik: '', koordinator: '', bolge: p.bolge.aciklama, dinGorevlisi: p.dinGorevlisi.aciklama, muhtedi: p.muhtedi.aciklama }[aktifRol];
  const [baslik, aciklama] = ({
    dosyalar: [dosyaBaslik, dosyaAciklama],
    faaliyet: [doldur(p.faaliyet.basliklar[faaliyetGorunumu], yerDoldur), p.faaliyet.aciklamalar[faaliyetGorunumu]],
    anket: [p.anket.baslik, p.anket.aciklama],
    harita: [
      doldur(p.harita.basliklar[haritaGorunumu], yerDoldur),
      haritaGorunumu === 'bolge' || haritaGorunumu === 'cami' ? p.harita.aciklamalar[haritaGorunumu] : '',
    ],
  } as Record<PanelModulu, [string, string]>)[aktifModul];
  const rolEtiketi = kadin ? `${p.rolAdlari[aktifRol]} · ${p.kadinGorevliEk}` : p.rolAdlari[aktifRol];

  return (
    <div data-panel data-rol={aktifRol} data-modul={aktifModul}>
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
                  onClick={() => rolDegistir(r)}
                  class={`ui inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3.5 text-sm font-semibold transition-colors ${
                    aktifRol === r ? 'border-dy-koyu bg-dy-koyu text-white' : 'border-[#D9CFB8] bg-white text-dy-metin hover:border-dy-koyu'
                  }`}
                >
                  <Ikon ad={ROL_IKON[r]} boyut={18} />
                  {p.rolAdlari[r]}
                </button>
              ))}
            </div>
            {kadinSecilebilir && (
              <div class="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-[#D9CFB8] pt-2.5" role="group" aria-labelledby="gorevli-secimi-baslik" data-kadin-gorevli-secici>
                <p id="gorevli-secimi-baslik" class="ui text-[0.8rem] font-bold tracking-[0.06em] text-[#5A4F33] uppercase">{p.gorevliSecimi}</p>
                <div class="flex flex-wrap gap-1.5">
                  {([false, true] as const).map((k) => (
                    <button
                      type="button"
                      data-kadin-gorevli={k ? 'evet' : 'hayir'}
                      aria-pressed={kadinGorevli === k}
                      onClick={() => setKadinGorevli(k)}
                      class={`ui inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3.5 text-sm font-semibold transition-colors ${
                        kadinGorevli === k ? 'border-bdv bg-bdv text-white' : 'border-[#D9CFB8] bg-white text-dy-metin hover:border-bdv'
                      }`}
                    >
                      <Ikon ad="kisi" boyut={17} />
                      {k ? p.kadinGorevli : p.erkekGorevli}
                    </button>
                  ))}
                </div>
                <p class="text-sm text-[#5A4F33]">{p.kadinGorevliNot}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div class="kap py-6 sm:py-8">
        {moduller.length > 1 && (
          <div class="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2" role="group" aria-labelledby="modul-secimi-baslik">
            <p id="modul-secimi-baslik" class="ui text-xs font-semibold tracking-[0.04em] text-dy-gri-koyu uppercase">{p.modulSecimi}</p>
            <div class="flex flex-wrap gap-1.5" data-modul-secici>
              {moduller.map((md) => (
                <button
                  type="button"
                  data-modul-dugme={md}
                  aria-pressed={aktifModul === md}
                  onClick={() => setModul(md)}
                  class={`ui inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-semibold transition-colors ${
                    aktifModul === md ? 'border-bdv bg-[#E6F0F6] text-bdv' : 'border-cizgi bg-white text-dy-metin hover:border-bdv'
                  }`}
                >
                  <Ikon ad={MODUL_IKON[md]} boyut={18} />
                  {p.moduller[md]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p class="ust-etiket">{doldur(p.kimOlarak, { rol: rolEtiketi })}</p>
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
          <div key={`${aktifRol}:${aktifModul}`} data-modul-icerik={aktifModul}>
            {aktifModul === 'dosyalar' && aktifRol === 'musavirlik' && <Musavirlik {...ortak} />}
            {aktifModul === 'dosyalar' && aktifRol === 'koordinator' && <Koordinator {...ortak} />}
            {aktifModul === 'dosyalar' && aktifRol === 'bolge' && <BolgeSorumlusu {...ortak} />}
            {aktifModul === 'dosyalar' && aktifRol === 'dinGorevlisi' && <DinGorevlisi {...ortak} />}
            {aktifModul === 'dosyalar' && aktifRol === 'muhtedi' && <KisiselAlan {...ortak} />}
            {aktifModul === 'faaliyet' && (
              <FaaliyetGunlugu m={m} yerel={yerel} gorunum={faaliyetGorunumu} yerler={kapsam} modalAc={modalAc} />
            )}
            {aktifModul === 'anket' && <AnketSonuclari m={m} yerel={yerel} anket={kamu.anket} anketHref={kamu.anketHref} />}
            {aktifModul === 'harita' && (
              <RehberHaritasi m={m} yerel={yerel} gorunum={haritaGorunumu} yerler={kapsam} kadin={kadin} kamuHref={kamu.haritaHref} />
            )}
          </div>
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
  kamu: KamuVerisi;
}
