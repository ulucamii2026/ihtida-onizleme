"""Kurumsal teklif kitabı ve sunum için önizleme ekran görüntüleri (kurgusal veri, önizleme bandı görünür).

Kullanım (önce `npm run build`; çalışan önizleme sunucusu yoksa betik açar):
    py -3.14 scripts/kitap-gorselleri.py [--url http://localhost:4410] [--hedef <klasör>]

Üretilenler (deviceScaleFactor 2 → baskıya uygun çözünürlük):
    onizleme-anasayfa.png   TR ana sayfa, 1280×800 görüntü alanı
    onizleme-panel.png      TR panel, Koordinatör rolü, 1280×800
    onizleme-uygulama.png   TR personel uygulaması «Bildirimler», 390×844 (dikey telefon)
Service worker engellenir, localStorage her çekimden önce temizlenir (başlangıç durumu).
"""
from __future__ import annotations

import argparse
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
    {"ad": "onizleme-panel.png", "yol": "/panel/", "vp": (1280, 800), "bekle": "[data-rol-icerik=koordinator]", "rol": "koordinator"},
    {"ad": "onizleme-uygulama.png", "yol": "/app/", "vp": (390, 844), "bekle": "[data-app][data-sekme=bildirimler]"},
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
                s = bag.new_page()
                s.goto(taban + c["yol"])
                s.evaluate("() => localStorage.clear()")
                if c.get("rol"):
                    s.evaluate(f"() => localStorage.setItem('ihtida-onizleme:panel:rol', JSON.stringify('{c['rol']}'))")
                s.reload(wait_until="networkidle")
                s.wait_for_selector(c["bekle"], timeout=10000)
                s.evaluate("() => document.fonts.ready")
                s.wait_for_timeout(600)
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
