/** @jsxImportSource preact */
/**
 * Müşavirlik memuru görünümü: Belge No kuyruğu, yetkiyle imza (erişim kaydıyla), Müşavirlik defteri
 * (EK-13 örneği) ve toplu istatistik + saha sayımı. Tam dosyayı yalnız bu rol görür.
 */
import { useYerelDurum, doldur } from '../../lib/yerelDurum';
import { sonrakiBelgeNo } from '../../lib/dosyalar';
import { ASAMALAR, BOLGELER, SAHA_SAYIMI, YER_BOLGE, ORNEK_GOREVLILER, type KisiDili } from '../../data/ornek-dosyalar';
import { Cubuklar, Ikon, Kart, KisiAdi, camiAdi, gorevliAdi, tamTarih } from './ortak';
import type { RolOzellikleri } from './PanelUygulamasi';

const saat = () => new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });

export default function Musavirlik({ m, yerel, kisiler, setDegisiklikler }: RolOzellikleri) {
  const p = m.panel.musavirlik;
  const [imza, setImza] = useYerelDurum<boolean>('musavirlik:imza', false);
  const [kayit, setKayit] = useYerelDurum<string[]>('musavirlik:kayit', []);
  const kayitEkle = (satir: string) => setKayit((k) => [satir, ...k].slice(0, 12));

  const kuyruk = kisiler.filter((k) => k.asama === 'torenYapildi');
  const defter = kisiler
    .filter((k) => k.belgeNo)
    .sort((a, b) => (a.belgeNo! < b.belgeNo! ? -1 : 1));

  const belgeNoVer = (kod: string) => {
    const no = sonrakiBelgeNo(kisiler);
    setDegisiklikler((d) => ({ ...d, [kod]: { ...(d[kod] ?? {}), asama: 'belgeVerildi', belgeNo: no, belgeGun: 0, takipAyi: 1, sonrakiGun: 30 } }));
    kayitEkle(doldur(p.kayitBelgeNo, { saat: saat(), kod, no }));
  };

  const imzaDegistir = () => {
    const yeni = !imza;
    setImza(yeni);
    kayitEkle(doldur(yeni ? p.kayitImzaAcik : p.kayitImzaKapali, { saat: saat() }));
  };

  // Toplu istatistik (kişi ayrıntısı yok)
  const say = <T extends string>(anahtarlar: readonly T[], f: (k: (typeof kisiler)[number]) => T) =>
    anahtarlar.map((a) => ({ a, n: kisiler.filter((k) => f(k) === a).length }));
  const bolgeSay = say(BOLGELER, (k) => YER_BOLGE[k.yer]);
  const dilSay = say(['fr', 'nl', 'de', 'en'] as KisiDili[], (k) => k.dil);
  const asamaSay = say(ASAMALAR, (k) => k.asama);
  const sahaDilleri = ['fr', 'nl', 'de', 'en', 'tr', 'ar'] as const;

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Kart baslik={p.kuyrukBaslik} id="m-kuyruk" sag={<span class="rozet border border-[#EBCF8F] bg-[#FFF3D6] text-[#7A5410]">{kuyruk.length}</span>}>
          <p class="mb-3 text-[0.95rem] text-dy-gri-koyu">{p.kuyrukAciklama}</p>
          {kuyruk.length === 0 ? (
            <p class="rounded-xl bg-kagit p-4 text-sm">{p.kuyrukBos}</p>
          ) : (
            <ul class="grid gap-2.5" data-belge-kuyrugu>
              {kuyruk.map((k) => (
                <li class="grid gap-3 rounded-xl border border-cizgi bg-kagit p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div class="min-w-0">
                    <p class="ui font-bold">{k.kod} · <KisiAdi kisi={k} m={m} /></p>
                    <p class="mt-0.5 text-sm text-dy-gri-koyu">
                      {camiAdi(k, m)} · {p.toren}: {k.torenGun !== undefined ? tamTarih(k.torenGun, yerel) : '—'} · {gorevliAdi(ORNEK_GOREVLILER.find((g) => g.rol === 'dinGorevlisi' && g.yer === k.yer), m)}
                    </p>
                    <p class="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#35592A]"><Ikon ad="onayDaire" boyut={16} />{p.belgelerTamam}</p>
                  </div>
                  <button type="button" class="dugme dugme-birincil" data-belge-no-ver={k.kod} onClick={() => belgeNoVer(k.kod)}>
                    <Ikon ad="belge" boyut={18} />{p.belgeNoVer}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Kart>

        <Kart baslik={p.yetkiliImza} id="m-imza">
          <p class="text-[0.95rem] text-dy-gri-koyu">{p.yetkiliImzaAciklama}</p>
          <button
            type="button"
            role="switch"
            aria-checked={imza}
            data-yetkili-imza
            onClick={imzaDegistir}
            class="ui mt-3 inline-flex min-h-11 items-center gap-3 rounded-full border-2 border-cizgi bg-white py-1.5 pr-4 pl-1.5 font-semibold"
          >
            <span class={`relative inline-block h-7 w-12 rounded-full transition-colors ${imza ? 'bg-bdv' : 'bg-[#B9B2A4]'}`} aria-hidden="true">
              <span class={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${imza ? 'left-6' : 'left-1'}`} />
            </span>
            {imza ? p.acik : p.kapali}
          </button>
          <h4 class="ui mt-4 text-sm font-bold">{p.erisimKaydi}</h4>
          <ol class="mt-1.5 grid max-h-44 gap-1 overflow-y-auto font-mono text-[0.8rem] leading-snug" data-erisim-kaydi>
            {(kayit.length ? kayit : [doldur(p.kayitGoruntuleme, { saat: saat() })]).map((s) => (
              <li class="rounded-md bg-kagit px-2 py-1">{s}</li>
            ))}
          </ol>
        </Kart>
      </div>

      <Kart baslik={p.defterBaslik} id="m-defter">
        <p class="mb-3 text-[0.95rem] text-dy-gri-koyu">{p.defterAciklama}</p>
        <div class="overflow-x-auto rounded-xl border border-cizgi">
          <table class="w-full min-w-[56rem] text-left text-sm" data-musavirlik-defteri>
            <thead class="ui bg-kagit-2 text-xs tracking-[0.03em] text-dy-gri-koyu uppercase">
              <tr>
                {(['sira', 'belgeNo', 'belgeTarihi', 'kod', 'ad', 'cinsiyet', 'dogumYili', 'uyruk', 'cami', 'torenTarihi'] as const).map((s) => (
                  <th scope="col" class="px-3 py-2 font-semibold">{p.sutunlar[s]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {defter.map((k, i) => (
                <tr class="border-t border-cizgi odd:bg-white even:bg-kagit/60">
                  <td class="px-3 py-2 tabular-nums">{i + 1}</td>
                  <td class="ui px-3 py-2 font-semibold whitespace-nowrap">{k.belgeNo}</td>
                  <td class="px-3 py-2 whitespace-nowrap tabular-nums">{k.belgeGun !== undefined ? tamTarih(k.belgeGun, yerel) : '—'}</td>
                  <td class="ui px-3 py-2 whitespace-nowrap">{k.kod}</td>
                  <td class="px-3 py-2"><KisiAdi kisi={k} m={m} /></td>
                  <td class="px-3 py-2">{m.cinsiyetler[k.cinsiyet]}</td>
                  <td class="px-3 py-2 tabular-nums">{k.dogumYili}</td>
                  <td class="px-3 py-2">{m.uyruklar[k.uyruk]}</td>
                  <td class="px-3 py-2">{camiAdi(k, m)}</td>
                  <td class="px-3 py-2 whitespace-nowrap tabular-nums">{k.torenGun !== undefined ? tamTarih(k.torenGun, yerel) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kart>

      <Kart baslik={p.istatistikBaslik} id="m-istatistik" sag={<span class="text-sm text-dy-gri-koyu">{p.istatistikAciklama}</span>}>
        <div class="grid gap-6 md:grid-cols-3" data-istatistik>
          <Cubuklar baslik={p.bolgeye} satirlar={bolgeSay.map(({ a, n }) => ({ etiket: m.bolgeler[a], deger: n }))} />
          <Cubuklar baslik={p.dile} satirlar={dilSay.map(({ a, n }) => ({ etiket: m.diller[a], deger: n }))} />
          <Cubuklar baslik={p.asamaya} satirlar={asamaSay.map(({ a, n }) => ({ etiket: m.asamalar[a], deger: n }))} />
        </div>
      </Kart>

      <Kart baslik={p.sahaBaslik} id="m-saha">
        <p class="mb-3 max-w-3xl text-[0.95rem] text-dy-gri-koyu">{p.sahaAciklama}</p>
        <div class="overflow-x-auto rounded-xl border border-cizgi">
          <table class="w-full min-w-[40rem] text-left text-sm" data-saha-sayimi>
            <thead class="ui bg-kagit-2 text-xs text-dy-gri-koyu">
              <tr>
                <th scope="col" class="px-3 py-2">{p.yil}</th>
                <th scope="col" class="px-3 py-2">{m.cinsiyetler.K}</th>
                <th scope="col" class="px-3 py-2">{m.cinsiyetler.E}</th>
                {sahaDilleri.map((d) => <th scope="col" class="px-3 py-2">{m.diller[d]}</th>)}
                <th scope="col" class="px-3 py-2">{p.toplam}</th>
              </tr>
            </thead>
            <tbody>
              {SAHA_SAYIMI.map((s) => (
                <tr class="border-t border-cizgi tabular-nums">
                  <th scope="row" class="ui px-3 py-2 font-semibold">{s.yil}</th>
                  <td class="px-3 py-2">{s.kadin}</td>
                  <td class="px-3 py-2">{s.erkek}</td>
                  {sahaDilleri.map((d) => <td class="px-3 py-2">{s.diller[d]}</td>)}
                  <td class="ui px-3 py-2 font-bold">{s.kadin + s.erkek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kart>
    </div>
  );
}
