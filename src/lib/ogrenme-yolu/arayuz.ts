/** Öğrenme yolu sayfalarının tarayıcı tarafı: ilerleme işaretleri, kendini sınama, tıklayınca açılan video. */
import { depo } from './ilerleme';

function guncelle(): void {
  const yapilan = new Set(depo.hepsi());
  document.querySelectorAll<HTMLElement>('[data-durum-hafta]').forEach((el) => {
    const tamam = yapilan.has(el.dataset.durumHafta ?? '');
    el.querySelector('.durum-tamam')?.toggleAttribute('hidden', !tamam);
    el.querySelector('.durum-bos')?.toggleAttribute('hidden', tamam);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-isaretle]').forEach((dugme) => {
    const tamam = yapilan.has(dugme.dataset.isaretle ?? '');
    dugme.setAttribute('aria-pressed', String(tamam));
    dugme.querySelector('.bt-ac')?.toggleAttribute('hidden', tamam);
    dugme.querySelector('.bt-kapat')?.toggleAttribute('hidden', !tamam);
  });
  document.querySelectorAll<HTMLElement>('[data-ilerleme]').forEach((kutu) => {
    const kimlikler = (kutu.dataset.ilerleme ?? '').split(',').filter(Boolean);
    const n = kimlikler.filter((k) => yapilan.has(k)).length;
    const cubuk = kutu.querySelector('progress');
    if (cubuk) cubuk.value = n;
    const yazi = kutu.querySelector<HTMLElement>('[data-ilerleme-metin]');
    if (yazi?.dataset.kalip) yazi.textContent = yazi.dataset.kalip.replace('{n}', String(n)).replace('{m}', String(kimlikler.length));
  });
}

document.addEventListener('click', (olay) => {
  const hedef = olay.target instanceof Element ? olay.target : null;
  if (!hedef) return;

  const isaret = hedef.closest<HTMLButtonElement>('[data-isaretle]');
  if (isaret) {
    const id = isaret.dataset.isaretle ?? '';
    depo.ayarla(id, !depo.isaretliMi(id));
    guncelle();
    return;
  }
  if (hedef.closest('[data-isaretleri-sil]')) {
    depo.temizle();
    guncelle();
    return;
  }
  const sik = hedef.closest<HTMLButtonElement>('[data-sik]');
  if (sik) {
    const soru = sik.closest<HTMLElement>('[data-soru]');
    if (!soru) return;
    const dogru = sik.dataset.dogru === 'true';
    soru.querySelectorAll<HTMLButtonElement>('[data-sik]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b === sik));
      b.dataset.sonuc = b.dataset.dogru === 'true' ? 'dogru' : b === sik ? 'yanlis' : '';
    });
    const geri = soru.querySelector<HTMLElement>('[data-geri]');
    if (geri) {
      geri.textContent = dogru ? (geri.dataset.dogruMetin ?? '') : (geri.dataset.yanlisMetin ?? '');
      geri.dataset.sonuc = dogru ? 'dogru' : 'yanlis';
    }
    return;
  }
  const video = hedef.closest<HTMLButtonElement>('[data-video]');
  if (video) {
    const id = video.dataset.video ?? '';
    if (!/^[\w-]{11}$/.test(id)) return;
    const cerceve = document.createElement('iframe');
    cerceve.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
    cerceve.title = video.dataset.baslik ?? '';
    cerceve.allow = 'encrypted-media; picture-in-picture; fullscreen';
    cerceve.allowFullscreen = true;
    cerceve.referrerPolicy = 'strict-origin-when-cross-origin';
    cerceve.className = 'absolute inset-0 h-full w-full border-0';
    video.replaceWith(cerceve);
    cerceve.focus();
  }
});

guncelle();
