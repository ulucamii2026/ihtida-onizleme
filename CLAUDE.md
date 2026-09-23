# İhtida Platformu — «Yeni Müslüman Rehberi» (önizleme)

Bu dosya `D:\app\ihtida-platform` altındaki bütün çalışmalar için bağlayıcıdır. Genel kurallar:
`C:\Users\ridva\.claude\CLAUDE.md`; mühtedi koordinatörlüğü kuralları: `D:\muhtedi-koordinatorlugu\CLAUDE.md`.
Yanıt dili Türkçedir, tam imlâ ile (ı ş ğ ü ö ç İ).

## 1. Amaç

- **Şimdi (1. + 2. faz):** Belçika Mühtedi Koordinatörlüğünün T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği
  ve Belçika Diyanet Vakfı'na (BDV) önereceği merkezî platformun **tıklanabilir önizlemesi**. Arka uç yok.
  1. faz: kamu sayfaları; 2. faz: rol değiştiricili personel paneli `/panel/` ve PWA personel uygulaması `/app/`.
  Sunum: 28 Eylül – 2 Ekim 2026.
- **Yayın (23 Eylül 2026, Rıdvan'ın isteğiyle açıldı):** herkese açık depo `ulucamii2026/ihtida-onizleme`
  (GitHub Free Pages için public), `main` → `.github/workflows/deploy.yml` → GitHub Pages (build_type=workflow),
  özel alan adı `ihtida.ulucamii.be` (`public/CNAME` + Pages API). DNS: bNamed (ulucamii.be, DNummer 651019)
  `ihtida` CNAME → `ulucamii2026.github.io.`; diğer kayıtlara dokunulmadı. Push:
  `T=$(gh auth token --user ulucamii2026); B64=$(printf 'x-access-token:%s' "$T" | base64 -w0); git -c http.extraheader="AUTHORIZATION: basic $B64" push`.
  Kimlik: «Ulu Camii Marche-en-Famenne <ulucamii2026@gmail.com>» (depo yerel `git config`).
- **Sonra:** Müşavirlik onayından sonra gerçek platform `ihtida.diyanet.be`. Pilot dernek hesaplarında
  (GitHub/Google `ulucamii2026`), veriler AB içinde **Google Cloud europe-west1 (Belçika)**. PWA öncelikli.
- Başlık (5 dil): Yeni Müslüman Rehberi · Guide du nouveau musulman · Gids voor nieuwe moslims ·
  Wegweiser für neue Muslime · New Muslim Guide.
- Kurum satırı: T.C. Brüksel Büyükelçiliği Sosyal İşler Müşavirliği · Belçika Diyanet Vakfı · Belçika Mühtedi Koordinatörlüğü.

## 2. Değişmez kurallar

1. **Gerçek veri yok.** Hiçbir form hiçbir yere gönderilmez; `fetch`/`action`/`localStorage` ile form verisi
   saklanmaz. Değerler yalnız bileşen belleğinde (`useState`) durur. Gönder düğmeleri yalnız
   «Önizleme: gönderim kapalı» penceresini (`src/islands/OnizlemeModal.tsx`) açar. Anahtar: `src/lib/onizleme.ts`.
2. **Ağ:** yalnız aynı kaynaktaki statik dosyalar + OpenStreetMap karoları (`tile.openstreetmap.org`).
   `Temel.astro` üretimde CSP koyar (`connect-src 'self'`, `form-action 'none'`). Google Fonts, analitik, CDN yok.
3. **Her sayfada** önizleme uyarısı (`src/components/OnizlemeBandi.astro`, dile göre çevrili) ve
   `<meta name="robots" content="noindex,nofollow">`; `public/robots.txt` her şeyi kapatır.
   Uyarı 24.09.2026'dan beri (Rıdvan) **açılış penceresidir**: `dialog[data-onizleme-bandi]`, oturumda bir kez
   (`sessionStorage` anahtarı `onizleme-uyarisi-goruldu`), «Anladım» / Esc / arka plan ile kapanır, kapatınca iz
   kalmaz. JavaScript kapalıysa aynı metin `<noscript>` sabit bandı (`[data-onizleme-noscript]`) olarak görünür.
   Uyarı hiçbir sayfadan kaldırılmaz; `public/app/sw.js` kabuğu değişince `SURUM` artırılır.
4. **Kişiler kurgusal:** yalnız «Sarah (kurgusal)» ve `M-DEMO-01…` kodları. Gerçek ad yok.
5. **Telefon numarası hiçbir yerde yok** (imam telefonu asla). İletişim = (kapalı) form + kurum adları.
6. **Vektör önce:** amblemler yalnız SVG (`public/amblem/`). Raster logo yasak.
7. **Kimlik renkleri:** Diyanet kırmızısı `#EE3434`, koyu kırmızı `#B8231F`, altın `#84754E`, gri `#808285`,
   metin `#2B2B2B`, BDV laciverti `#004878`. WCAG AA: metin/düğmede `#EE3434` ve `#808285` kullanılmaz →
   `#B8231F`, koyu altın `#6B5F3E`, koyu gri `#5C5E61`. Yazı tipleri yerel: Montserrat (başlık/arayüz),
   Source Serif 4 (gövde) — `public/fonts/` (woff2 alt küme, OFL).
8. **Beş dil birlikte:** TR · FR · NL · DE · EN. FR/NL Belçika kullanımı. Türkçe tam imlâ. Dinî içerik Sünnî/Hanefî,
   Diyanet ile uyumlu, ayet alıntısı yok. Terim: mühtedi / ihtida; «dönme» asla.
9. `D:\app\ulucamii-site` **salt okunur referanstır**; oradan kopyalanan tek dosya kamuya açık
   `public/data/belcika-camileri.json`.
10. Remote/push/DNS/yayın yalnız Rıdvan'ın açık isteğiyle ve yalnız dernek hesabıyla.

## 3. Komutlar

```bash
npm install
npm run dev            # geliştirme sunucusu
npm run check          # astro check (eksik çeviri anahtarı burada yakalanır)
npm run build          # astro check && astro build  → dist/
npm run preview        # http://localhost:4410
npm run test:onizleme  # py -3.14 scripts/onizleme-testi.py (önce build): 61 yol × 1280/390 px, panel/app etkileşimleri, PWA,
                       # 200 + açılış uyarısı + noindex + taşma yok + izinsiz istek yok + gönderimden sonra SIFIR ağ isteği;
                       # ekran görüntüleri cikti/ekran/ (en uzun kenar ≤1500 px)
npm run konum:uret     # cami konumlarını (yaklaşık, belediye merkezi) Nominatim'den bir kez üretir
npm run gorsel:kitap   # teklif kitabı/sunum ekran görüntüleri (dsf 2) → D:\muhtedi-koordinatorlugu\06_...\gorsel\
npm run pwa:ikon       # PWA PNG ikonları public/app/ikonlar/*.svg ana çizimden (Chrome ile) üretilir
```

## 4. Yapı

```
src/i18n/diller.ts       diller, sayfa anahtarları, yerelleştirilmiş slug'lar (SLUGLAR), yol()/varlik()
src/i18n/tr.ts           KAYNAK sözlük (as const) → tipler.ts `Sozluk` tipini türetir
src/i18n/{fr,nl,de,en}.ts `satisfies Sozluk` → eksik/fazla anahtar veya liste öğesi = derleme hatası
src/layouts/Temel.astro  <head>, noindex, CSP, önizleme bandı — BÜTÜN düzenlerin tabanı
src/layouts/Genel.astro  kamu düzeni: Temel + UstBilgi + main + Altbilgi
src/lib/gezinti.ts       kamu gezinti dizileri (UST_GEZINTI, ALT_GEZINTI, KUTUCUK_HEDEFLERI)
src/pages/index.astro    kök dil seçici (FR öne çıkar)
src/pages/[lang]/index.astro, [lang]/[sayfa].astro   tek yönlendirici → src/sayfalar/*.astro
src/sayfalar/            sayfa gövdeleri (AnaSayfa, Basvuru, IlkAdimlar, Camiler, KardesAile, Etkinlikler,
                         Dogrula, Aile, Iletisim, Gizlilik)
src/islands/             Preact adacıkları: BasvuruFormu, DemoFormu, KardesAileFormlari, CamiBulucu (Leaflet),
                         BelgeDogrula, OnizlemeDugmesi, OnizlemeModal
src/data/                camiler.ts (il/bölge dili türetimi; «mühtedi dostu cami» YALNIZ kurgusal örnek kartta —
                         gerçek camiye asla bağlanmaz, Rıdvan 23 Eylül 2026), camiler-konum.json,
                         etkinlikler.ts (kurgusal etkinlikler + örnek belge BE-2026-DEMO-0001),
                         ornek-dosyalar.ts (2. faz: M-DEMO-01…12, rol etiketli personel, görevler, saha sayımı)
src/i18n/panel/          panel + uygulama sözlüğü: tr.ts KAYNAK (`panelTr`), fr/nl/de/en `satisfies PanelSozluk`
src/islands/panel/       PanelUygulamasi (rol değiştirici + veri en aza indirme şeridi), Musavirlik, Koordinator,
                         BolgeSorumlusu, DinGorevlisi, KisiselAlan, ortak.tsx (tarih, KisiAdi, ikonlar)
src/islands/app/         PersonelUygulamasi (alt gezinti: Bildirimler · Onay · Takip · Sayım · Görevler · Kaynaklar)
src/lib/                 dosyalar.ts (kurgusal dosya durumu + localStorage değişiklikleri), yerelDurum.ts
src/layouts/Panel.astro, Uygulama.astro   Temel.astro üzerine; Uygulama manifest + SW kaydı ekler
src/pages/panel/, src/pages/app/          /panel/ (TR) + /panel/{fr,nl,de,en}/, /app/ (TR) + /app/{dil}/
public/manifest.webmanifest, public/app/sw.js (kapsam /app/, yalnız çevrim dışı kabuk önbelleği), public/app/ikonlar/
public/                  CNAME, robots.txt, favicon.svg, fonts/, amblem/, data/belcika-camileri.json
.github/workflows/deploy.yml  GitHub Pages (çalıştırılmadı)
```

Yeni kamu sayfası: `SAYFALAR` + `SLUGLAR` (diller.ts) → `tr.ts` bölümü (+ 4 dil) → `src/sayfalar/X.astro`
→ `[sayfa].astro` içindeki `BILESENLER`.

## 5. 2. faz (23 Eylül 2026'da yapıldı) ve kuralları

- **Kişiler:** yalnız `src/data/ornek-dosyalar.ts`; sıradan ön ad + baş harf, arayüzde her zaman «kurgusal».
  M-DEMO-05 **kodlu kayıt** (aile baskısı örneği): adı hiçbir rolde görünmez (test denetler).
  Personel yalnız rol etiketiyle («Din görevlisi (Namur)»); camiler «şehir · örnek cami» (gerçek cami adı yok).
- **Veri en aza indirme görünür:** her rolde «gördüğü / görmediği alanlar» şeridi (`GORUNUR` tablosu,
  PanelUygulamasi.tsx). Din görevlisi yalnız kendi camisini ve ad/dil/iletişim tercihini görür; tam dosya
  yalnız Müşavirlik; saha sayımı yalnız toplu sayı (yıl, cinsiyet, dil).
- **Serbest metin alanı yok** (panel/uygulama): gerçek bilgi yazılamasın diye yalnız seçim/işaret/hazır yanıt.
  Gösterim durumu (verilen örnek Belge No, işaretler, görevler) yalnız localStorage `ihtida-onizleme:*`;
  «Önizleme verisini sıfırla» düğmesi siler. Uygulamada «Tören yapıldı» → paneldeki Müşavirlik kuyruğu.
- Tarihler bugüne göre gün farkıyla tutulur (sunum hangi gün yapılırsa yapılsın «yarın» doğru kalır).
- **PWA:** manifest yalnız /app/ sayfalarında bağlanır; SW `public/app/sw.js` kapsamı `/app/`, kurulumda /app/
  kabuğunu ve başvurduğu `/_astro/` dosyalarını önbelleğe alır; push/senkron yok. Kamu sayfaları SW denetiminde değil.
  İkon ana çizimi `public/app/ikonlar/ikon.svg` (= `public/favicon.svg`; 23 Eylül'de hilal düzeltildi — eski
  path sıfır alanlıydı, yalnız yıldız görünüyordu).

### Eski notlar — 2. faz uzatma noktaları

- **Personel paneli `/panel/`** (rol değiştiricili: din görevlisi, koordinatör, Müşavirlik, kardeş aile) ve
  **PWA personel uygulaması `/app/`**: `src/pages/panel/**` ve `src/pages/app/**` altına, `[lang]` dışında.
  Kendi düzenlerini `src/layouts/Panel.astro` / `Uygulama.astro` olarak **Temel.astro üzerine** kurarlar
  (önizleme uyarısı + noindex + CSP otomatik gelir); `Genel.astro` kamuya aittir, değiştirilmez.
- Panel metinleri için `tr.ts`'e `panel: {...}` bölümü eklenir; dört dil aynı anda doldurulmazsa build düşer.
- Gezinti: `src/lib/gezinti.ts` içine `PANEL_GEZINTI` / `APP_GEZINTI` eklenir.
- Örnek kayıtlar yalnız `M-DEMO-01…` kodlu ve kurgusal; `src/data/` altında ayrı dosyada.
- PWA: `public/manifest.webmanifest` + service worker yalnız `/app/` kapsamıyla; önizlemede ağ isteği kuralı sürer
  (test betiği service worker'ı engeller — PWA testine ayrı senaryo eklenmeli).
- Gerçek arka uç (Firebase/Firestore europe-west1) ancak Müşavirlik onayından sonra; o zaman `ONIZLEME` kilidi,
  CSP `connect-src` ve gönder işleyicileri birlikte değişir.

## 6. Kaynaklar

- Yazı tipleri ve amblemler: `D:\muhtedi-koordinatorlugu\06_Yazisma_ve_Iletisim\2026-09-28_Kurumsal-Teklif-Kitabi\`
  (`araclar\fonts\`, `gorsel\amblem\`; `diyanet-logotype.svg` svgo ile küçültüldü, görsel eşdeğerlik denetlendi).
  Amblem kullanım izni Müşavirlik/BDV'den teyit edilecek.
- İlk Adımlar ders başlıkları: `D:\muhtedi-koordinatorlugu\04_Egitim_Materyalleri\Ilk_Adimlar\MENTOR-VE-URETIM.md`
  (12 haftalık iskelet). Özetler bu proje için yazıldı; din görevlisi incelemesi bekliyor.
- Başvuru adımları: `D:\app\ulucamii-site\src\i18n\ihtida-adimlari.ts` ve `src\i18n\formlar\*.ts` okunarak yeniden yazıldı.
- Cami verisi: BDV / BİF resmî dizinleri (ulucamii-site, 9 Eylül 2026); konumlar © OpenStreetMap (ODbL).
