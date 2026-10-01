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
  * «Beni arayın» (Öneri 18): rıza işaretlenmeden alanlar ve gönder kapalı; doldururken ve gönderince ağ isteği yok;
    işaret yalnız bu ekrandaki haritada ilçe düzeyinde; «İşaretimi geri çek» her şeyi sıfırlar
  * buluşma anketi (Öneri 14): ad / serbest metin alanı yok; gönderince ağ isteği yok; «Temizle» sıfırlar
  * iki formda da değerler localStorage / sessionStorage'a YAZILMAZ (önce/sonra karşılaştırılır)
2. faz (/panel/ ve /app/, beş dil):
  * her rol ve her sekme tıklanır; etkileşimlerden sonra SIFIR ağ isteği, JS hatası yok, yatay taşma yok
  * veri en aza indirme: din görevlisi rolünde kimlik/uyruk/defter görünmez; kodlu kayıttaki ad hiçbir rolde yok
  * panel modülleri, rol rol: faaliyet günlüğü (cami: yalnız seçim + sayaç formu → pencere, değer yazılmaz;
    bölge: bölge tablosu; koordinatör/Müşavirlik: 5 çeyrek, sütun grafiği + odak ipucu, «Üç aylık rapor» → pencere),
    buluşma anketi sonuçları (küçük grup gizli), rehber haritası (bölge/cami görevlisi yalnız kapsamındaki işaretleri
    görür; kadın kaydı yalnız «kadın görevli» görünümünde; ayrıntı ve dönüş erişim kaydına yazılır; koordinatör ve
    Müşavirlik yalnız toplam sayıyı görür, takma ad görmez; Müşavirlik «denetlendi» satırı ekler; DPIA notu görünür)
  * uygulamada «Tören yapıldı» onayı → paneldeki Müşavirlik kuyruğuna düşer (yalnız localStorage)
  * PWA senaryosu (service worker'a izin verilen ayrı bağlam): manifest geçerli, ikonlar doğru boyutta,
    service worker /app/ kapsamıyla kayıtlı, Chrome kurulabilirlik hatası yok, çevrim dışı açılış
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
    "beniArayin": {"tr": "beni-arayin", "fr": "contactez-moi", "nl": "contacteer-mij", "de": "kontaktwunsch", "en": "contact-me"},
    "anket": {"tr": "anket", "fr": "questionnaire", "nl": "vragenlijst", "de": "fragebogen", "en": "survey"},
}
# Form değerleri tarayıcı belleğine yazılmamalı: gönderimden önce ve sonra iki depo birebir aynı olmalı.
DEPOLAMA = "() => JSON.stringify([Object.entries(localStorage).sort(), Object.entries(sessionStorage).sort()])"


def harita_bekle(sayfa) -> None:
    """«Beni arayın» Leaflet haritası kurulup açılış karoları yüklenene kadar bekler (karo yalnız açılışta istenir)."""
    sayfa.wait_for_selector("[data-beni-arayin-haritasi].leaflet-container", timeout=10000)
    sayfa.wait_for_function(
        "() => { const t = document.querySelectorAll('[data-beni-arayin-haritasi] img.leaflet-tile');"
        " return t.length > 0 && [...t].every((i) => i.complete); }",
        timeout=20000,
    )
    sayfa.wait_for_timeout(400)


# Önizleme uyarısı (23.09.2026): açılışta pencere, oturumda bir kez. Etkileşim testlerinde «görüldü»
# sayılır ki pencere tıklamaları engellemesin; rota denetiminde her açılışta yeniden çıkması beklenir.
UYARI_GORULDU = "try { sessionStorage.setItem('onizleme-uyarisi-goruldu', '1') } catch (e) {}"
UYARI_SIFIRLA = "try { sessionStorage.removeItem('onizleme-uyarisi-goruldu') } catch (e) {}"


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


PANEL_ROLLERI = ["koordinator", "musavirlik", "bolge", "dinGorevlisi", "muhtedi"]
APP_SEKMELERI = ["bildirimler", "onay", "takip", "sayim", "gorevler", "kaynaklar"]
KODLU_KAYIT_ADI = "Aurélie"  # M-DEMO-05: kodlu kayıt — adı hiçbir rolde görünmemeli
# Panel modülleri (rol → sekmeler; tek modüllü rolde sekme çubuğu yoktur)
PANEL_MODULLERI = {
    "koordinator": ["dosyalar", "faaliyet", "anket", "harita"],
    "musavirlik": ["dosyalar", "faaliyet", "harita"],
    "bolge": ["dosyalar", "faaliyet", "harita"],
    "dinGorevlisi": ["dosyalar", "faaliyet", "harita"],
    "muhtedi": [],
}
# Rehber haritasındaki kurgusal işaretlerin takma adları: koordinatör ve Müşavirlik görünümünde hiçbiri geçmemeli
ISARET_TAKMA_ADLARI = ["Deneb", "Mizar", "Altair", "Rigel", "Mintaka", "Alnilam", "Alcor", "Alkaid", "Alnitak"]
# Görevli görünümü: kapsam, (erkek, kadın) görünümde beklenen açık işaret sayısı, erkek ve kadın örnek kayıt
GOREVLI_HARITA = {
    "bolge": ({"liege", "eupen"}, (2, 3), "H-DEMO-03", "H-DEMO-05"),
    "dinGorevlisi": ({"namur"}, (1, 2), "H-DEMO-01", "H-DEMO-02"),
}
TOPLAM_ACIK_ISARET = 8
# Yalnız TR'de tam sayfa görüntüsü alınan modül ekranları (bölge haritası, kadın görünümünde ayrıca alınır)
PANEL_EKRAN = {("koordinator", "faaliyet"), ("koordinator", "anket"), ("musavirlik", "harita"), ("dinGorevlisi", "faaliyet")}


def panel_ve_uygulama(tarayici, taban, dil, gen, yuk, hatalar, sayac) -> None:
    """Rol değiştirici, sekmeler ve bütün önizleme eylemleri: SIFIR ağ isteği, JS hatası yok, taşma yok."""
    bag = tarayici.new_context(viewport={"width": gen, "height": yuk}, service_workers="block")
    bag.add_init_script(UYARI_GORULDU)
    sayfa = bag.new_page()
    istekler: list[str] = []
    js: list[str] = []
    sayfa.on("request", lambda r: istekler.append(r.url))
    sayfa.on("pageerror", lambda e: js.append(str(e)))
    ek = "" if dil == "tr" else f"{dil}/"
    etiket0 = f"[{gen}px] {dil}"

    def hazirla(yol: str, secici: str) -> None:
        sayfa.goto(taban + yol)
        sayfa.evaluate("() => localStorage.clear()")
        sayfa.reload()
        sayfa.wait_for_selector(secici, timeout=8000)
        sayfa.wait_for_load_state("networkidle")
        istekler.clear()
        js.clear()

    def denetle(etiket: str) -> None:
        sayfa.wait_for_timeout(250)
        ag = [u for u in istekler if not u.startswith(("data:", "blob:"))]
        if ag:
            hatalar.append(f"{etiket}: etkileşimden sonra ağ isteği: {ag[:3]}")
        for h in js:
            hatalar.append(f"{etiket}: JS hatası {h}")
        tasma = sayfa.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        if tasma[0] > tasma[1]:
            hatalar.append(f"{etiket}: yatay taşma {tasma[0]} > {tasma[1]}")
        if sayfa.locator("[data-onizleme-bandi]").count() != 1:
            hatalar.append(f"{etiket}: önizleme bandı yok")
        istekler.clear()
        js.clear()
        sayac["etkilesim_kontrol"] = sayac.get("etkilesim_kontrol", 0) + 1

    def modal_acik_mi(etiket: str) -> None:
        m = sayfa.locator("dialog[data-onizleme-modal][open]")
        if m.count() != 1 or not m.first.is_visible():
            hatalar.append(f"{etiket}: önizleme penceresi açılmadı")
        else:
            sayfa.keyboard.press("Escape")
            sayfa.wait_for_timeout(150)

    # ── PANEL ──
    hazirla(f"/panel/{ek}", "[data-panel]")
    for rol in PANEL_ROLLERI:
        e = f"{etiket0} panel/{rol}"
        sayfa.locator(f"[data-rol-dugme={rol}]").click()
        sayfa.wait_for_selector(f"[data-rol-icerik={rol}]")
        if KODLU_KAYIT_ADI in sayfa.locator("main").inner_text():
            hatalar.append(f"{e}: kodlu kaydın adı görünüyor")
        if rol == "musavirlik":
            satir0 = sayfa.locator("[data-musavirlik-defteri] tbody tr").count()
            sayfa.locator("[data-belge-no-ver]").first.click()
            sayfa.locator("[data-yetkili-imza]").click()
            sayfa.wait_for_timeout(200)
            if sayfa.locator("[data-musavirlik-defteri] tbody tr").count() != satir0 + 1:
                hatalar.append(f"{e}: Belge No verildikten sonra defter satırı artmadı")
            if sayfa.locator("[data-erisim-kaydi] li").count() < 2:
                hatalar.append(f"{e}: erişim kaydına satır eklenmedi")
            if sayfa.locator("[data-yetkili-imza]").get_attribute("aria-checked") != "true":
                hatalar.append(f"{e}: yetkiyle imza anahtarı açılmadı")
        elif rol == "koordinator":
            n0 = sayfa.locator("[data-gorev-listesi] li").count()
            sayfa.locator("[data-gorev-ata-dugme]").click()
            sayfa.wait_for_timeout(150)
            if sayfa.locator("[data-gorev-listesi] li").count() != n0 + 1:
                hatalar.append(f"{e}: görev atanınca liste büyümedi")
        elif rol == "dinGorevlisi":
            if sayfa.locator("[data-musavirlik-defteri], [data-pano]").count():
                hatalar.append(f"{e}: din görevlisi defteri/panoyu görüyor")
            if sayfa.locator("[data-cami-kisileri] thead th").count() != 4:
                hatalar.append(f"{e}: din görevlisi tablosu 4 sütundan (kod, ad, dil, iletişim) farklı")
            kodlar = sayfa.locator("[data-cami-kisileri] tbody tr td:first-child").all_inner_texts()
            if sorted(kodlar) != ["M-DEMO-01", "M-DEMO-07", "M-DEMO-11"]:
                hatalar.append(f"{e}: başka caminin kişileri görünüyor: {kodlar}")
            sayfa.locator("[data-takip-kaydet]").click()
            sayfa.wait_for_timeout(300)
            modal_acik_mi(e)
        elif rol == "bolge":
            adet = sayfa.locator("[data-bolge-dosyalari] > li").count()
            if adet != 3:
                hatalar.append(f"{e}: bölge sorumlusu {adet} dosya görüyor (beklenen 3, yalnız Liège)")
        elif rol == "muhtedi":
            sayfa.locator("[data-belge-indir]").click()
            sayfa.wait_for_timeout(300)
            modal_acik_mi(e)
        denetle(e)

    # ── PANEL MODÜLLERİ: faaliyet günlüğü (Öneri 17), buluşma anketi (Öneri 14), rehber haritası (Öneri 18) ──
    def sayi(secici: str) -> int:
        return sayfa.locator(secici).count()

    def ekran_al(ad: str) -> None:
        if dil != "tr":
            return
        tam = EKRAN / f"panel-{ad}-{gen}-tam.png"
        sayfa.screenshot(path=str(tam), full_page=True)
        parcala(tam)

    def faaliyet_denetle(rol: str, e: str) -> None:
        if rol in ("koordinator", "musavirlik"):
            if sayi("[data-ceyrek-tablosu] tbody tr[data-ceyrek]") != 5:
                hatalar.append(f"{e}: çeyrek tablosunda 5 satır yok")
            if sayi("svg[data-ceyrek-grafigi] [data-grafik-sutun]") != 5:
                hatalar.append(f"{e}: çeyrek grafiğinde 5 sütun yok")
            if sayi("[data-faaliyet-kaydi], [data-faaliyet-formu]"):
                hatalar.append(f"{e}: toplu görünümde tek tek kayıt / giriş formu görünüyor")
            sayfa.locator("[data-grafik-sutun]").nth(3).focus()
            sayfa.wait_for_timeout(100)
            if sayi("[data-grafik-ipucu]") != 1:
                hatalar.append(f"{e}: grafik ipucu klavye odağında görünmedi")
            sayfa.locator("[data-uc-aylik-rapor]").click()
            sayfa.wait_for_timeout(250)
            modal_acik_mi(e)
        elif rol == "bolge":
            if sayi("[data-bolge-gunlugu]") != 1 or sayi("[data-bolge-gunlugu] [data-faaliyet-kaydi]") == 0:
                hatalar.append(f"{e}: bölge kayıt tablosu yok")
            if sayi("[data-faaliyet-formu], [data-ceyrek-tablosu]"):
                hatalar.append(f"{e}: bölge sorumlusu formu / çeyrek tablosunu görüyor")
        else:  # din görevlisi = cami irtibat kişisi
            form = sayfa.locator("[data-faaliyet-formu]")
            if form.count() != 1 or sayi("[data-cami-gunlugu] [data-faaliyet-kaydi]") == 0:
                hatalar.append(f"{e}: cami günlüğü / giriş formu yok")
                return
            if form.locator("textarea, input[type=text], input[type=email], input[type=tel]").count():
                hatalar.append(f"{e}: faaliyet formunda serbest metin alanı var")
            depo0 = sayfa.evaluate(DEPOLAMA)
            sayfa.locator("[data-faaliyet-artir=K]").click()
            sayfa.locator("[data-faaliyet-artir=K]").click()
            sayfa.locator("[data-faaliyet-artir=E]").click()
            sayfa.select_option("#fg-tur", index=2)
            if not sayfa.locator("[data-faaliyet-toplam]").inner_text().strip().endswith("3"):
                hatalar.append(f"{e}: sayaç toplamı 3 değil")
            sayfa.locator("[data-faaliyet-gonder]").click()
            sayfa.wait_for_timeout(250)
            modal_acik_mi(e)
            if sayfa.evaluate(DEPOLAMA) != depo0:
                hatalar.append(f"{e}: faaliyet formu değerleri tarayıcı belleğine yazıldı")

    def anket_denetle(e: str) -> None:
        if sayi("[data-anket-sonuc]") != 1 or sayi("[data-anket-gizli]") != 1:
            hatalar.append(f"{e}: açık / gizli anket kartı sayısı yanlış")
            return
        if sayfa.locator("[data-anket-gizli]").locator("[data-anket-ortalama], [data-anket-soru]").count():
            hatalar.append(f"{e}: küçük grubun anket sonucu görünüyor")
        ort = sayfa.locator("[data-anket-sonuc] [data-anket-ortalama]").inner_text()
        if "4,5" not in ort and "4.5" not in ort:
            hatalar.append(f"{e}: ortalama memnuniyet 4,5 değil ({ort!r})")

    def harita_denetle(rol: str, e: str) -> None:
        if sayi("[data-pilot-notu]") != 1:
            hatalar.append(f"{e}: «DPIA ve Müşavirlik onayı olmadan pilot başlamaz» notu yok")
        if rol in ("koordinator", "musavirlik"):
            if sayi("[data-isaret], [data-isaret-listesi], [data-harita-semasi]"):
                hatalar.append(f"{e}: bu rolde tek tek işaret görünüyor")
            if sayi("[data-isaret-yok-notu]") != 1:
                hatalar.append(f"{e}: «işaretler görünmez; yalnız toplulaştırılmış sayı» notu yok")
            toplam = sayfa.locator("[data-isaret-toplam]").inner_text().strip() if sayi("[data-isaret-toplam]") else ""
            if toplam != str(TOPLAM_ACIK_ISARET):
                hatalar.append(f"{e}: toplam açık işaret {toplam!r} (beklenen {TOPLAM_ACIK_ISARET})")
            metin = sayfa.locator("[data-rol-icerik]").inner_text()
            adlar = [a for a in ISARET_TAKMA_ADLARI if a in metin]
            if adlar:
                hatalar.append(f"{e}: takma adlar görünüyor: {adlar}")
            if rol == "koordinator":
                if sayi("[data-kim-neyi-gorur]") != 1 or sayi("[data-erisim-kaydi-harita]"):
                    hatalar.append(f"{e}: koordinatör görünümü yanlış (kim neyi görür yok / erişim kaydı açık)")
            else:
                n0 = sayi("[data-erisim-kaydi-harita] li")
                sayfa.locator("[data-erisim-denetle]").click()
                sayfa.wait_for_timeout(150)
                if sayi("[data-erisim-kaydi-harita] li") != n0 + 1 or sayi("[data-erisim-islem=denetim]") < 2:
                    hatalar.append(f"{e}: «denetlendi» satırı erişim kaydına eklenmedi")
            return

        kapsam, (n_erkek, n_kadin), erkek_kod, kadin_kod = GOREVLI_HARITA[rol]

        def isaretler() -> list[list[str]]:
            return sayfa.locator("[data-isaret]").evaluate_all(
                "els => els.map((e) => [e.dataset.isaret, e.dataset.yer, e.dataset.kadin])")

        sayfa.locator("[data-kadin-gorevli=hayir]").click()
        sayfa.wait_for_timeout(100)
        liste = isaretler()
        if len(liste) != n_erkek or any(k == "evet" for _, _, k in liste) or any(y not in kapsam for _, y, _ in liste):
            hatalar.append(f"{e}: erkek görevli görünümünde işaretler yanlış: {liste}")
        if sayi("[data-kadin-gizli]") != 1 or sayi("[data-isaret-disi]") != 1:
            hatalar.append(f"{e}: «kadın kaydı gizli» / «diğer yerler görünmez» notu yok")
        sayili = sayfa.locator("[data-harita-yer]").evaluate_all(
            "els => els.filter((e) => e.hasAttribute('data-harita-sayi')).map((e) => e.dataset.haritaYer)")
        if set(sayili) != kapsam:
            hatalar.append(f"{e}: şemada kapsam dışı ilçe sayı taşıyor: {sayili}")
        n0 = sayi("[data-erisim-kaydi-harita] li")
        sayfa.locator(f"[data-isaret-ac='{erkek_kod}']").click()
        sayfa.wait_for_timeout(100)
        if sayi(f"[data-isaret-ayrinti='{erkek_kod}']") != 1 or sayi("[data-erisim-kaydi-harita] li") != n0 + 1:
            hatalar.append(f"{e}: ayrıntı açılınca erişim kaydına satır eklenmedi")
        # Kadın görevli görünümü: kadın kaydı da görünür
        sayfa.locator("[data-kadin-gorevli=evet]").click()
        sayfa.wait_for_timeout(100)
        liste = isaretler()
        if len(liste) != n_kadin or kadin_kod not in [k for k, _, _ in liste] or sayi("[data-kadin-gizli]"):
            hatalar.append(f"{e}: kadın görevli görünümünde işaretler yanlış: {liste}")
        if sayi("[data-alan-gorunur=kadinIsaretleri]") != 1:
            hatalar.append(f"{e}: kadın görevli görünümünde «kadın kayıtlı işaretler» alanı görünür değil")
        sayfa.locator(f"[data-isaret-ac='{kadin_kod}']").click()
        sayfa.wait_for_timeout(100)
        if rol == "bolge":
            ekran_al("bolge-harita-kadin")
        n1 = sayi("[data-erisim-kaydi-harita] li")
        sayfa.locator(f"[data-donus-yapildi='{erkek_kod}']").click()
        sayfa.wait_for_timeout(150)
        if sayi(f"[data-isaret='{erkek_kod}']") or sayi("[data-isaret-bildirim]") != 1 \
                or sayi("[data-erisim-kaydi-harita] li") != n1 + 1:
            hatalar.append(f"{e}: «Dönüş yapıldı» işareti kaldırmadı / erişim kaydına yazmadı")
        # Erkek görünümüne dönüş: kadın kaydı ve ona ait erişim satırları yine görünmez
        sayfa.locator("[data-kadin-gorevli=hayir]").click()
        sayfa.wait_for_timeout(100)
        satirlar = " ".join(sayfa.locator("[data-erisim-kaydi-harita] li").all_inner_texts())
        if sayi(f"[data-isaret='{kadin_kod}']") or kadin_kod in satirlar:
            hatalar.append(f"{e}: erkek görünümünde kadın kaydı veya ona ait erişim satırı görünüyor")

    hazirla(f"/panel/{ek}", "[data-panel]")
    for rol, moduller in PANEL_MODULLERI.items():
        e0 = f"{etiket0} panel/{rol}"
        sayfa.locator(f"[data-rol-dugme={rol}]").click()
        sayfa.wait_for_selector(f"[data-rol-icerik={rol}] [data-modul-icerik=dosyalar]")
        sekmeler = sayfa.locator("[data-modul-dugme]").evaluate_all("els => els.map((e) => e.dataset.modulDugme)")
        if sekmeler != moduller:
            hatalar.append(f"{e0}: modül sekmeleri {sekmeler} (beklenen {moduller})")
        if sayi("[data-kadin-gorevli-secici]") != (1 if rol in GOREVLI_HARITA else 0):
            hatalar.append(f"{e0}: «kadın görevli» seçicisi yanlış rolde ya da eksik")
        if rol == "muhtedi":
            href = sayfa.locator("[data-kisisel-harita] a").get_attribute("href") if sayi("[data-kisisel-harita] a") else ""
            if not (href or "").endswith(f"/{dil}/{SLUG['beniArayin'][dil]}/"):
                hatalar.append(f"{e0}: kişisel alanda «Beni arayın» bağlantısı yok ya da yanlış ({href!r})")
            denetle(e0)
            continue
        for modul in moduller[1:]:
            e = f"{e0}/{modul}"
            sayfa.locator(f"[data-modul-dugme={modul}]").click()
            sayfa.wait_for_selector(f"[data-panel][data-modul={modul}] [data-modul-icerik={modul}]")
            if modul == "faaliyet":
                faaliyet_denetle(rol, e)
            elif modul == "anket":
                anket_denetle(e)
            else:
                harita_denetle(rol, e)
            denetle(e)
            if (rol, modul) in PANEL_EKRAN:
                ekran_al(f"{rol}-{modul}")
    # Rol değişince modül «Dosyalar»a döner
    sayfa.locator("[data-rol-dugme=koordinator]").click()
    sayfa.locator("[data-modul-dugme=harita]").click()
    sayfa.locator("[data-rol-dugme=musavirlik]").click()
    if sayfa.locator("[data-panel]").get_attribute("data-modul") != "dosyalar":
        hatalar.append(f"{etiket0} panel: rol değişince modül «Dosyalar»a dönmedi")

    # ── UYGULAMA ──
    hazirla(f"/app/{ek}", "[data-app]")
    for sekme in APP_SEKMELERI:
        e = f"{etiket0} app/{sekme}"
        sayfa.locator(f"[data-app-sekme={sekme}]").click()
        sayfa.wait_for_selector(f"[data-app][data-sekme={sekme}]")
        if sekme == "bildirimler":
            sayfa.locator("[data-bildirim=b2]").click()
            sayfa.wait_for_selector("[data-app][data-sekme=takip]")
            sayfa.locator("[data-app-sekme=bildirimler]").click()
        elif sekme == "onay":
            kart = sayfa.locator("[data-onay-kisi='M-DEMO-11']")
            kart.locator("[data-onay=hazirlik]").click()
            kart.locator("select").select_option(index=1)
            kart.locator("[data-onay=tarih]").click()
            kart.locator("[data-onay=toren]").click()
            if not kart.locator("[data-onay-tamam]").is_visible():
                hatalar.append(f"{e}: «Tören yapıldı» sonrası Müşavirliğe iletildi bilgisi yok")
        elif sekme == "takip":
            sayfa.locator("[data-takip-kisi='M-DEMO-01'] [data-takip-isaret=gorusuldu]").click()
            if not sayfa.locator("[data-takip-kisi='M-DEMO-01'] [data-takip-isaretli]").is_visible():
                hatalar.append(f"{e}: 30 saniyelik işaretleme görünmedi")
            sayfa.locator("[data-takip-form-ac='M-DEMO-07']").click()
            sayfa.locator("[data-takip-form-kaydet]").click()
            sayfa.wait_for_timeout(300)
            modal_acik_mi(e)
        elif sekme == "sayim":
            sayfa.locator("[data-artir=K]").click()
            sayfa.locator("[data-artir=fr]").click()
            sayfa.locator("[data-sayim-gonder]").click()
            sayfa.wait_for_timeout(300)
            modal_acik_mi(e)
        elif sekme == "gorevler":
            sayfa.locator("[data-gorev=g2]").click()
            n0 = sayfa.locator("[data-mesaj-dizisi] li").count()
            sayfa.locator("[data-hazir-yanit=y2]").click()
            if sayfa.locator("[data-mesaj-dizisi] li").count() != n0 + 1:
                hatalar.append(f"{e}: hazır yanıt mesaj dizisine eklenmedi")
            sayfa.locator("[data-gorev-durum=tamam]").click()
        elif sekme == "kaynaklar":
            sayfa.locator("[data-dokuman]").first.click()
            sayfa.wait_for_timeout(300)
            modal_acik_mi(e)
        denetle(e)

    # Uygulamadaki onay → paneldeki Müşavirlik kuyruğu (aynı tarayıcı, yalnız localStorage)
    sayfa.goto(f"{taban}/panel/{ek}")
    sayfa.wait_for_selector("[data-panel]")
    sayfa.locator("[data-rol-dugme=musavirlik]").click()
    if sayfa.locator("[data-belge-no-ver='M-DEMO-11']").count() != 1:
        hatalar.append(f"{etiket0}: uygulamadaki «Tören yapıldı» Müşavirlik kuyruğuna düşmedi")
    bag.close()


def pwa_senaryosu(pw, taban, hatalar, sayac) -> None:
    """Manifest + ikonlar + service worker (/app/ kapsamı) + kurulabilirlik + çevrim dışı açılış.
    Kalıcı (gizli olmayan) profil gerekir: Chrome gizli pencerede «in-incognito» kurulabilirlik hatası verir."""
    import io
    import shutil
    import tempfile

    profil = tempfile.mkdtemp(prefix="ihtida-pwa-")
    bag = pw.chromium.launch_persistent_context(profil, channel="chrome", headless=True,
                                                viewport={"width": 390, "height": 844})
    sayfa = bag.new_page()
    yanit = bag.request.get(f"{taban}/manifest.webmanifest")
    try:
        man = json.loads(yanit.text())
    except Exception as h:  # noqa: BLE001
        hatalar.append(f"PWA: manifest JSON değil ({h})")
        bag.close()
        shutil.rmtree(profil, ignore_errors=True)
        return
    for alan, beklenen in {"start_url": "/app/", "scope": "/app/", "display": "standalone"}.items():
        if man.get(alan) != beklenen:
            hatalar.append(f"PWA: manifest {alan}={man.get(alan)!r} (beklenen {beklenen!r})")
    if not man.get("name") or not man.get("short_name"):
        hatalar.append("PWA: manifest name/short_name eksik")
    boyutlar = set()
    for ikon in man.get("icons", []):
        r = bag.request.get(taban + ikon["src"])
        if r.status != 200:
            hatalar.append(f"PWA: ikon {ikon['src']} HTTP {r.status}")
            continue
        if ikon.get("type") == "image/png":
            with Image.open(io.BytesIO(r.body())) as im:
                if f"{im.size[0]}x{im.size[1]}" != ikon["sizes"]:
                    hatalar.append(f"PWA: {ikon['src']} gerçek boyut {im.size} ≠ {ikon['sizes']}")
            boyutlar.add((ikon["sizes"], ikon.get("purpose", "any")))
    for gerek in [("192x192", "any"), ("512x512", "any"), ("512x512", "maskable")]:
        if gerek not in boyutlar:
            hatalar.append(f"PWA: {gerek} PNG ikonu yok")

    sayfa.goto(f"{taban}/app/")
    sayfa.wait_for_selector("[data-app]")
    if not sayfa.locator('link[rel="manifest"]').count():
        hatalar.append("PWA: /app/ sayfasında manifest bağlantısı yok")
    kapsam = sayfa.evaluate("""() => Promise.race([
        navigator.serviceWorker.ready.then(r => r.scope),
        new Promise(r => setTimeout(() => r(null), 15000))])""")
    if not kapsam or not kapsam.endswith("/app/"):
        hatalar.append(f"PWA: service worker /app/ kapsamıyla kaydolmadı (kapsam: {kapsam})")
    sayfa.wait_for_timeout(2000)
    cdp = bag.new_cdp_session(sayfa)
    try:
        kurulum = cdp.send("Page.getInstallabilityErrors").get("installabilityErrors", [])
        if kurulum:
            hatalar.append(f"PWA: Chrome kurulabilirlik hataları: {kurulum}")
    except Exception as h:  # noqa: BLE001
        hatalar.append(f"PWA: kurulabilirlik denetlenemedi ({h})")
    # Kamu sayfaları service worker denetiminde DEĞİL
    sayfa.goto(f"{taban}/tr/")
    if sayfa.evaluate("() => !!navigator.serviceWorker.controller"):
        hatalar.append("PWA: kamu sayfası service worker denetiminde (kapsam /app/ olmalı)")
    # Çevrim dışı açılış
    bag.set_offline(True)
    try:
        sayfa.goto(f"{taban}/app/")
        sayfa.wait_for_selector("[data-app]", timeout=8000)
        if not sayfa.locator("dialog[data-onizleme-bandi][open]").is_visible():
            hatalar.append("PWA: çevrim dışı açılışta önizleme uyarısı yok")
    except Exception as h:  # noqa: BLE001
        hatalar.append(f"PWA: çevrim dışı açılış başarısız ({str(h).splitlines()[0]})")
    bag.set_offline(False)
    sayac["pwa_kontrol"] = 1
    bag.close()
    shutil.rmtree(profil, ignore_errors=True)


def uyari_senaryosu(tarayici, taban, taban_host, hatalar, sayac) -> None:
    """Önizleme uyarısı: açılışta çıkar; «Anladım»/Esc ile kapanır; aynı sekmede tekrar gelmez;
    yeni sekmede ve yeni bağlamda yeniden gelir; kapatınca iz kalmaz; JS kapalıyken sabit bant görünür."""
    for gen, yuk in GENISLIKLER:
        bag = tarayici.new_context(viewport={"width": gen, "height": yuk}, service_workers="block")
        sayfa = bag.new_page()
        istekler: list[str] = []
        sayfa.on("request", lambda r: istekler.append(r.url))
        e = f"[{gen}px] uyarı"
        acik = "dialog[data-onizleme-bandi][open]"
        sayfa.goto(f"{taban}/tr/")
        if not sayfa.locator(acik).is_visible():
            hatalar.append(f"{e}: ilk açılışta pencere yok")
        dugme = sayfa.locator("[data-onizleme-kapat]")
        if dugme.inner_text().strip() != "Anladım":
            hatalar.append(f"{e}: düğme metni {dugme.inner_text()!r}")
        kutu = dugme.bounding_box() or {"height": 0}
        if kutu["height"] < 44:
            hatalar.append(f"{e}: düğme parmak için küçük ({kutu['height']:.0f}px)")
        dugme.click()
        sayfa.wait_for_timeout(150)
        if sayfa.locator(acik).count():
            hatalar.append(f"{e}: «Anladım» ile kapanmadı")
        if sayfa.locator("[data-onizleme-bandi]:visible, [data-onizleme-noscript]:visible").count():
            hatalar.append(f"{e}: kapatınca sayfada iz kaldı")
        for yol in ("/tr/basvuru/", "/panel/", "/app/"):
            sayfa.goto(taban + yol)
            sayfa.wait_for_timeout(200)
            if sayfa.locator(acik).count():
                hatalar.append(f"{e}: aynı sekmede {yol} açılınca pencere yeniden çıktı")
        ikinci = bag.new_page()
        ikinci.goto(f"{taban}/fr/")
        if not ikinci.locator(acik).is_visible():
            hatalar.append(f"{e}: yeni sekmede pencere çıkmadı")
        elif ikinci.locator("[data-onizleme-kapat]").inner_text().strip() != "J’ai compris":
            hatalar.append(f"{e}: FR düğme metni yanlış")
        ikinci.keyboard.press("Escape")
        ikinci.wait_for_timeout(150)
        if ikinci.locator(acik).count():
            hatalar.append(f"{e}: Esc ile kapanmadı")
        for u in istekler:
            if urlparse(u).netloc not in (taban_host, *IZINLI_DIS) and not u.startswith(("data:", "blob:")):
                hatalar.append(f"{e}: izinsiz ağ isteği {u}")
        bag.close()
    # Yeni bağlamda panel ve uygulama da açılışta uyarı gösterir
    for yol in ("/panel/", "/app/", "/"):
        bag = tarayici.new_context(viewport={"width": 390, "height": 844}, service_workers="block")
        sayfa = bag.new_page()
        sayfa.goto(taban + yol)
        if not sayfa.locator("dialog[data-onizleme-bandi][open]").is_visible():
            hatalar.append(f"uyarı: yeni oturumda {yol} açılışında pencere yok")
        bag.close()
    # JavaScript kapalı: sabit bant görünür, pencere açılmaz
    bag = tarayici.new_context(viewport={"width": 390, "height": 844}, java_script_enabled=False)
    sayfa = bag.new_page()
    sayfa.goto(f"{taban}/tr/")
    bant = sayfa.locator("[data-onizleme-noscript]")
    if bant.count() != 1 or not bant.first.is_visible():
        hatalar.append("uyarı: JavaScript kapalıyken sabit bant görünmüyor")
    if sayfa.locator("dialog[data-onizleme-bandi][open]").count():
        hatalar.append("uyarı: JavaScript kapalıyken pencere açık")
    bag.close()
    sayac["uyari_kontrol"] = 1


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
                bag.add_init_script(UYARI_SIFIRLA)
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
                    if yol.startswith("/panel/") or yol.startswith("/app/"):
                        sayfa.wait_for_selector("[data-panel], [data-app]", timeout=8000)
                    sayfa.wait_for_timeout(250)
                    uyari = sayfa.locator("dialog[data-onizleme-bandi]")
                    if uyari.count() != 1 or not sayfa.locator("dialog[data-onizleme-bandi][open]").is_visible():
                        hatalar.append(f"{etiket}: önizleme uyarısı açılışta görünmüyor")
                    else:
                        uyari.locator("[data-onizleme-kapat]").click()
                        sayfa.wait_for_timeout(150)
                        if sayfa.locator("dialog[data-onizleme-bandi][open]").count():
                            hatalar.append(f"{etiket}: önizleme uyarısı «kapat» ile kapanmadı")
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

                    # Ekran görüntüleri: ana sayfa, başvuru, «Beni arayın» ve buluşma anketi (TR)
                    ad = {"/tr/": "ana-tr", "/tr/basvuru/": "basvuru-tr", "/tr/beni-arayin/": "beni-arayin-tr",
                          "/tr/anket/": "anket-tr"}.get(yol)
                    if ad:
                        form = {"/tr/basvuru/": "basvuru", "/tr/beni-arayin/": "beni-arayin", "/tr/anket/": "anket"}.get(yol)
                        if form:  # ada görünür olunca canlanır; tam sayfa görüntüsünden önce canlandırılır
                            sayfa.locator(f"[data-demo-form={form}]").scroll_into_view_if_needed()
                            sayfa.wait_for_timeout(400)
                            if form == "beni-arayin":
                                harita_bekle(sayfa)
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
            bag.add_init_script(UYARI_GORULDU)
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
                href = sayfa.locator("[data-etkinlik-anket] a").get_attribute("href") if sayfa.locator("[data-etkinlik-anket] a").count() else ""
                if not (href or "").endswith(f"/{dil}/{SLUG['anket'][dil]}/"):
                    hatalar.append(f"{dil}/etkinlikler: buluşma anketi bağlantısı yok ya da yanlış ({href!r})")

                def ag_istekleri() -> list[str]:
                    return [u for u in sonraki if not u.startswith(("data:", "blob:"))]

                # «Beni arayın» (Öneri 18): rıza önce; takma ad + yaş aralığı + ilçe + cinsiyet → pencere; geri çek
                sayfa.goto(f"{taban}/{dil}/{SLUG['beniArayin'][dil]}/")
                adacik_hazir("[data-demo-form=beni-arayin]")
                harita_bekle(sayfa)
                ba = sayfa.locator("[data-demo-form=beni-arayin]")
                if ba.locator("textarea, input[type=email], input[type=tel], input[type=text]:not(:disabled)").count():
                    hatalar.append(f"{dil}/beni arayın: serbest metin / iletişim alanı açık")
                if sayfa.locator("[data-pilot-notu]").count() != 1:
                    hatalar.append(f"{dil}/beni arayın: DPIA / Müşavirlik onayı notu yok")
                if not sayfa.eval_on_selector("#ba-yas", "(e) => e.matches(':disabled')") or not ba.locator("[data-demo-gonder]").is_disabled():
                    hatalar.append(f"{dil}/beni arayın: rıza işaretlenmeden alanlar veya gönder düğmesi açık")
                depo0 = sayfa.evaluate(DEPOLAMA)
                sonraki.clear()
                ba.locator("[data-riza-onay]").check()
                ba.locator("[data-takma-ad=Deneb]").click()
                sayfa.select_option("#ba-yas", "1")
                sayfa.select_option("#ba-ilce", "liege")
                ba.locator("[data-cinsiyet=K]").click()
                sayfa.wait_for_timeout(200)
                if ag_istekleri():
                    hatalar.append(f"{dil}/beni arayın: form doldurulurken ağ isteği: {ag_istekleri()[:3]}")
                gonder_ve_denetle(f"{dil}/beni arayın", ba.locator("[data-demo-gonder]"))
                ipucu = sayfa.locator("[data-beni-arayin-haritasi] .leaflet-tooltip")
                if sayfa.locator("[data-isaret-durumu=var]").count() != 1 or ipucu.count() != 1 or "Deneb" not in ipucu.inner_text():
                    hatalar.append(f"{dil}/beni arayın: gönderimden sonra işaret kartı / ilçe düzeyinde harita işareti yok")
                sonraki.clear()
                ba.locator("[data-isaret-geri-cek]").click()
                sayfa.wait_for_timeout(400)
                if sayfa.locator("[data-isaret-durumu=yok] [data-geri-cekildi]").count() != 1 \
                        or ba.locator("[data-riza-onay]").is_checked() or ipucu.count() \
                        or ba.locator("[data-takma-ad] input:checked").count() or sayfa.input_value("#ba-ilce") != "":
                    hatalar.append(f"{dil}/beni arayın: «İşaretimi geri çek» durumu sıfırlamadı")
                if ag_istekleri():
                    hatalar.append(f"{dil}/beni arayın: geri çekmeden sonra ağ isteği: {ag_istekleri()[:3]}")
                if sayfa.evaluate(DEPOLAMA) != depo0:
                    hatalar.append(f"{dil}/beni arayın: form değerleri tarayıcı belleğine yazıldı")

                # Buluşma sonrası anket (Öneri 14): ad yok, serbest metin yok, bütün sorular isteğe bağlı
                sayfa.goto(f"{taban}/{dil}/{SLUG['anket'][dil]}/")
                adacik_hazir("[data-demo-form=anket]")
                an = sayfa.locator("[data-demo-form=anket]")
                if an.locator("textarea, input[type=text], input[type=email], input[type=tel]").count():
                    hatalar.append(f"{dil}/anket: ad veya serbest metin alanı var")
                if sayfa.locator("[data-anket-ad-yok]").count() != 1:
                    hatalar.append(f"{dil}/anket: «ad yazılmaz, isteğe bağlıdır» notu yok")
                sayfa.wait_for_load_state("networkidle")
                depo0 = sayfa.evaluate(DEPOLAMA)
                sonraki.clear()
                an.locator("[data-memnuniyet='5']").click()
                an.locator("[data-anket-soru=konu] [data-secenek='0']").click()
                an.locator("[data-anket-soru=dil] [data-secenek='1']").click()
                an.locator("[data-anket-soru=sure] [data-secenek='1']").click()
                an.locator("[data-istek='0']").click()
                an.locator("[data-istek='3']").click()
                an.locator("[data-anket-soru=tekrar] [data-secenek='0']").click()
                if an.locator("input:checked").count() != 7:
                    hatalar.append(f"{dil}/anket: seçimler işaretlenmedi ({an.locator('input:checked').count()}/7)")
                sayfa.wait_for_timeout(200)
                if ag_istekleri():
                    hatalar.append(f"{dil}/anket: doldurulurken ağ isteği: {ag_istekleri()[:3]}")
                gonder_ve_denetle(f"{dil}/anket", an.locator("[data-demo-gonder]"))
                an.locator("[data-anket-temizle]").click()
                sayfa.wait_for_timeout(150)
                if an.locator("input:checked").count():
                    hatalar.append(f"{dil}/anket: «Temizle» seçimleri sıfırlamadı")
                if ag_istekleri():
                    hatalar.append(f"{dil}/anket: temizledikten sonra ağ isteği: {ag_istekleri()[:3]}")
                if sayfa.evaluate(DEPOLAMA) != depo0:
                    hatalar.append(f"{dil}/anket: cevaplar tarayıcı belleğine yazıldı")

                sayfa.goto(f"{taban}/{dil}/{SLUG['dogrula'][dil]}/")
                adacik_hazir("[data-demo-form=dogrula]")
                sayfa.fill("#belge-no", "BE-2026-DEMO-0001")
                gonder_ve_denetle(f"{dil}/belge doğrula", sayfa.locator("[data-demo-form=dogrula] [data-demo-gonder]"), modal_bekle=False)
                if not sayfa.locator("[data-dogrulama-sonucu]").is_visible():
                    hatalar.append(f"{dil}/belge doğrula: örnek numara için «geçerli» kartı görünmedi")

            bag.close()

            # 3) 2. faz: panel ve personel uygulaması etkileşimleri (service worker engelli bağlam)
            for gen, yuk in GENISLIKLER:
                for dil in (DILLER if gen == 1280 else ["tr", "de"]):
                    panel_ve_uygulama(tarayici, taban, dil, gen, yuk, hatalar, sayac)

            # 3b) Önizleme uyarısının oturum davranışı
            uyari_senaryosu(tarayici, taban, taban_host, hatalar, sayac)

            # 4) PWA senaryosu (service worker'a izin verilen ayrı bağlam)
            pwa_senaryosu(pw, taban, hatalar, sayac)
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
