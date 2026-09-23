/** @jsxImportSource preact */
/** Bölge sorumlusu görünümü: YALNIZ kendi bölgesindeki (önizlemede Liège) dosyalar. */
import { doldur } from '../../lib/yerelDurum';
import { randevular } from '../../lib/dosyalar';
import { BOLGE_SORUMLUSU_BOLGESI, YER_BOLGE } from '../../data/ornek-dosyalar';
import { AsamaRozeti, Ikon, Kart, KisiAdi, camiAdi, gunEtiketi, tarihYaz } from './ortak';
import type { RolOzellikleri } from './PanelUygulamasi';

export default function BolgeSorumlusu({ m, yerel, kisiler }: RolOzellikleri) {
  const p = m.panel.bolge;
  const bolgede = kisiler.filter((k) => YER_BOLGE[k.yer] === BOLGE_SORUMLUSU_BOLGESI);
  const disarida = kisiler.length - bolgede.length;
  const yaklasan = randevular(bolgede).filter((r) => r.gun >= -7 && r.gun <= 21);

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Kart baslik={p.dosyalar} id="b-dosyalar" sag={<span class="rozet border border-cizgi bg-kagit-2">{bolgede.length}</span>}>
        <ul class="grid gap-2.5" data-bolge-dosyalari>
          {bolgede.map((k) => (
            <li class="grid gap-1 rounded-xl border border-cizgi bg-kagit p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div class="min-w-0">
                <p class="ui font-bold">{k.kod} · <KisiAdi kisi={k} m={m} /></p>
                <p class="text-sm text-dy-gri-koyu">{camiAdi(k, m)} · {m.diller[k.dil]}</p>
              </div>
              <span class="justify-self-start"><AsamaRozeti asama={k.asama} m={m} /></span>
            </li>
          ))}
        </ul>
        <p class="mt-4 inline-flex items-center gap-2 rounded-xl bg-kagit-2 px-3 py-2 text-sm text-dy-gri-koyu" data-bolge-disi>
          <Ikon ad="gozKapali" boyut={16} />{doldur(p.digerBolgeler, { n: disarida })}
        </p>
      </Kart>

      <Kart baslik={m.panel.koordinator.hatirlatmaBaslik} id="b-hatirlatma">
        <ul class="grid gap-2 text-[0.95rem]">
          {yaklasan.map((r) => (
            <li class="flex items-start gap-2 rounded-xl bg-kagit p-3">
              <Ikon ad={r.gun < 0 ? 'uyari' : 'takvim'} boyut={18} class={`mt-0.5 shrink-0 ${r.gun < 0 ? 'text-dy-koyu' : 'text-bdv'}`} />
              <span>
                <span class="ui font-bold">{r.kisi.kod}</span> · {r.tur === 'takip' ? doldur(m.ortak.takipAyi, { ay: r.ay ?? '' }) : m.panel.dinGorevlisi.randevuTurleri[r.tur]}
                <span class="block text-sm text-dy-gri-koyu">{tarihYaz(r.gun, yerel, { weekday: 'long', day: 'numeric', month: 'long' })} · {gunEtiketi(r.gun, m)}</span>
              </span>
            </li>
          ))}
        </ul>
      </Kart>
    </div>
  );
}
