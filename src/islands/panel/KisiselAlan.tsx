/** @jsxImportSource preact */
/**
 * Mühtedinin kişisel alanı (kurgusal kişi M-DEMO-03): kendi belgesi (indirme yalnız önizleme penceresi),
 * İlk Adımlar ilerlemesi, sıradaki randevu ve irtibat kişileri (yalnız rol etiketi; iletişim bilgisi yok).
 */
import { doldur } from '../../lib/yerelDurum';
import { KISISEL_ALAN_KODU, ORNEK_GOREVLILER } from '../../data/ornek-dosyalar';
import { Ikon, Kart, camiAdi, gorevliAdi, gunEtiketi, tamTarih, tarihYaz } from './ortak';
import type { RolOzellikleri } from './PanelUygulamasi';

export default function KisiselAlan({ m, yerel, kisiler, modalAc }: RolOzellikleri) {
  const p = m.panel.muhtedi;
  const k = kisiler.find((x) => x.kod === KISISEL_ALAN_KODU)!;
  const irtibat = ORNEK_GOREVLILER.filter((g) => g.yer === k.yer && (g.rol === 'dinGorevlisi' || g.rol === 'kardesAile'));
  const oran = Math.round((k.dersTamam / 12) * 100);

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5" data-kisisel-alan>
      <div class="kart flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-bdv p-4 sm:p-5">
        <div>
          <p class="ui text-xl font-bold">{doldur(p.hosgeldin, { ad: k.ad })} <span class="text-sm font-normal text-dy-altin-koyu">({m.ortak.kurgusal})</span></p>
          <p class="mt-1 text-sm text-dy-gri-koyu">{k.kod} · {camiAdi(k, m)} · {m.diller[k.dil]}</p>
        </div>
        <p class="max-w-md text-sm text-dy-gri-koyu"><Ikon ad="kalkan" boyut={16} class="mr-1 inline text-bdv" />{p.kimlerGorur}</p>
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Kart baslik={p.belgeBaslik} id="ka-belge">
          <div class="flex items-start gap-3 rounded-xl border border-[#9DBBD1] bg-[#E6F0F6]/60 p-3.5">
            <Ikon ad="belge" boyut={28} class="shrink-0 text-bdv" />
            <div>
              <p class="ui font-bold">{p.belgeAdi}</p>
              <p class="ui text-sm font-semibold text-bdv">{doldur(p.belgeNo, { no: k.belgeNo ?? '—' })}</p>
              <p class="text-sm text-dy-gri-koyu">{k.belgeGun !== undefined ? tamTarih(k.belgeGun, yerel) : ''}</p>
            </div>
          </div>
          <button type="button" class="dugme dugme-birincil mt-3" data-belge-indir onClick={modalAc}><Ikon ad="indir" boyut={18} />{p.indir}</button>
          <p class="mt-3 text-sm text-dy-gri-koyu">{p.dogrulamaNot}</p>
        </Kart>

        <Kart baslik={p.derslerBaslik} id="ka-dersler">
          <p class="ui text-sm font-semibold">{doldur(p.dersIlerleme, { n: k.dersTamam })}</p>
          <div class="mt-2 h-3 rounded-full bg-kagit-2" role="progressbar" aria-valuemin={0} aria-valuemax={12} aria-valuenow={k.dersTamam}>
            <div class="h-3 rounded-full bg-dy-koyu" style={{ width: `${oran}%` }} />
          </div>
          <ol class="mt-3 grid grid-cols-6 gap-1.5" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <li class={`ui flex h-9 items-center justify-center rounded-lg text-sm font-bold ${i < k.dersTamam ? 'bg-dy-koyu text-white' : i === k.dersTamam ? 'border-2 border-dy-koyu text-dy-koyu' : 'bg-kagit-2 text-dy-gri-koyu'}`}>{i + 1}</li>
            ))}
          </ol>
        </Kart>

        <Kart baslik={p.randevuBaslik} id="ka-randevu">
          {k.sonrakiGun !== undefined && k.takipAyi ? (
            <div class="flex items-start gap-3">
              <span class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-dy-koyu text-white">
                <span class="ui text-[0.7rem] font-semibold uppercase">{tarihYaz(k.sonrakiGun, yerel, { month: 'short' })}</span>
                <span class="ui text-2xl leading-none font-bold">{tarihYaz(k.sonrakiGun, yerel, { day: 'numeric' })}</span>
              </span>
              <div>
                <p class="ui font-bold">{doldur(p.randevuMetin, { tur: doldur(m.ortak.takipAyi, { ay: k.takipAyi }), tarih: gunEtiketi(k.sonrakiGun, m) })}</p>
                <p class="text-sm text-dy-gri-koyu">{camiAdi(k, m)}</p>
              </div>
            </div>
          ) : <p class="text-sm">{m.ortak.yok}</p>}
        </Kart>

        <Kart baslik={p.irtibatBaslik} id="ka-irtibat">
          <ul class="grid gap-2">
            {irtibat.map((g) => (
              <li class="flex items-center gap-3 rounded-xl bg-kagit p-3">
                <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-dy-koyu"><Ikon ad="kisi" boyut={18} /></span>
                <span class="ui text-[0.95rem] font-semibold">{gorevliAdi(g, m)}</span>
              </li>
            ))}
          </ul>
          <button type="button" class="dugme dugme-ikincil mt-3" onClick={modalAc}><Ikon ad="mesaj" boyut={18} />{p.mesajGonder}</button>
          <p class="mt-2 text-sm text-dy-gri-koyu">{p.irtibatNot}</p>
        </Kart>

        <Kart baslik={p.haklarBaslik} id="ka-haklar" class="xl:col-span-2">
          <div class="flex flex-wrap gap-2">
            {p.haklar.map((h) => (
              <button type="button" class="dugme dugme-ikincil" onClick={modalAc}>{h}</button>
            ))}
          </div>
        </Kart>
      </div>
    </div>
  );
}
