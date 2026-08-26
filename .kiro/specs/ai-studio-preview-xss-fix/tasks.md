# Rencana Implementasi

Rencana ini mengikuti alur bugfix eksploratif: tulis test SEBELUM fix untuk membuktikan bug (Bug Condition), tulis test untuk perilaku yang harus dipertahankan (Preservation), baru terapkan fix, lalu validasi. Setiap task mereferensikan requirement di `bugfix.md` dan properti/section di `design.md`.

- [x] 1. Siapkan infrastruktur pengujian
  - Proyek belum memiliki test runner; pasang Vitest sebagai devDependency (mendukung TypeScript + ESM Next.js) beserta script `"test": "vitest --run"` di `package.json`
  - Sediakan helper mock untuk `chatCompletion` (`@/lib/ai/client`) agar keluaran provider AI dapat dikontrol dalam test handler
  - Sediakan helper mock/bypass untuk `requireApiUser` (`@/lib/v2-auth/api-guard`) dan `resolveAiConfigWithModel` (`@/lib/v2-admin/ai-runtime`) agar handler `POST /api/v2/ai/article` dapat dipanggil tanpa dependensi eksternal
  - Buat direktori test untuk handler, mis. `src/app/api/v2/ai/article/__tests__/route.test.ts`
  - **CATATAN**: Jalankan test lewat `npm run test` (mode single-run, bukan watch)
  - _Design: Testing Strategy → Validation Approach_

- [x] 2. Tulis test eksplorasi bug condition (SEBELUM fix)
  - **Property 1: Bug Condition** - Field `html` Pratinjau Tersanitasi
  - **CRITICAL**: Test ini HARUS GAGAL pada kode yang belum diperbaiki — kegagalan mengonfirmasi bug memang ada
  - **DO NOT** memperbaiki test atau kode saat test gagal pada tahap ini
  - **NOTE**: Test ini mengenkode Expected Behavior — ia akan memvalidasi fix ketika lolos setelah implementasi
  - **GOAL**: Memunculkan counterexample yang mendemonstrasikan bug (lihat design → Exploratory Bug Condition Checking)
  - **Scoped PBT Approach**: Untuk bug deterministik, batasi properti ke kasus gagal konkret berikut agar reproducible:
    - Tag berbahaya: mock `chatCompletion` mengembalikan `<script>fetch('/steal?c='+document.cookie)</script>` dan `<iframe src=...>` → assert field `html` respons TIDAK lagi memuat `<script>`/`<iframe>` (implementasi `containsDangerousTag`)
    - Atribut event handler inline: mock mengembalikan `<img src=x onerror=alert(document.cookie)>` → assert field `html` tidak memuat atribut `on*` (implementasi `containsInlineEventHandler`)
    - Skema URL aktif: mock mengembalikan `<a href="javascript:alert(1)">klik</a>` → assert field `html` tidak memuat skema `javascript:`/`data:`/`vbscript:` (implementasi `containsActiveUrlScheme`)
    - Edge kombinasi: mock mengembalikan campuran markup aktif + konten aman → assert bagian aktif dibuang sementara bagian aman utuh
  - Assertion mengikuti Property: Fix Checking di `bugfix.md` (`NOT containsDangerousTag AND NOT containsInlineEventHandler AND NOT containsActiveUrlScheme`)
  - Jalankan test pada kode yang BELUM diperbaiki
  - **EXPECTED OUTCOME**: Test GAGAL (benar — membuktikan field `html` = `stripCodeFence(raw)` tanpa sanitasi masih memuat markup aktif)
  - Dokumentasikan counterexample yang ditemukan (mis. "field `html` masih memuat `onerror=alert(document.cookie)`") untuk memahami root cause
  - Tandai task selesai ketika test ditulis, dijalankan, dan kegagalannya terdokumentasi
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Tulis test preservation (SEBELUM fix)
  - **Property 2: Preservation** - Konten Aman, `content`, dan Alur Normal Tidak Berubah
  - **IMPORTANT**: Ikuti metodologi observation-first — amati perilaku pada kode BELUM diperbaiki, catat output aktual, lalu tulis test yang mengasersi output tersebut
  - Property-based testing direkomendasikan untuk jaminan preservation yang lebih kuat lintas domain input HTML aman
  - Kasus uji (dari design → Preservation Checking & Testing Strategy):
    - **Kesetaraan `content`**: Amati `content` yang dihasilkan pada kode belum diperbaiki untuk beberapa HTML aman (heading, paragraf, list, tautan `http`/`https`), lalu assert `content` identik (mis. via serialisasi/snapshot) — `content` tetap `ensureCta(htmlToLexicalState(rawHtml))` dengan input mentah yang sama
    - **Konten aman utuh (modulo h1→h2)**: Assert heading, paragraf, list, dan tautan `http`/`https` yang sah tetap muncul di field `html`; perhitungkan normalisasi jinak `<h1>`→`<h2>` yang dilakukan `sanitizeAiHtml` sehingga tidak ada konten hilang, hanya level heading yang diselaraskan
    - **Alur simpan draft**: Assert menyimpan draft dari pratinjau tetap menyimpan `content` yang sama tanpa perubahan perilaku
    - **Code fence & error path**: Assert `stripCodeFence()` tetap membuang ```` ```html ... ``` ````; respons error tidak berubah (judul kosong → `apiError`, outline kosong → `apiError`, keluaran AI kosong → `502`, provider belum terkonfigurasi → `503`)
    - **PBT preservation**: Bangkitkan HTML aman acak (kombinasi heading, paragraf, list, tautan sah) dan verifikasi `content` tidak berubah serta konten aman tetap tampil
  - Jalankan test pada kode yang BELUM diperbaiki
  - **EXPECTED OUTCOME**: Test LOLOS (mengonfirmasi baseline perilaku yang harus dipertahankan)
  - Tandai task selesai ketika test ditulis, dijalankan, dan lolos pada kode belum diperbaiki
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Fix untuk XSS pada field `html` pratinjau AI Studio

  - [x] 4.1 Sanitasi field `html` di server pada handler artikel
    - File: `src/app/api/v2/ai/article/route.ts`, fungsi `POST`
    - Tambahkan impor: `import { sanitizeAiHtml } from "@/lib/ai/html-to-lexical";`
    - Ganti `const html = stripCodeFence(raw);` menjadi `const rawHtml = stripCodeFence(raw);`
    - Pertahankan cek kosong pada HTML mentah agar perilaku `502` tidak berubah: `if (!rawHtml) return apiError("AI menghasilkan artikel kosong.", 502);`
    - Jaga `content` identik: `const content = ensureCta(htmlToLexicalState(rawHtml));` (di-feed dari HTML mentah, bukan tersanitasi)
    - Sanitasi hanya field yang dikembalikan ke klien: `const html = sanitizeAiHtml(rawHtml);` lalu `return NextResponse.json({ html, content });`
    - Hasil efektif: `html = sanitizeAiHtml(stripCodeFence(raw))`, `content` tidak berubah
    - _Bug_Condition: isBugCondition(X) = containsDangerousTag(X) OR containsInlineEventHandler(X) OR containsActiveUrlScheme(X) (design → Bug Condition)_
    - _Expected_Behavior: field `html` bersih dari markup aktif; `content` dan path error tak berubah (design → Property 1, Fix Implementation File 1)_
    - _Preservation: Preservation Requirements (design) — `content` identik, konten aman utuh modulo h1→h2, alur simpan draft & stripCodeFence tetap_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Perbaiki komentar menyesatkan di klien AI Studio
    - File: `src/app/v2-admin/ai-studio/ai-studio-client.tsx` (komentar pada blok `dangerouslySetInnerHTML`, sekitar baris 389-391)
    - Ganti klaim keliru ("Konten dari AI sudah disanitasi di server (htmlToLexicalState membuang tag/atribut aktif)") dengan pernyataan akurat, mis.: "Field `html` sudah disanitasi di server dengan sanitizeAiHtml() (membuang tag/atribut aktif dan skema URL berbahaya) sebelum dirender di sini."
    - _Expected_Behavior: komentar klien secara akurat menyatakan sanitasi di server (design → Fix Implementation File 2)_
    - _Requirements: 2.4_

  - [x] 4.3 Verifikasi test eksplorasi bug condition kini LOLOS
    - **Property 1: Expected Behavior** - Field `html` Pratinjau Tersanitasi
    - **IMPORTANT**: Jalankan ulang test YANG SAMA dari task 2 — JANGAN menulis test baru
    - Test dari task 2 mengenkode Expected Behavior; ketika lolos, ia mengonfirmasi field `html` bersih dari markup aktif
    - **EXPECTED OUTCOME**: Test LOLOS (mengonfirmasi bug telah diperbaiki)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.4 Verifikasi test preservation tetap LOLOS
    - **Property 2: Preservation** - Konten Aman, `content`, dan Alur Normal Tidak Berubah
    - **IMPORTANT**: Jalankan ulang test YANG SAMA dari task 3 — JANGAN menulis test baru
    - **EXPECTED OUTCOME**: Test LOLOS (mengonfirmasi tidak ada regresi — `content` identik, konten aman utuh modulo h1→h2, alur simpan draft & error path tak berubah)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Tambahkan test unit, PBT, dan integrasi tambahan sesuai Testing Strategy
  - Unit: field `html` handler untuk tiap kategori bug condition (tag berbahaya, atribut `on*`, skema URL aktif) menghasilkan output bersih; HTML kosong tetap `502`; `<h1>` dinormalkan menjadi `<h2>` pada field `html`; `content` identik antara sebelum dan sesudah fix untuk input sama
  - PBT: bangkitkan HTML aman acak → `content` tidak berubah & konten aman tetap tampil; bangkitkan HTML dengan markup aktif acak → field `html` selalu bersih; verifikasi `sanitizeAiHtml` idempoten pada field `html` (mensanitasi output bersih tidak mengubahnya, modulo normalisasi heading)
  - Integrasi: alur penuh generate → pratinjau dengan keluaran AI berbahaya → pratinjau tidak mengeksekusi skrip; dengan keluaran aman → pratinjau menampilkan konten utuh dan draft dapat disimpan; komentar `ai-studio-client.tsx` selaras dengan perilaku aktual (divalidasi via review + render pratinjau aman)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [x] 6. Checkpoint - Pastikan semua test lolos
  - Jalankan seluruh test (`npm run test`) dan pastikan Fix Checking dan Preservation Checking lolos
  - Jalankan `npm run lint` untuk memastikan tidak ada error lint pada file yang diubah
  - Bila muncul pertanyaan atau ambiguitas, tanyakan ke pengguna
