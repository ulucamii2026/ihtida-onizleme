"""PWA ikonlarını ANA SVG'den üretir (vektör önce: PNG yalnız PWA zorunlu kıldığı için).

Kaynak: public/app/ikonlar/ikon.svg (favicon.svg ile aynı çizim) ve ikon-maskable.svg (tam taşan zemin,
çizim güvenli alanda). Çıktı: ikon-192.png, ikon-512.png, ikon-maskable-512.png, apple-touch-icon.png (180).
Çizim Chrome'da (Playwright) yapılır; ImageMagick kullanılmaz.
    py -3.14 scripts/pwa-ikon-uret.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

KOK = Path(__file__).resolve().parent.parent
IKON = KOK / "public" / "app" / "ikonlar"
HEDEFLER = [
    ("ikon.svg", "ikon-192.png", 192, True),
    ("ikon.svg", "ikon-512.png", 512, True),
    ("ikon-maskable.svg", "ikon-maskable-512.png", 512, False),
    ("ikon-maskable.svg", "apple-touch-icon.png", 180, False),
]

with sync_playwright() as pw:
    t = pw.chromium.launch(channel="chrome")
    for kaynak, cikti, boyut, saydam in HEDEFLER:
        svg = (IKON / kaynak).read_text(encoding="utf-8")
        s = t.new_page(viewport={"width": boyut, "height": boyut}, device_scale_factor=1)
        s.set_content(f'<html><body style="margin:0;background:transparent">'
                      f'<div style="width:{boyut}px;height:{boyut}px">{svg.replace("<svg ", f"<svg width=\"{boyut}\" height=\"{boyut}\" ", 1)}</div></body></html>')
        s.screenshot(path=str(IKON / cikti), omit_background=saydam, clip={"x": 0, "y": 0, "width": boyut, "height": boyut})
        s.close()
        print("üretildi:", cikti, boyut)
    t.close()
