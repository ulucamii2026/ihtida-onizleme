"""Önizleme doğrulama testi (Playwright, Chrome kanalı).

Kullanım (proje kökünde, önce `npm run build`):
    py -3.14 scripts/onizleme-testi.py            # astro preview'ı kendisi açar/kapatır
    py -3.14 scripts/onizleme-testi.py --url http://localhost:4410   # çalışan sunucuya bağlanır

Denetler — dist/ içindeki HER sayfa, 1280 px ve 390 px:
  * HTTP 200
  * görünür önizleme bandı  [data-onizleme-bandi]
  * <meta name="robots" content="noindex,nofollow">
  * <html lang> dolu
  * yatay taşma yok (scrollWidth <= clientWidth)
  * yalnız izinli ağ istekleri (aynı kaynak + tile.openstreetmap.org)
  * sayfa JS hatası yok
Her dilde örnek gönderim düğmeleri: tıklamadan SONRA hiçbir ağ isteği olmamalı ve
«Önizleme: gönderim kapalı» penceresi açılmalı (belge doğrulamada sonuç kartı görünmeli).
Ekran görüntüleri: cikti/ekran/ (en uzun kenar ≤ 1500 px).
"""
from __future__ import annotations

import argparse
import json
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image
from playwright.sync_api import sync_playwright

KOK = Path(__file__).resolve().parent.parent
DIST = KOK / "dist"
EKRAN = KOK / "cikti" / "ekran"
PORT = 4410
IZINLI_DIS = {"tile.openstreetmap.org"}
GENISLIKLER = [(1280, 800), (390, 844)]
DILLER = ["tr", "fr", "nl", "de", "en"]
SLUG = {
    "basvuru": {"tr": "basvuru", "fr": "demande", "nl": "aanvraag", "de": "antrag", "en": "application"},
    "kardesAile": {"tr": "kardes-aile", "fr": "accompagnement", "nl": "buddygezin", "de": "patenfamilie", "en": "buddy-family"},
    "etkinlikler": {"tr": "etkinlikler", "fr": "activites", "nl": "activiteiten", "de": "veranstaltungen", "en": "events"},
    "dogrula": {"tr": "belge-dogrula", "fr": "verifier", "nl": "verifieren", "de": "pruefen", "en": "verify"},
    "aile": {"tr": "aileler-icin", "fr": "pour-les-proches", "nl": "voor-familie", "de": "fuer-angehoerige", "en": "for-families"},
    "iletisim": {"tr": "iletisim", "fr": "contact", "nl": "contact", "de": "kontakt", "en": "contact"},
}


def yollar() -> list[str]:
    sonuc = []
    for f in sorted(DIST.rglob("index.html")):
        rel = f.parent.relative_to(DIST).as_posix()
        sonuc.append("/" if rel == "." else f"/{rel}/")
    return sonuc


def port_acik(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def kucult(yol: Path, sinir: int = 1500) -> None:
    with Image.open(yol) as im:
        w, h = im.size
        oran = sinir / max(w, h)
        if oran < 1:
            im = im.resize((max(1, round(w * oran)), max(1, round(h * oran))), Image.LANCZOS)
            im.save(yol, optimize=True)


def parcala(yol: Path, yukseklik: int = 1500) -> None:
    """Tam sayfa görüntüsünü doğal genişlikte, ≤1500 px yüksekliğinde dilimlere böler (okunabilir kalsın)."""
    with Image.open(yol) as im:
        w, h = im.size
        for i, ust in enumerate(range(0, h, yukseklik), start=1):
            dilim = im.crop((0, ust, w, min(h, ust + yukseklik)))
            hedef = yol.with_name(f"{yol.stem}-{i}.png")
            dilim.save(hedef, optimize=True)
            kucult(hedef)
    yol.unlink()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=None)
    args = ap.parse_args()

    if not DIST.exists():
        print("dist/ yok — önce `npm run build`.")
        return 2

    sunucu = None
    taban = args.url
    if not taban:
        taban = f"http://localhost:{PORT}"
        if not port_acik(PORT):
            sunucu = subprocess.Popen(
                f"npx astro preview --port {PORT} --host 127.0.0.1", cwd=KOK, shell=True,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            for _ in range(120):
                if port_acik(PORT):
                    break
                time.sleep(0.25)
            else:
                print("Önizleme sunucusu açılamadı.")
                return 2
    taban_host = urlparse(taban).netloc
    hatalar: list[str] = []
    sayac = {"sayfa_kontrol": 0, "gonderim_kontrol": 0}
    tum_yollar = yollar()
    EKRAN.mkdir(parents=True, exist_ok=True)

    try:
        with sync_playwright() as pw:
            tarayici = pw.chromium.launch(channel="chrome")

            # 1) Bütün sayfalar × iki genişlik
            for (gen, yuk) in GENISLIKLER:
                bag = tarayici.new_context(viewport={"width": gen, "height": yuk}, service_workers="block")
                sayfa = bag.new_page()
                istekler: list[str] = []
                js_hatalari: list[str] = []
                sayfa.on("request", lambda r: istekler.append(r.url))
                sayfa.on("pageerror", lambda e: js_hatalari.append(str(e)))
                for yol in tum_yollar:
                    istekler.clear(); js_hatalari.clear()
                    etiket = f"[{gen}px] {yol}"
                    yanit = sayfa.goto(taban + yol, wait_until="load")
                    if not yanit or yanit.status != 200:
                        hatalar.append(f"{etiket}: HTTP {yanit.status if yanit else 'yok'}")
                        continue
                    sayfa.wait_for_timeout(250)
                    bant = sayfa.locator("[data-onizleme-bandi]")
                    if bant.count() != 1 or not bant.first.is_visible():
                        hatalar.append(f"{etiket}: önizleme bandı görünmüyor")
                    robots = sayfa.locator('meta[name="robots"]').get_attribute("content") or ""
                    if "noindex" not in robots or "nofollow" not in robots:
                        hatalar.append(f"{etiket}: robots meta eksik ({robots!r})")
                    if not (sayfa.locator("html").get_attribute("lang") or ""):
                        hatalar.append(f"{etiket}: html lang boş")
                    tasma = sayfa.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
                    if tasma[0] > tasma[1]:
                        hatalar.append(f"{etiket}: yatay taşma {tasma[0]} > {tasma[1]}")
                    for u in istekler:
                        p = urlparse(u)
                        if p.scheme in ("data", "blob"):
                            continue
                        if p.netloc != taban_host and p.netloc not in IZINLI_DIS:
                            hatalar.append(f"{etiket}: izinsiz ağ isteği {u}")
                    for h in js_hatalari:
                        hatalar.append(f"{etiket}: JS hatası {h}")
                    sayac["sayfa_kontrol"] += 1

                    # Ekran görüntüleri: ana sayfa ve başvuru (TR)
                    ad = {"/tr/": "ana-tr", "/tr/basvuru/": "basvuru-tr"}.get(yol)
                    if ad:
                        if yol == "/tr/basvuru/":
                            sayfa.locator("[data-demo-form=basvuru]").scroll_into_view_if_needed()
                            sayfa.wait_for_timeout(400)
                            sayfa.evaluate("() => window.scrollTo(0, 0)")
                            sayfa.wait_for_timeout(200)
                        hedef = EKRAN / f"{ad}-{gen}.png"
                        sayfa.screenshot(path=str(hedef))
                        kucult(hedef)
                        tam = EKRAN / f"{ad}-{gen}-tam.png"
                        sayfa.screenshot(path=str(tam), full_page=True)
                        parcala(tam)
                bag.close()

            # 2) Örnek gönderimler: tıklamadan sonra SIFIR ağ isteği
            bag = tarayici.new_context(viewport={"width": 1280, "height": 900}, service_workers="block")
            sayfa = bag.new_page()
            sonraki: list[str] = []
            sayfa.on("request", lambda r: sonraki.append(r.url))

            def adacik_hazir(secici: str) -> None:
                el = sayfa.locator(secici).first
                el.scroll_into_view_if_needed()
                sayfa.wait_for_function(
                    "(s) => { const e = document.querySelector(s); const a = e && e.closest('astro-island'); return !!a && !a.hasAttribute('ssr'); }",
                    arg=secici, timeout=10000,
                )

            def gonder_ve_denetle(etiket: str, dugme, modal_bekle: bool = True) -> None:
                sayfa.wait_for_load_state("networkidle")
                sonraki.clear()
                dugme.click()
                sayfa.wait_for_timeout(900)
                ag = [u for u in sonraki if not u.startswith("data:")]
                if ag:
                    hatalar.append(f"{etiket}: gönderimden sonra ağ isteği: {ag}")
                if modal_bekle:
                    modal = sayfa.locator("dialog[data-onizleme-modal][open]")
                    if modal.count() != 1 or not modal.first.is_visible():
                        hatalar.append(f"{etiket}: önizleme penceresi açılmadı")
                    else:
                        sayfa.keyboard.press("Escape")
                        sayfa.wait_for_timeout(150)
                sayac["gonderim_kontrol"] += 1

            for dil in DILLER:
                # Başvuru: yedi adımı ilerle, sahte ad yaz, gönder
                sayfa.goto(f"{taban}/{dil}/{SLUG['basvuru'][dil]}/")
                adacik_hazir("[data-demo-form=basvuru]")
                sayfa.fill("#bf-adSoyad", "Sarah (kurgusal)")
                for _ in range(10):
                    if sayfa.locator("[data-demo-form=basvuru] [data-demo-gonder]").count():
                        break
                    sayfa.locator("[data-demo-form=basvuru] > div:last-of-type .dugme-birincil").click()
                gonder_ve_denetle(f"{dil}/başvuru", sayfa.locator("[data-demo-form=basvuru] [data-demo-gonder]"))

                sayfa.goto(f"{taban}/{dil}/{SLUG['iletisim'][dil]}/")
                adacik_hazir("[data-demo-form=iletisim]")
                gonder_ve_denetle(f"{dil}/iletişim", sayfa.locator("[data-demo-form=iletisim] [data-demo-gonder]"))

                sayfa.goto(f"{taban}/{dil}/{SLUG['kardesAile'][dil]}/")
                adacik_hazir("[data-demo-form=talep]")
                gonder_ve_denetle(f"{dil}/kardeş aile talep", sayfa.locator("[data-demo-form=talep] [data-demo-gonder]"))
                sayfa.locator("[role=tab]").nth(1).click()
                gonder_ve_denetle(f"{dil}/kardeş aile gönüllü", sayfa.locator("[data-demo-form=gonullu] [data-demo-gonder]"))

                sayfa.goto(f"{taban}/{dil}/{SLUG['aile'][dil]}/")
                adacik_hazir("[data-demo-gonder]")
                gonder_ve_denetle(f"{dil}/aile görüşme", sayfa.locator("[data-demo-gonder]").first)

                sayfa.goto(f"{taban}/{dil}/{SLUG['etkinlikler'][dil]}/")
                adacik_hazir("[data-demo-gonder]")
                gonder_ve_denetle(f"{dil}/etkinlik katıl", sayfa.locator("[data-demo-gonder]").first)

                sayfa.goto(f"{taban}/{dil}/{SLUG['dogrula'][dil]}/")
                adacik_hazir("[data-demo-form=dogrula]")
                sayfa.fill("#belge-no", "BE-2026-DEMO-0001")
                gonder_ve_denetle(f"{dil}/belge doğrula", sayfa.locator("[data-demo-form=dogrula] [data-demo-gonder]"), modal_bekle=False)
                if not sayfa.locator("[data-dogrulama-sonucu]").is_visible():
                    hatalar.append(f"{dil}/belge doğrula: örnek numara için «geçerli» kartı görünmedi")

            bag.close()
            tarayici.close()
    finally:
        if sunucu:
            subprocess.run(f"taskkill /PID {sunucu.pid} /T /F", shell=True, capture_output=True)

    ozet = {"yol_sayisi": len(tum_yollar), **sayac, "hata_sayisi": len(hatalar)}
    print(json.dumps(ozet, ensure_ascii=False))
    for h in hatalar:
        print("HATA:", h)
    print("SONUÇ:", "BAŞARILI" if not hatalar else "BAŞARISIZ")
    return 0 if not hatalar else 1


if __name__ == "__main__":
    sys.exit(main())
