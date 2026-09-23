/** @jsxImportSource preact */
/**
 * Din görevlisi görünümü: YALNIZ kendi camisine başvuranlar ve yalnız ad, dil, iletişim tercihi.
 * Randevu takvimi (7 gün) ve takip formu (yalnız işaretleme; serbest metin yok, veri saklanmaz).
 */
import { useState } from 'preact/hooks';
import { doldur } from '../../lib/yerelDurum';
import { randevular } from '../../lib/dosyalar';
import { DIN_GOREVLISI_YERI, type TakipAyi } from '../../data/ornek-dosyalar';
import { Ikon, Kart, KisiAdi, tarihYaz } from './ortak';
import type { RolOzellikleri } from './PanelUygulamasi';

export default function DinGorevlisi({ m, yerel, kisiler, modalAc }: RolOzellikleri) {
  const p = m.panel.dinGorevlisi;
  const camide = kisiler.filter((k) => k.yer === DIN_GOREVLISI_YERI);
  const takvim = randevular(camide);
  const [form, setForm] = useState<{ kod: string; ay: TakipAyi; maddeler: boolean[]; durum: number }>({
    kod: camide[0]?.kod ?? '', ay: 3, maddeler: p.maddeler.map(() => false), durum: 0,
  });
  const gunler = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5">
      <Kart baslik={p.takvimBaslik} id="d-takvim">
          <ol class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" data-randevu-takvimi>
            {gunler.map((g) => {
              const olanlar = takvim.filter((r) => r.gun === g);
              return (
                <li class={`min-h-24 rounded-xl border p-2 ${g === 0 ? 'border-dy-koyu bg-[#FBEDEC]/50' : 'border-cizgi bg-kagit'}`}>
                  <p class="ui text-[0.72rem] font-bold text-dy-gri-koyu uppercase">{tarihYaz(g, yerel, { weekday: 'short' })}</p>
                  <p class="ui text-lg leading-none font-bold">{tarihYaz(g, yerel, { day: 'numeric' })}</p>
                  {olanlar.length === 0 ? (
                    <p class="mt-2 text-[0.72rem] text-dy-gri-koyu sm:hidden">{p.takvimBos}</p>
                  ) : olanlar.map((r) => (
                    <p class="ui mt-1.5 rounded-md bg-bdv px-2 py-1.5 text-[0.78rem] leading-tight font-semibold break-words text-white">
                      <span class="whitespace-nowrap">{r.kisi.kod}</span>
                      <span class="block font-medium opacity-90">{r.tur === 'takip' ? doldur(p.randevuTurleri.takip, { ay: r.ay ?? '' }) : p.randevuTurleri[r.tur]}</span>
                    </p>
                  ))}
                </li>
              );
            })}
          </ol>
        </Kart>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
        <Kart baslik={p.kisiler} id="d-kisiler">
          <div class="overflow-x-auto rounded-xl border border-cizgi">
            <table class="w-full min-w-[30rem] text-left text-[0.95rem]" data-cami-kisileri>
              <thead class="ui bg-kagit-2 text-xs text-dy-gri-koyu">
                <tr>
                  <th scope="col" class="px-3 py-2">{m.alanlar.kod}</th>
                  <th scope="col" class="px-3 py-2">{m.alanlar.ad}</th>
                  <th scope="col" class="px-3 py-2">{m.alanlar.dil}</th>
                  <th scope="col" class="px-3 py-2">{m.alanlar.iletisim}</th>
                </tr>
              </thead>
              <tbody>
                {camide.map((k) => (
                  <tr class="border-t border-cizgi">
                    <td class="ui px-3 py-2.5 font-semibold whitespace-nowrap">{k.kod}</td>
                    <td class="px-3 py-2.5"><KisiAdi kisi={k} m={m} /></td>
                    <td class="px-3 py-2.5">{m.diller[k.dil]}</td>
                    <td class="px-3 py-2.5">{m.iletisim[k.iletisim]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kart>
        <Kart baslik={p.takipFormBaslik} id="d-takip-formu">
          <form class="grid gap-3" onSubmit={(e) => { e.preventDefault(); modalAc(); }} data-takip-formu>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="alan-etiket" for="tf-kisi">{p.takipKisi}</label>
                <select id="tf-kisi" class="alan" value={form.kod} onChange={(e) => setForm({ ...form, kod: e.currentTarget.value })}>
                  {camide.map((k) => <option value={k.kod}>{k.kod}</option>)}
                </select>
              </div>
              <div>
                <label class="alan-etiket" for="tf-ay">{p.takipAy}</label>
                <select id="tf-ay" class="alan" value={form.ay} onChange={(e) => setForm({ ...form, ay: Number(e.currentTarget.value) as TakipAyi })}>
                  {([1, 3, 6, 12] as const).map((a) => <option value={a}>{doldur(m.ortak.takipAyi, { ay: a })}</option>)}
                </select>
              </div>
            </div>
            <fieldset class="grid gap-1.5">
              {p.maddeler.map((t, i) => (
                <label class="flex min-h-11 items-center gap-2.5 rounded-lg px-1 text-[0.95rem]">
                  <input type="checkbox" class="h-5 w-5 accent-[#004878]" checked={form.maddeler[i]}
                    onChange={(e) => { const y = [...form.maddeler]; y[i] = e.currentTarget.checked; setForm({ ...form, maddeler: y }); }} />
                  {t}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend class="alan-etiket">{p.durumBaslik}</legend>
              <div class="flex flex-wrap gap-2">
                {p.durumlar.map((t, i) => (
                  <label class={`ui inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold ${form.durum === i ? 'border-bdv bg-[#E6F0F6] text-bdv' : 'border-cizgi bg-white'}`}>
                    <input type="radio" name="tf-durum" class="sr-only" checked={form.durum === i} onChange={() => setForm({ ...form, durum: i })} />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <p class="text-sm text-dy-gri-koyu">{p.formNot}</p>
            <div><button type="submit" class="dugme dugme-birincil" data-takip-kaydet><Ikon ad="onay" boyut={18} />{p.kaydet}</button></div>
          </form>
        </Kart>
      </div>
    </div>
  );
}
