"""Kurumsal teklif kitabı ve sunum için önizleme ekran görüntüleri (kurgusal veri).

Önizleme uyarısı (23.09.2026'dan beri açılış penceresi) çekimde kapalıdır: kitap ve sunum altyazıları
«Önizleme — … kurgusal» der; pencere ekranın ortasını kapatmasın diye oturum «görüldü» sayılır.

Kullanım (önce `npm run build`; çalışan önizleme sunucusu yoksa betik açar):
    py -3.14 scripts/kitap-gorselleri.py [--url http://localhost:4410] [--hedef <klasör>]

Üretilenler (deviceScaleFactor 2 → baskıya uygun çözünürlük):
    onizleme-anasayfa.png         TR ana sayfa, 1280×800 görüntü alanı
    onizleme-panel.png            TR panel, Koordinatör rolü, 1280×800
    onizleme-uygulama.png         TR personel uygulaması «Bildirimler», 390×844 (dikey telefon)
    onizleme-beni-arayin.png      TR «Beni arayın» (Öneri 18): rıza işaretli, kurgusal işaret haritada, 1280×800
    onizleme-anket.png            TR buluşma sonrası anket (Öneri 14), birkaç seçim yapılmış, 1280×800
    onizleme-panel-harita.png     TR panel, Bölge sorumlusu · kadın görevli, Rehber haritası, 1280×800
    onizleme-panel-faaliyet.png   TR panel, Koordinatör, Faaliyet günlüğü (çeyrek grafiği), 1280×800
Service worker engellenir; her çekim boş depolu yeni bir bağlamda açılır (başlangıç durumu). «yerel» yalnız görünüm
durumunu (rol, modül, görevli görünümü) kurar — sayfa betiklerinden ÖNCE, başlangıç betiğiyle: bileşenler açılışta
kendi varsayılanlarını yazdığından sonradan yazmak yarışa yol açar. Form adımları yalnız sayfa belleğindedir.
"""
from __future__ import annotations

import argparse
import json
import socket
import subprocess
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

KOK = Path(__file__).resolve().parent.parent
VARSAYILAN_HEDEF = Path(r"D:\muhtedi-koordinatorlugu\06_Yazisma_ve_Iletisim\2026-09-28_Kurumsal-Teklif-Kitabi\gorsel")
PORT = 4410

CEKIMLER = [
    {"ad": "onizleme-anasayfa.png", "yol": "/tr/", "vp": (1280, 800), "bekle": "main"},
    {"ad": "onizleme-panel.png", "yol": "/panel/", "vp": (1280, 800), "bekle": "[data-rol-icerik=koordinator]",
     "yerel": {"panel:rol": "koordinator"}},
    {"ad": "onizleme-uygulama.png", "yol": "/app/", "vp": (390, 844), "bekle": "[data-app][data-sekme=bildirimler]"},
    # WP6 (30.09.2026): Öneri 18, 14 ve 17 ekranları
    {"ad": "onizleme-beni-arayin.png", "yol": "/tr/beni-arayin/", "vp": (1280, 800), "bekle": "main",
     "ada": "[data-demo-form=beni-arayin]", "harita": True, "kaydir": "[data-demo-form=beni-arayin]",
     "adimlar": [("tikla", "[data-riza-onay]"), ("tikla", "[data-takma-ad=Deneb]"), ("sec", "#ba-yas", "1"),
                 ("sec", "#ba-ilce", "liege"), ("tikla", "[data-cinsiyet=K]"), ("tikla", "[data-demo-gonder]"),
                 ("tus", "Escape")]},
    {"ad": "onizleme-anket.png", "yol": "/tr/anket/", "vp": (1280, 800), "bekle": "main",
     "ada": "[data-demo-form=anket]", "kaydir": "#anket-form-baslik",
     "adimlar": [("tikla", "[data-memnuniyet='5']"), ("tikla", "[data-anket-soru=konu] [data-secenek='0']"),
                 ("tikla", "[data-anket-soru=dil] [data-secenek='0']")]},
    {"ad": "onizleme-panel-harita.png", "yol": "/panel/", "vp": (1280, 800), "bekle": "[data-modul-icerik=harita] [data-isaret-listesi]",
     "yerel": {"panel:rol": "bolge", "panel:modul": "harita", "harita:kadin-gorevli": True},
     "adimlar": [("tikla", "[data-isaret-ac='H-DEMO-05']")], "kaydir": "[data-pilot-notu]"},
    {"ad": "onizleme-panel-faaliyet.png", "yol": "/panel/", "vp": (1280, 800), "bekle": "[data-ceyrek-grafigi]",
     "yerel": {"panel:rol": "koordinator", "panel:modul": "faaliyet"}, "kaydir": "[data-modul-secici]"},
]


def port_acik(port: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=None)
    ap.add_argument("--hedef", default=str(VARSAYILAN_HEDEF))
    a = ap.parse_args()
    hedef = Path(a.hedef)
    hedef.mkdir(parents=True, exist_ok=True)

    sunucu = None
    taban = a.url or f"http://localhost:{PORT}"
    if not a.url and not port_acik(PORT):
        sunucu = subprocess.Popen(f"npx astro preview --port {PORT} --host 127.0.0.1", cwd=KOK, shell=True,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(120):
            if port_acik(PORT):
                break
            time.sleep(0.25)
    try:
        with sync_playwright() as pw:
            t = pw.chromium.launch(channel="chrome")
            for c in CEKIMLER:
                w, h = c["vp"]
                bag = t.new_context(viewport={"width": w, "height": h}, device_scale_factor=2,
                                    service_workers="block", locale="tr-TR")
                bag.add_init_script("try { sessionStorage.setItem('onizleme-uyarisi-goruldu', '1') } catch (e) {}")
                kur = "".join(f"localStorage.setItem({json.dumps('ihtida-onizleme:' + k)}, {json.dumps(json.dumps(v))});"
                              for k, v in c.get("yerel", {}).items())  # yalnız görünüm durumu (rol, modül, görevli görünümü)
                if kur:
                    bag.add_init_script(f"try {{ {kur} }} catch (e) {{}}")
                s = bag.new_page()
                s.goto(taban + c["yol"], wait_until="networkidle")
                s.wait_for_selector(c["bekle"], timeout=10000)
                if c.get("ada"):  # client:visible ada görünür olunca canlanır; tıklamadan önce beklenir
                    s.locator(c["ada"]).scroll_into_view_if_needed()
                    s.wait_for_function(
                        "(sel) => { const a = document.querySelector(sel)?.closest('astro-island'); return !!a && !a.hasAttribute('ssr'); }",
                        arg=c["ada"], timeout=10000)
                for adim in c.get("adimlar", []):
                    if adim[0] == "tikla":
                        s.locator(adim[1]).first.click()
                    elif adim[0] == "sec":
                        s.select_option(adim[1], adim[2])
                    elif adim[0] == "tus":
                        s.keyboard.press(adim[1])
                    s.wait_for_timeout(150)
                if c.get("harita"):  # Leaflet karoları yüklenene kadar
                    s.wait_for_function(
                        "() => { const t = document.querySelectorAll('img.leaflet-tile'); return t.length > 0 && [...t].every((i) => i.complete); }",
                        timeout=20000)
                if c.get("kaydir"):  # ilgili bölümü görüntü alanının üstüne getir
                    s.evaluate("(sel) => { const e = document.querySelector(sel);"
                               " window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 24)); }", c["kaydir"])
                if c.get("adimlar"):  # fare son tıklanan yerde kalmasın (kaydırmadan sonra başka öğede «hover» görünür)
                    s.mouse.move(1, 1)
                s.evaluate("() => document.fonts.ready")
                s.wait_for_timeout(600)
                if s.locator("dialog[data-onizleme-bandi][open]").count():
                    raise SystemExit(f"{c['ad']}: önizleme uyarısı açık kaldı, çekim durduruldu")
                if s.locator("dialog[data-onizleme-modal][open]").count():
                    raise SystemExit(f"{c['ad']}: «gönderim kapalı» penceresi açık kaldı, çekim durduruldu")
                yol = hedef / c["ad"]
                s.screenshot(path=str(yol))
                print("kaydedildi:", yol)
                bag.close()
            t.close()
    finally:
        if sunucu:
            subprocess.run(f"taskkill /PID {sunucu.pid} /T /F", shell=True, capture_output=True)


if __name__ == "__main__":
    main()
