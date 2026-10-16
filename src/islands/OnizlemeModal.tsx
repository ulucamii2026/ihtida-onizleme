/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';

export interface ModalMetni { baslik: string; metin: string; tamam: string }

interface Props { acik: boolean; kapat: () => void; m: ModalMetni }

/**
 * «Önizleme: gönderim kapalı» penceresi. Yerleşik <dialog> kullanılır: odak tuzağı, Esc ile kapanma
 * ve arka planın erişilemez olması tarayıcıdan gelir. Açılış bir AĞ İSTEĞİ YAPMAZ.
 */
export default function OnizlemeModal({ acik, kapat, m }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    if (!acik && d.open) d.close();
  }, [acik]);

  return (
    <dialog
      ref={ref}
      data-onizleme-modal
      aria-labelledby="onizleme-modal-baslik"
      aria-describedby="onizleme-modal-metin"
      onClose={kapat}
      onClick={(e) => { if (e.target === ref.current) kapat(); }}
      class="onizleme-modal m-auto w-[min(92vw,30rem)] rounded-2xl border border-cizgi bg-white p-0 text-dy-metin shadow-2xl backdrop:bg-[rgba(43,43,43,.55)]"
    >
      <div class="border-t-4 border-dy-kirmizi p-6 sm:p-7">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBEDEC] text-dy-koyu" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <div>
            <h2 id="onizleme-modal-baslik" class="text-xl font-bold">{m.baslik}</h2>
            <p id="onizleme-modal-metin" class="mt-2">{m.metin}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button type="button" class="dugme dugme-birincil" onClick={kapat} autofocus>{m.tamam}</button>
        </div>
      </div>
    </dialog>
  );
}
