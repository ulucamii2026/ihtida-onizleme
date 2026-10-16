/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import OnizlemeModal, { type ModalMetni } from './OnizlemeModal';

/**
 * Genel ÖRNEK form (Kardeş Aile, İletişim, Aile görüşmesi). Değerler yalnız tarayıcı belleğinde
 * yaşar (kontrolsüz alanlar); gönderim yalnız önizleme penceresini açar. `kapali` → alanlar devre dışı.
 */
export interface DemoAlan {
  ad: string;
  etiket: string;
  tur: 'text' | 'email' | 'textarea' | 'select' | 'coklu';
  secenekler?: string[];
  yardim?: string;
  genis?: boolean;
  ornek?: string;
}

interface Props {
  kimlik: string;
  alanlar: DemoAlan[];
  gonderEtiketi: string;
  modal: ModalMetni;
  seciniz: string;
  kapali?: boolean;
  not?: string;
}

export default function DemoFormu({ kimlik, alanlar, gonderEtiketi, modal, seciniz, kapali = false, not }: Props) {
  const [acik, setAcik] = useState(false);
  const id = (ad: string) => `${kimlik}-${ad}`;

  return (
    <form
      class="grid gap-5 sm:grid-cols-2"
      noValidate
      data-demo-form={kimlik}
      onSubmit={(e) => { e.preventDefault(); setAcik(true); }}
    >
      {alanlar.map((a) => (
        <div class={a.genis || a.tur === 'textarea' || a.tur === 'coklu' ? 'sm:col-span-2' : ''}>
          {a.tur === 'coklu' ? (
            <fieldset disabled={kapali}>
              <legend class="alan-etiket">{a.etiket}</legend>
              <div class="flex flex-wrap gap-2">
                {a.secenekler?.map((s, i) => (
                  <label class="flex min-h-11 items-center gap-2 rounded-full border border-cizgi bg-white px-3.5" for={`${id(a.ad)}-${i}`}>
                    <input id={`${id(a.ad)}-${i}`} type="checkbox" name={a.ad} value={s} class="h-4.5 w-4.5 accent-[#B8231F]" />
                    <span class="text-[0.95rem] font-normal">{s}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <>
              <label class="alan-etiket" for={id(a.ad)}>{a.etiket}</label>
              {a.tur === 'textarea' ? (
                <textarea id={id(a.ad)} name={a.ad} rows={4} class="alan" disabled={kapali} aria-describedby={a.yardim ? `${id(a.ad)}-y` : undefined} />
              ) : a.tur === 'select' ? (
                <select id={id(a.ad)} name={a.ad} class="alan" disabled={kapali}>
                  <option value="">{seciniz}</option>
                  {a.secenekler?.map((s) => <option value={s}>{s}</option>)}
                </select>
              ) : (
                <input id={id(a.ad)} name={a.ad} type={a.tur} class="alan" disabled={kapali} autocomplete="off" placeholder={a.ornek}
                  aria-describedby={a.yardim ? `${id(a.ad)}-y` : undefined} />
              )}
              {a.yardim && <p id={`${id(a.ad)}-y`} class="alan-yardim">{a.yardim}</p>}
            </>
          )}
        </div>
      ))}
      <div class="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" class="dugme dugme-birincil" data-demo-gonder>{gonderEtiketi}</button>
        {not && <p class="text-sm text-dy-gri-koyu">{not}</p>}
      </div>
      <OnizlemeModal acik={acik} kapat={() => setAcik(false)} m={modal} />
    </form>
  );
}
