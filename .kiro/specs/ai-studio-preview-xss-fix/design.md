# AI Studio Preview XSS Fix — Bugfix Design

## Overview

Bug ini adalah celah DOM-based XSS pada fitur pratinjau AI Studio di CMS v2. Handler `POST /api/v2/ai/article` (`src/app/api/v2/ai/article/route.ts`) mengembalikan objek `{ html, content }`. Field `html` diisi dari `stripCodeFence(raw)` — keluaran HTML mentah dari provider AI tanpa sanitasi — sementara `content` (Lexical state) dibangun ulang dari daftar node yang diizinkan sehingga aman secara konstruksi. Di klien, `src/app/v2-admin/ai-studio/ai-studio-client.tsx` merender `articleHtml` (di-set dari `data.html`) melalui `dangerouslySetInnerHTML`, sehingga markup aktif dari AI dieksekusi dalam konteks sesi admin yang terautentikasi.

Strategi perbaikan bersifat minimal dan fokus pada root cause: sanitasi field `html` di sisi server sebelum dikirim, menggunakan utilitas `sanitizeAiHtml()` yang sudah ada di `src/lib/ai/html-to-lexical.ts`. Sanitizer ini membuang tag berbahaya, atribut event handler `on*`, dan skema URL aktif (`javascript:`/`data:`/`vbscript:`). Field `content` tetap dihasilkan seperti semula (di-feed dari HTML mentah hasil `stripCodeFence`) agar tidak ada regresi. Komentar keliru pada klien diperbaiki agar akurat menyatakan bahwa `html` disanitasi di server. Sanitasi di server adalah pertahanan pada sumber (defense-in-depth pada boundary tempat data untrusted masuk sistem), konsisten dengan sanitasi yang sudah efektif berlaku pada `content`.

## Glossary

- **Bug_Condition (C)**: Kondisi yang memicu bug — keluaran HTML AI memuat markup aktif (tag berbahaya, atribut event handler `on*`, atau skema URL aktif) sehingga field `html` yang tidak tersanitasi dapat mengeksekusi skrip saat dirender di pratinjau.
- **Property (P)**: Perilaku yang diinginkan untuk input C — field `html` yang dikembalikan bersih dari markup aktif sehingga tidak ada JavaScript yang dieksekusi di pratinjau.
- **Preservation**: Perilaku yang harus tetap sama — konten aman tetap tampil utuh di pratinjau, field `content` (Lexical state) tetap identik, alur simpan draft tidak berubah, dan pembuangan code fence tetap berjalan.
- **`sanitizeAiHtml(html)`**: Utilitas di `src/lib/ai/html-to-lexical.ts` yang membuang tag berbahaya, atribut `on*`, dan skema URL aktif; juga menormalkan `<h1>` menjadi `<h2>`.
- **`stripCodeFence(raw)`**: Helper di `route.ts` yang membuang pembungkus ```` ```html ... ``` ```` dari keluaran model.
- **`htmlToLexicalState(html)`**: Konverter di `src/lib/v2-admin/html-to-lexical.ts` yang membangun Lexical state dari daftar blok yang diizinkan (aman secara konstruksi karena hanya node yang dikenali yang dipertahankan).
- **`ensureCta(state)`**: Helper di `src/lib/v2-admin/lexical.ts` yang menjamin blok CTA wajib pada konten.
- **F**: Handler `POST /api/v2/ai/article` sebelum fix (field `html` = `stripCodeFence(raw)` tanpa sanitasi).
- **F'**: Handler setelah fix (field `html` = `sanitizeAiHtml(stripCodeFence(raw))`; field `content` tidak berubah).

## Bug Details

### Bug Condition

Bug muncul ketika provider AI mengembalikan HTML yang memuat markup aktif. Field `html` di respons handler adalah keluaran mentah `stripCodeFence(raw)` yang tidak pernah melewati sanitasi apa pun, lalu dirender apa adanya di pratinjau melalui `dangerouslySetInnerHTML`. Penyebab langsungnya: handler tidak memanggil `sanitizeAiHtml()` pada field `html` (hanya `content` yang efektif tersaring lewat `htmlToLexicalState()`).

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type ArticleHtmlOutput  // keluaran HTML mentah dari provider AI (setelah stripCodeFence)
  OUTPUT: boolean

  // True bila HTML memuat markup aktif yang berpotensi XSS.
  RETURN containsDangerousTag(X)            // <script>, <iframe>, <style>, <object>, dll.
      OR containsInlineEventHandler(X)      // atribut on* (onerror, onload, onclick, ...)
      OR containsActiveUrlScheme(X)         // href/src dengan javascript:/data:/vbscript:
END FUNCTION
```

### Examples

- `<img src=x onerror=alert(document.cookie)>` → **Diharapkan**: atribut `onerror` dibuang, tidak ada eksekusi skrip. **Aktual (sebelum fix)**: `alert(document.cookie)` dieksekusi pada origin admin.
- `<script>fetch('/steal?c='+document.cookie)</script>` → **Diharapkan**: seluruh tag `<script>` dan isinya dibuang. **Aktual**: skrip dieksekusi, cookie sesi terkirim ke endpoint penyerang.
- `<a href="javascript:alert(1)">klik</a>` → **Diharapkan**: atribut `href` dengan skema `javascript:` dibuang. **Aktual**: navigasi/eksekusi skrip saat tautan diklik.
- `<h2>Judul</h2><p>Paragraf normal dengan <a href="https://contoh.id">tautan sah</a></p>` (edge case, aman) → **Diharapkan & Aktual**: tampil utuh tanpa perubahan yang relevan secara keamanan.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Konten AI yang aman (heading, paragraf, list, tautan `http`/`https` yang sah, teks terformat) tetap tampil utuh di pratinjau.
- Field `content` (Lexical state) tetap dihasilkan melalui `ensureCta(htmlToLexicalState(...))` dengan input yang sama seperti sebelumnya, sehingga byte-nya identik.
- Alur simpan draft dari pratinjau tetap menyimpan `content` yang sama tanpa perubahan perilaku.
- Pembuangan code fence ```` ```html ... ``` ```` melalui `stripCodeFence()` tetap berjalan sebelum pemrosesan.
- Respons error tetap sama: judul/outline kosong → `apiError`, keluaran AI kosong → `502`, provider belum terkonfigurasi → `503`.

**Scope:**
Semua input yang TIDAK memenuhi bug condition (tidak mengandung tag berbahaya, atribut `on*`, maupun skema URL aktif) harus tidak terpengaruh oleh fix ini pada aspek keamanan maupun tampilan konten. Ini mencakup:
- Klik mouse pada tombol dan interaksi UI pratinjau lainnya.
- Field `content` yang dikirim ke klien dan disimpan.
- HTML aman yang dirender di pratinjau.

**Catatan transformasi jinak yang disengaja:** `sanitizeAiHtml()` juga menormalkan `<h1>` menjadi `<h2>` (artikel tidak boleh punya h1 di body). Untuk input aman yang kebetulan memuat `<h1>`, field `html` pratinjau akan menampilkan `<h2>`. Ini adalah transformasi non-keamanan yang disengaja dan justru menyelaraskan pratinjau dengan `content` (yang sudah menurunkan h1 lewat jalur konversinya). Properti preservation di bawah didefinisikan modulo normalisasi jinak ini — tidak ada konten yang hilang, hanya level heading yang diselaraskan.

## Hypothesized Root Cause

Berdasarkan analisis bug dan pembacaan kode, penyebabnya sudah dapat dipastikan (bukan sekadar hipotesis lemah), namun didokumentasikan sebagai kandidat untuk transparansi:

1. **Field `html` tidak melewati sanitasi (penyebab utama)**: Di `route.ts`, `const html = stripCodeFence(raw)` dikembalikan langsung di `NextResponse.json({ html, content })`. Tidak ada pemanggilan `sanitizeAiHtml()` pada nilai ini. Inilah root cause.

2. **Asimetri penanganan `html` vs `content`**: Hanya `content` yang efektif tersaring karena `htmlToLexicalState()` membangun ulang state dari node yang diizinkan. Field `html` tidak mendapat perlakuan setara, menciptakan celah pada jalur pratinjau.

3. **Komentar kode yang menyesatkan**: Komentar di `ai-studio-client.tsx` (sekitar baris 389-391) menyatakan "Konten dari AI sudah disanitasi di server (htmlToLexicalState membuang tag/atribut aktif)". Klaim ini keliru untuk field `html`: `htmlToLexicalState` hanya memproses `content`, bukan `html` yang dirender via `dangerouslySetInnerHTML`. Komentar ini kemungkinan menjadi sumber asumsi keliru bahwa pratinjau sudah aman.

4. **Utilitas yang tepat sudah tersedia namun tidak dipakai pada jalur ini**: `sanitizeAiHtml()` sudah ada dan sudah teruji dipakai dalam jalur konversi Lexical (`htmlToArticleLexical`), tetapi belum dipanggil untuk field `html` yang dikirim ke pratinjau.

## Correctness Properties

Property 1: Bug Condition - Field `html` Pratinjau Tersanitasi

_For any_ keluaran AI di mana bug condition terpenuhi (`isBugCondition` mengembalikan `true`), handler `POST /api/v2/ai/article` yang sudah diperbaiki SHALL mengembalikan field `html` yang bersih dari markup aktif — tanpa tag berbahaya (`<script>`, `<iframe>`, `<style>`, dll.), tanpa atribut event handler `on*`, dan tanpa skema URL aktif (`javascript:`/`data:`/`vbscript:`) — sehingga tidak ada JavaScript yang dieksekusi saat field tersebut dirender di pratinjau via `dangerouslySetInnerHTML`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Konten Aman, `content`, dan Alur Normal Tidak Berubah

_For any_ keluaran AI di mana bug condition TIDAK terpenuhi (`isBugCondition` mengembalikan `false`), handler yang sudah diperbaiki SHALL menghasilkan hasil yang setara dengan handler asli — field `content` identik (tetap melewati `htmlToLexicalState()` dan `ensureCta()` dengan input yang sama), konten aman tetap tampil utuh di pratinjau (modulo normalisasi jinak `<h1>`→`<h2>`), alur simpan draft tidak berubah, dan `stripCodeFence()` tetap diterapkan lebih dulu.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Root cause sudah terkonfirmasi, sehingga perubahan bersifat minimal dan terarah.

**File 1**: `src/app/api/v2/ai/article/route.ts`

**Function**: `POST`

**Specific Changes**:
1. **Impor `sanitizeAiHtml`**: Tambahkan impor dari utilitas yang sudah ada.
   - `import { sanitizeAiHtml } from "@/lib/ai/html-to-lexical";`

2. **Pisahkan HTML mentah dari HTML pratinjau**: Pertahankan variabel mentah untuk `content`, dan buat variabel tersanitasi khusus untuk field `html` yang dikembalikan.
   - Ganti `const html = stripCodeFence(raw);` menjadi `const rawHtml = stripCodeFence(raw);`
   - Pemeriksaan kosong tetap pada HTML mentah agar perilaku `502` tidak berubah: `if (!rawHtml) return apiError("AI menghasilkan artikel kosong.", 502);`

3. **Jaga `content` seperti semula**: `content` tetap di-feed dari HTML mentah (bukan yang tersanitasi) agar byte-nya identik dengan sebelum fix.
   - `const content = ensureCta(htmlToLexicalState(rawHtml));`

4. **Sanitasi field `html` pratinjau**: Terapkan sanitasi hanya pada nilai yang dikembalikan ke klien.
   - `const html = sanitizeAiHtml(rawHtml);`
   - `return NextResponse.json({ html, content });`

Hasil akhir secara efektif: `html = sanitizeAiHtml(stripCodeFence(raw))`, sedangkan `content = ensureCta(htmlToLexicalState(stripCodeFence(raw)))` tidak berubah.

**File 2**: `src/app/v2-admin/ai-studio/ai-studio-client.tsx`

**Lokasi**: Komentar pada blok `dangerouslySetInnerHTML` (sekitar baris 389-391).

**Specific Changes**:
5. **Perbaiki komentar menyesatkan**: Ganti klaim keliru ("htmlToLexicalState membuang tag/atribut aktif") dengan pernyataan akurat bahwa field `html` disanitasi di server melalui `sanitizeAiHtml()` sebelum dikirim, mis.: "Field `html` sudah disanitasi di server dengan sanitizeAiHtml() (membuang tag/atribut aktif dan skema URL berbahaya) sebelum dirender di sini."

**Defense-in-depth (dipertimbangkan, di luar scope minimal):** Sanitasi tambahan di sisi klien atau penerapan Content-Security-Policy dapat memperkuat pertahanan. Namun perbaikan ini sengaja dijaga minimal dan fokus pada root cause (sanitasi di boundary server). Langkah defense-in-depth dapat menjadi tindak lanjut terpisah agar perubahan tetap kecil dan mudah diverifikasi.

## Testing Strategy

### Validation Approach

Strategi pengujian mengikuti dua fase: pertama, munculkan counterexample yang membuktikan bug pada kode yang BELUM diperbaiki (mengonfirmasi root cause); kedua, verifikasi bahwa fix bekerja benar (Fix Checking) dan tidak mengubah perilaku aman (Preservation Checking). Karena root cause berada pada level fungsi handler/utilitas, pengujian difokuskan pada nilai field `html` (dan `content`) yang dikembalikan handler untuk berbagai keluaran AI, dengan `chatCompletion` di-mock agar keluaran provider dapat dikontrol.

### Exploratory Bug Condition Checking

**Goal**: Memunculkan counterexample yang mendemonstrasikan bug SEBELUM fix diterapkan. Mengonfirmasi atau membantah analisis root cause. Bila terbantah, root cause perlu dihipotesiskan ulang.

**Test Plan**: Mock `chatCompletion` agar mengembalikan HTML yang memenuhi bug condition, panggil handler `POST /api/v2/ai/article`, lalu periksa field `html` pada respons. Jalankan pada kode yang BELUM diperbaiki untuk mengamati bahwa markup aktif masih ada.

**Test Cases**:
1. **Tag Berbahaya**: Provider mengembalikan `<script>...</script>` / `<iframe>` — assert field `html` masih memuat tag tersebut (akan gagal/terbukti buggy pada kode belum diperbaiki).
2. **Atribut Event Handler Inline**: Provider mengembalikan `<img src=x onerror=alert(1)>` — assert `onerror` masih ada (buggy pada kode belum diperbaiki).
3. **Skema URL Aktif**: Provider mengembalikan `<a href="javascript:alert(1)">x</a>` — assert `javascript:` masih ada (buggy pada kode belum diperbaiki).
4. **Edge — Kombinasi + Aman**: Provider mengembalikan campuran markup aktif dan konten aman — assert bagian aktif masih ada sementara bagian aman utuh (memetakan permukaan bug).

**Expected Counterexamples**:
- Field `html` yang dikembalikan masih memuat `<script>`/`<iframe>`, atribut `on*`, atau `href="javascript:..."`.
- Penyebab: handler tidak memanggil `sanitizeAiHtml()` pada field `html` (asimetri dengan `content`).

### Fix Checking

**Goal**: Memverifikasi bahwa untuk semua input yang memenuhi bug condition, field `html` hasil fix memenuhi properti yang diharapkan (bersih dari markup aktif).

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := POST_article_fixed(X).html   // F'
  ASSERT NOT containsDangerousTag(result)
     AND NOT containsInlineEventHandler(result)
     AND NOT containsActiveUrlScheme(result)
END FOR
```

### Preservation Checking

**Goal**: Memverifikasi bahwa untuk semua input yang TIDAK memenuhi bug condition, hasil handler setelah fix setara dengan sebelum fix (field `content` identik dan konten aman tetap tampil, modulo normalisasi `<h1>`→`<h2>`).

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT POST_article_original(X).content = POST_article_fixed(X).content
  ASSERT safeContentPreserved(POST_article_fixed(X).html)   // modulo h1→h2
END FOR
```

**Testing Approach**: Property-based testing direkomendasikan untuk Preservation Checking karena:
- Menghasilkan banyak kasus uji otomatis lintas domain input HTML aman.
- Menangkap edge case yang mungkin terlewat oleh unit test manual.
- Memberi jaminan kuat bahwa perilaku tidak berubah untuk semua input non-buggy.

**Test Plan**: Amati perilaku pada kode BELUM diperbaiki untuk input aman (field `content` dan tampilan `html`), lalu tulis test yang menangkap perilaku tersebut dan memastikannya bertahan setelah fix. Untuk `content`, bandingkan kesetaraan penuh terhadap input mentah yang sama.

**Test Cases**:
1. **Kesetaraan `content`**: Amati `content` yang dihasilkan pada kode belum diperbaiki untuk HTML aman, lalu verifikasi `content` tetap identik setelah fix (dibangun dari HTML mentah yang sama).
2. **Konten Aman Utuh**: Verifikasi heading, paragraf, list, dan tautan `http`/`https` yang sah tetap muncul di field `html` setelah sanitasi.
3. **Alur Simpan Draft**: Verifikasi menyimpan draft dari pratinjau tetap menyimpan `content` yang sama tanpa perubahan perilaku.
4. **Code Fence & Error Path**: Verifikasi `stripCodeFence()` tetap membuang ```` ```html ``` ````, dan respons error (judul kosong, outline kosong, AI kosong→502, provider→503) tidak berubah.

### Unit Tests

- Menguji field `html` handler untuk masing-masing kategori bug condition (tag berbahaya, atribut `on*`, skema URL aktif) menghasilkan output bersih.
- Menguji edge case: HTML kosong tetap menghasilkan `502`; `<h1>` dinormalkan menjadi `<h2>` pada field `html`.
- Menguji field `content` identik antara sebelum dan sesudah fix untuk input yang sama (via mock `chatCompletion` dan pembandingan snapshot/serialisasi).

### Property-Based Tests

- Membangkitkan HTML aman acak (kombinasi heading, paragraf, list, tautan sah) dan memverifikasi field `content` tidak berubah serta konten aman tetap tampil (preservation).
- Membangkitkan HTML yang disisipi markup aktif acak (tag berbahaya, atribut `on*`, skema URL aktif) dan memverifikasi field `html` selalu bersih dari markup aktif (fix checking).
- Menguji lintas banyak skenario bahwa `sanitizeAiHtml` idempoten pada field `html` (mensanitasi output yang sudah bersih tidak mengubahnya, modulo normalisasi heading).

### Integration Tests

- Menguji alur penuh generate artikel → pratinjau: dengan keluaran AI berbahaya, pratinjau tidak mengeksekusi skrip apa pun.
- Menguji dengan keluaran AI aman: pratinjau menampilkan konten utuh dan draft dapat disimpan seperti biasa.
- Menguji bahwa komentar pada `ai-studio-client.tsx` selaras dengan perilaku aktual (sanitasi di server) — divalidasi melalui review dan render pratinjau yang aman.
