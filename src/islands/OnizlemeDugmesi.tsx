/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import OnizlemeModal, { type ModalMetni } from './OnizlemeModal';

/** Tek başına eylem düğmesi (etkinliğe katıl, görüşme iste): yalnız önizleme penceresini açar. */
export default function OnizlemeDugmesi({ etiket, modal, ikincil = false }: { etiket: string; modal: ModalMetni; ikincil?: boolean }) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <button type="button" class={`dugme ${ikincil ? 'dugme-ikincil' : 'dugme-birincil'}`} data-demo-gonder onClick={() => setAcik(true)}>
        {etiket}
      </button>
      <OnizlemeModal acik={acik} kapat={() => setAcik(false)} m={modal} />
    </>
  );
}
