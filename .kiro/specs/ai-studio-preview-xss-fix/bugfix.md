# Bugfix Requirements Document

## Introduction

Terdapat celah keamanan DOM-based XSS pada fitur pratinjau (preview) AI Studio di CMS kustom v2. Handler `POST /api/v2/ai/article` (`src/app/api/v2/ai/article/route.ts`) mengembalikan objek `{ html, content }`. Nilai `html` diisi dari `stripCodeFence(raw)`, yaitu keluaran HTML mentah dari provider AI tanpa sanitasi apa pun. Hanya `content` (Lexical state) yang disaring melalui `htmlToLexicalState()`.

Di sisi klien, `src/app/v2-admin/ai-studio/ai-studio-client.tsx` merender variabel state `articleHtml` (di-set dari `data.html`) menggunakan `dangerouslySetInnerHTML` (sekitar baris 391). Sebuah komentar pada kode secara keliru menyatakan konten sudah disanitasi di server; kenyataannya field `html` tidak pernah disanitasi.

Karena keluaran AI adalah data eksternal yang tidak tepercaya, markup aktif (mis. `<img src=x onerror=alert(document.cookie)>` atau atribut event handler inline) dikirim apa adanya ke klien dan dieksekusi dalam konteks sesi admin yang terautentikasi. Dampaknya adalah eksekusi skrip arbitrer pada origin admin, berpotensi pencurian cookie sesi dan aksi atas nama admin.

Perbaikan yang diharapkan: HTML yang dirender di pratinjau harus tersanitasi menggunakan utilitas `sanitizeAiHtml()` yang sudah tersedia di `src/lib/ai/html-to-lexical.ts` (membuang tag berbahaya, atribut event handler `on*`, dan skema URL aktif `javascript:`/`data:`/`vbscript:`), idealnya di sisi server sebelum dikirim, sehingga konsisten dengan sanitasi yang sudah diterapkan pada `content` dan komentar pada kode menjadi benar.

## Bug Analysis

### Current Behavior (Defect)

Ketika provider AI mengembalikan HTML yang mengandung markup aktif, field `html` dikirim tanpa sanitasi dan dirender via `dangerouslySetInnerHTML`, sehingga skrip dieksekusi di konteks admin.

1.1 WHEN provider AI mengembalikan HTML yang mengandung tag berbahaya (mis. `<script>`, `<iframe>`, `<style>`) THEN handler `POST /api/v2/ai/article` mengembalikan field `html` yang masih memuat tag tersebut tanpa sanitasi
1.2 WHEN provider AI mengembalikan HTML dengan atribut event handler inline (mis. `onerror`, `onload`, `onclick`) THEN field `html` dikirim ke klien dengan atribut event handler tersebut utuh
1.3 WHEN provider AI mengembalikan HTML dengan skema URL aktif pada `href`/`src` (mis. `javascript:`, `data:`, `vbscript:`) THEN field `html` dikirim ke klien dengan URL aktif tersebut utuh
1.4 WHEN field `html` yang tidak tersanitasi dirender di pratinjau AI Studio via `dangerouslySetInnerHTML` THEN JavaScript berbahaya dieksekusi dalam konteks sesi admin yang terautentikasi

### Expected Behavior (Correct)

HTML yang dikembalikan untuk pratinjau harus tersanitasi di server menggunakan `sanitizeAiHtml()`, konsisten dengan sanitasi yang diterapkan pada `content`.

2.1 WHEN provider AI mengembalikan HTML yang mengandung tag berbahaya THEN handler `POST /api/v2/ai/article` SHALL mengembalikan field `html` yang sudah dibuang tag berbahayanya melalui `sanitizeAiHtml()`
2.2 WHEN provider AI mengembalikan HTML dengan atribut event handler inline THEN handler SHALL mengembalikan field `html` tanpa atribut event handler `on*`
2.3 WHEN provider AI mengembalikan HTML dengan skema URL aktif pada `href`/`src` THEN handler SHALL mengembalikan field `html` tanpa skema URL aktif (`javascript:`/`data:`/`vbscript:`)
2.4 WHEN field `html` hasil sanitasi dirender di pratinjau AI Studio via `dangerouslySetInnerHTML` THEN tidak ada JavaScript yang dieksekusi dan komentar pada kode klien SHALL secara akurat menyatakan bahwa konten sudah disanitasi di server

### Unchanged Behavior (Regression Prevention)

Konten yang aman dan alur normal harus tetap berfungsi seperti semula.

3.1 WHEN provider AI mengembalikan HTML yang aman (heading, paragraf, list, link `http`/`https` yang sah, teks terformat) THEN sistem SHALL CONTINUE TO menampilkan konten tersebut secara utuh di pratinjau
3.2 WHEN artikel dihasilkan THEN sistem SHALL CONTINUE TO mengembalikan field `content` (Lexical state) yang melewati `htmlToLexicalState()` dan `ensureCta()` seperti sebelumnya
3.3 WHEN pengguna menyimpan draft dari pratinjau THEN sistem SHALL CONTINUE TO menyimpan `content` yang sama tanpa perubahan perilaku
3.4 WHEN keluaran AI dibungkus dalam code fence ```` ```html ```` THEN sistem SHALL CONTINUE TO membuang code fence melalui `stripCodeFence()` sebelum diproses

## Bug Condition & Property

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ArticleHtmlOutput  // keluaran HTML mentah dari provider AI
  OUTPUT: boolean

  // True bila HTML memuat markup aktif yang berpotensi XSS.
  RETURN containsDangerousTag(X)
      OR containsInlineEventHandler(X)   // atribut on*
      OR containsActiveUrlScheme(X)      // javascript:/data:/vbscript:
END FUNCTION
```

### Property: Fix Checking

```pascal
// Untuk semua keluaran AI yang mengandung markup aktif,
// field `html` yang dikembalikan harus bersih dari markup aktif.
FOR ALL X WHERE isBugCondition(X) DO
  result ← POST_article'(X).html   // F' = handler setelah fix
  ASSERT NOT containsDangerousTag(result)
     AND NOT containsInlineEventHandler(result)
     AND NOT containsActiveUrlScheme(result)
END FOR
```

### Property: Preservation Checking

```pascal
// Untuk semua keluaran AI yang tidak mengandung markup aktif,
// perilaku handler setelah fix harus identik dengan sebelum fix.
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT POST_article(X) = POST_article'(X)
END FOR
```

**Definisi:**
- **F**: `POST /api/v2/ai/article` sebelum fix (field `html` = `stripCodeFence(raw)` tanpa sanitasi)
- **F'**: `POST /api/v2/ai/article` setelah fix (field `html` = `sanitizeAiHtml(stripCodeFence(raw))`)
- **Counterexample**: provider AI mengembalikan `<img src=x onerror=alert(document.cookie)>` → pratinjau AI Studio mengeksekusi `alert(document.cookie)` pada origin admin
