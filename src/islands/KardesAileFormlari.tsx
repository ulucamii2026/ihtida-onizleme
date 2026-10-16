/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import DemoFormu, { type DemoAlan } from './DemoFormu';
import type { ModalMetni } from './OnizlemeModal';

interface Sekme { kimlik: string; etiket: string; alanlar: DemoAlan[]; gonder: string; not?: string }
interface Props { sekmeler: [Sekme, Sekme]; modal: ModalMetni; seciniz: string }

/** İki sekmeli örnek form: «Kardeş aile istiyorum» / «Gönüllü olmak istiyorum» (ARIA tabs deseni). */
export default function KardesAileFormlari({ sekmeler, modal, seciniz }: Props) {
  const [secili, setSecili] = useState(0);
  const refler = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];

  const tus = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const yeni = secili === 0 ? 1 : 0;
      setSecili(yeni);
      refler[yeni].current?.focus();
    }
  };

  return (
    <div class="kart overflow-hidden">
      <div role="tablist" class="flex border-b border-cizgi bg-kagit" onKeyDown={tus}>
        {sekmeler.map((s, i) => (
          <button
            ref={refler[i]}
            type="button"
            role="tab"
            id={`sekme-${s.kimlik}`}
            aria-selected={secili === i}
            aria-controls={`panel-${s.kimlik}`}
            tabIndex={secili === i ? 0 : -1}
            onClick={() => setSecili(i)}
            class={`ui min-h-12 flex-1 border-b-[3px] px-3 py-3 text-[0.95rem] font-semibold ${secili === i ? 'border-dy-koyu bg-white text-dy-koyu' : 'border-transparent text-dy-metin hover:bg-white/60'}`}
          >
            {s.etiket}
          </button>
        ))}
      </div>
      {sekmeler.map((s, i) => (
        <div role="tabpanel" id={`panel-${s.kimlik}`} aria-labelledby={`sekme-${s.kimlik}`} hidden={secili !== i} class="p-4 sm:p-6">
          <DemoFormu kimlik={s.kimlik} alanlar={s.alanlar} gonderEtiketi={s.gonder} modal={modal} seciniz={seciniz} not={s.not} />
        </div>
      ))}
    </div>
  );
}
