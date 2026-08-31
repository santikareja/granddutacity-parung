/**
 * Validator graf structured data — Fase 5 spec `seo-cannibalization-and-pseo`.
 *
 * Rich Results Test milik Google memvalidasi SYNTAX dan kelayakan rich result,
 * tetapi ia TIDAK memberi tahu bahwa sebuah `@id` menunjuk node yang tidak ada.
 * Justru itu cacat yang paling merusak di situs ini sebelum Fase 5: halaman
 * `/category/*` merujuk `.../#website` sementara node itu tidak pernah punya
 * `@id`, sehingga grafnya terputus tanpa satu pun error muncul di tool mana pun.
 *
 * Script ini menutup celah itu. Ia mengumpulkan seluruh `@id` yang DIDEFINISIKAN
 * lintas halaman, lalu memastikan setiap `@id` yang DIRUJUK ada di himpunan itu.
 *
 * WAJIB lewat Node, bukan PowerShell: Invoke-WebRequest di Windows PowerShell
 * 5.1 mendekode body sebagai Latin-1 dan merusak JSON non-ASCII.
 *
 * Pemakaian:
 *   node ./scripts/verify-schema.cjs http://localhost:3000 /  /galeri /cluster-ladera
 *   node ./scripts/verify-schema.cjs https://granddutacitysouthofjakarta.com / /galeri
 */

const [base, ...paths] = process.argv.slice(2);
if (!base || paths.length === 0) {
  console.error("Pemakaian: node ./scripts/verify-schema.cjs <base> <path> [path...]");
  process.exit(1);
}

const BLOCK_RE = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Tipe yang WAJIB ber-`@id`.
 *
 * Node struktural tanpa `@id` adalah entitas anonim: ia tidak bisa dirujuk,
 * dan bila halaman lain mendeskripsikan hal yang sama, Google melihat dua
 * entitas berbeda. Inilah cara `/lokasi-akses-*` sempat melahirkan kantor
 * pemasaran kedua dan lokasi proyek ketiga tanpa satu pun tool menandainya.
 *
 * `Offer`, `ListItem`, `Question`, `Answer`, `PropertyValue`,
 * `QuantitativeValue`, `PostalAddress`, dan sejenisnya SENGAJA tidak masuk:
 * mereka nilai/anggota daftar, bukan entitas yang perlu dirujuk lintas halaman.
 */
const MUST_HAVE_ID = new Set([
  "WebSite",
  "WebPage",
  "CollectionPage",
  "ContactPage",
  "ProfilePage",
  "ItemList",
  "BreadcrumbList",
  "FAQPage",
  "HowTo",
  "Dataset",
  "OfferCatalog",
  "ImageGallery",
  "Organization",
  "RealEstateAgent",
  "Person",
  "Residence",
  "SingleFamilyResidence",
]);

/**
 * `Place` SENGAJA tidak masuk `MUST_HAVE_ID`.
 *
 * `Place` dipakai untuk dua hal yang berbeda derajatnya: entitas kawasan
 * (`#project`, `#cluster-*`) yang wajib bisa dirujuk, dan nilai deskriptif
 * seperti `foundingLocation: { "@type": "Place", name: "Jakarta, Indonesia" }`
 * yang tidak perlu `@id` sama sekali. Mewajibkan `@id` untuk keduanya akan
 * memaksa kita mengarang identitas untuk sekadar nama kota.
 *
 * Yang benar-benar berbahaya adalah node anonim yang membawa ALAMAT atau
 * KOORDINAT: itu tandanya sebuah lokasi nyata dideskripsikan ulang tanpa
 * identitas, dan itulah yang melahirkan kantor pemasaran kedua di
 * `/lokasi-akses-*` serta lokasi proyek ketiga di `src/lib/articles.ts`.
 */
const hasLocationClaim = (node) =>
  Object.prototype.hasOwnProperty.call(node, "address") ||
  Object.prototype.hasOwnProperty.call(node, "geo");

const typeList = (t) => (Array.isArray(t) ? t : typeof t === "string" ? [t] : []);

/**
 * REFERENSI BERTIPE: node yang HANYA berisi `@type` + `@id`, tanpa properti lain.
 *
 * Bentuk ini adalah referensi, BUKAN definisi. Ia dipakai untuk rujukan lintas
 * halaman: node aslinya didefinisikan lengkap di halaman lain (mis. `#salesoffice`
 * di homepage), sementara halaman perujuk menyertakan `@type` agar konsumen yang
 * merayapi halaman itu sendirian tetap tahu jenis entitasnya.
 *
 * Alasannya konkret: Site Audit Semrush menandai `seller: {"@id": "..."}` polos
 * di `/pricelist` sebagai markup error justru karena tidak ada `@type`. Tapi
 * kalau `@type` ditambahkan dan script ini tetap menganggapnya definisi, ia akan
 * melaporkan "@id didefinisikan ulang dengan isi berbeda" — alarm palsu terhadap
 * perbaikan yang benar. Karena itu pembedaan ini harus eksplisit.
 */
const isTypedReference = (node, keys) =>
  keys.length === 2 &&
  Object.prototype.hasOwnProperty.call(node, "@type") &&
  Object.prototype.hasOwnProperty.call(node, "@id");

/** Kumpulkan @id yang didefinisikan (node punya @type) dan yang dirujuk. */
function collect(node, defined, referenced, anonymous, path) {
  if (Array.isArray(node)) {
    node.forEach((item) => collect(item, defined, referenced, anonymous, path));
    return;
  }
  if (!node || typeof node !== "object") return;

  const keys = Object.keys(node);
  const id = typeof node["@id"] === "string" ? node["@id"] : null;

  // Referensi bertipe dicatat sebagai RUJUKAN dan berhenti di sini — ia tidak
  // mendefinisikan apa pun, jadi tidak boleh masuk daftar definisi.
  if (id && isTypedReference(node, keys)) {
    referenced.push({ id, path });
    return;
  }

  if (node["@type"]) {
    if (id) {
      // Simpan SETIAP definisi, bukan hanya yang terakhir. Dua definisi dengan
      // `@id` sama tapi isi berbeda adalah cacat, dan Map biasa akan menimpanya
      // dalam sunyi.
      if (!defined.has(id)) defined.set(id, []);
      defined.get(id).push({
        type: node["@type"],
        path,
        // Sidik jari isi, urutan kunci dinormalkan supaya perbandingan stabil.
        fingerprint: JSON.stringify(node, Object.keys(node).sort()),
      });
    } else {
      for (const t of typeList(node["@type"])) {
        if (MUST_HAVE_ID.has(t)) {
          anonymous.push({ type: t, path });
        } else if (hasLocationClaim(node)) {
          anonymous.push({ type: `${t} (berklaim lokasi)`, path });
        }
      }
    }
  } else if (id && keys.length === 1) {
    // Node HANYA berisi @id adalah referensi murni.
    referenced.push({ id, path });
  }

  for (const key of keys) {
    if (key === "@id" || key === "@type" || key === "@context") continue;
    collect(node[key], defined, referenced, anonymous, path);
  }
}

(async () => {
  const defined = new Map();
  const referenced = [];
  const anonymous = [];
  const perPage = [];
  let parseErrors = 0;

  for (const path of paths) {
    const url = `${base}${path}`;
    const res = await fetch(url, { headers: { "user-agent": "gdc-schema-verify" } });
    const html = Buffer.from(await res.arrayBuffer()).toString("utf8");

    const blocks = [...html.matchAll(BLOCK_RE)].map((m) => m[1]);
    const types = new Set();

    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block);
        collect(parsed, defined, referenced, anonymous, path);
        const walkTypes = (n) => {
          if (Array.isArray(n)) return n.forEach(walkTypes);
          if (!n || typeof n !== "object") return;
          if (typeof n["@type"] === "string") types.add(n["@type"]);
          Object.values(n).forEach(walkTypes);
        };
        walkTypes(parsed);
      } catch (err) {
        parseErrors += 1;
        console.log(`  JSON TIDAK VALID di ${path}: ${err.message}`);
      }
    }

    perPage.push({ path, status: res.status, blocks: blocks.length, types: [...types].sort() });
  }

  console.log("=== Blok JSON-LD per halaman ===");
  for (const page of perPage) {
    console.log(`\n${page.path}  (HTTP ${page.status}, ${page.blocks} blok)`);
    console.log(`  @type: ${page.types.join(", ")}`);
  }

  console.log(`\n=== @id terdefinisi (${defined.size}) ===`);
  for (const [id, defs] of [...defined.entries()].sort()) {
    console.log(`  ${id}  [${defs[0].type}]`);
  }

  // Referensi menggantung
  const dangling = referenced.filter((r) => !defined.has(r.id));
  const unique = new Map();
  dangling.forEach((r) => {
    if (!unique.has(r.id)) unique.set(r.id, new Set());
    unique.get(r.id).add(r.path);
  });

  console.log(`\n=== Referensi @id (${referenced.length} total) ===`);
  if (unique.size === 0) {
    console.log("  Semua referensi menunjuk node yang benar-benar ada.");
  } else {
    for (const [id, pages] of unique.entries()) {
      console.log(`  MENGGANTUNG ${id}  (dirujuk di: ${[...pages].join(", ")})`);
    }
  }

  /**
   * Tipe yang HARUS hilang, beserta alasannya.
   *
   * Catatan penting soal `Offer`: ia TIDAK terlarang. `Offer` di dalam
   * `OfferCatalog` (halaman cluster & pricelist) dan di `makesOffer` milik
   * `RealEstateAgent` adalah pemakaian yang benar. Yang dilarang adalah
   * `Product` untuk rumah tapak beserta dua penanda merchant-listing yang
   * menyertainya. Demikian pula `CollectionPage` sah di `/category/*` — ia
   * hanya tidak boleh dipakai untuk HOMEPAGE.
   */
  const FORBIDDEN_EVERYWHERE = {
    Product: "rumah tapak tidak eligible merchant listing",
    SearchAction: "sitelinks searchbox diretire Google 21 Nov 2024",
    SiteNavigationElement: "bukan tipe yang didukung Google",
    OfferShippingDetails: "penanda merchant listing, tidak berlaku untuk rumah",
    MerchantReturnPolicy: "penanda merchant listing, tidak berlaku untuk rumah",
  };
  const FORBIDDEN_ON_HOMEPAGE = {
    CollectionPage: "homepage bukan halaman arsip",
    FAQPage: null, // sah di homepage — satu-satunya yang dipertahankan
  };

  const found = [];
  for (const page of perPage) {
    for (const [type, why] of Object.entries(FORBIDDEN_EVERYWHERE)) {
      if (page.types.includes(type)) found.push(`${page.path} -> ${type} (${why})`);
    }
    if (page.path === "/") {
      for (const [type, why] of Object.entries(FORBIDDEN_ON_HOMEPAGE)) {
        if (why && page.types.includes(type)) {
          found.push(`${page.path} -> ${type} (${why})`);
        }
      }
    }
  }

  console.log("\n=== Tipe yang seharusnya sudah dihapus ===");
  if (found.length === 0) {
    console.log("  Nol pelanggaran.");
    console.log("  (Offer di OfferCatalog/makesOffer dan CollectionPage di /category/* SAH.)");
  } else {
    found.forEach((line) => console.log(`  MASIH ADA ${line}`));
  }

  // Node yang didefinisikan LEBIH DARI SATU KALI dengan @id berbeda tapi
  // maksud sama adalah cacat yang paling sulit terlihat. Deteksi kasus paling
  // umum: @id yang hanya beda garis miring sebelum tanda pagar.
  const normalized = new Map();
  for (const id of defined.keys()) {
    const key = id.replace(/\/#/, "#");
    if (!normalized.has(key)) normalized.set(key, []);
    normalized.get(key).push(id);
  }
  const nearDuplicates = [...normalized.values()].filter((ids) => ids.length > 1);

  console.log("\n=== @id kembar (beda hanya garis miring) ===");
  if (nearDuplicates.length === 0) {
    console.log("  Nol. Tidak ada entitas yang terpecah karena beda format @id.");
  } else {
    nearDuplicates.forEach((ids) =>
      console.log(`  TERPECAH: ${ids.join("  vs  ")}`),
    );
  }

  /**
   * Satu `@id` yang DIDEFINISIKAN dua kali dengan isi BERBEDA.
   *
   * Ini cacat yang lolos dari semua tool: `/artikel` sempat mendeklarasikan
   * `#itemlist` dua kali (sekali berisi `ListItem`, sekali berisi `BlogPosting`)
   * dan `/kontak` mendeklarasikan ulang `#organization` dengan versi tipis.
   * Google bebas memilih salah satu, jadi hasilnya tidak bisa diprediksi.
   *
   * Definisi berulang dengan isi IDENTIK dianggap sah: node global di layout
   * memang tayang di setiap halaman.
   */
  const redefined = [];
  for (const [id, defs] of defined.entries()) {
    const distinct = new Set(defs.map((d) => d.fingerprint));
    if (distinct.size > 1) {
      redefined.push(`${id}  (versi berbeda di: ${defs.map((d) => d.path).join(", ")})`);
    }
  }

  console.log("\n=== @id didefinisikan ulang dengan isi berbeda ===");
  if (redefined.length === 0) {
    console.log("  Nol. Setiap @id punya tepat satu deskripsi.");
  } else {
    redefined.forEach((line) => console.log(`  BENTROK ${line}`));
  }

  const anonUnique = new Map();
  anonymous.forEach((a) => {
    const key = `${a.path} -> ${a.type}`;
    anonUnique.set(key, (anonUnique.get(key) ?? 0) + 1);
  });

  console.log("\n=== Entitas struktural tanpa @id ===");
  if (anonUnique.size === 0) {
    console.log("  Nol. Semua node struktural bisa dirujuk.");
  } else {
    for (const [key, count] of anonUnique.entries()) {
      console.log(`  ANONIM ${key}${count > 1 ? ` x${count}` : ""}`);
    }
  }

  /**
   * Desain Fase 5: SATU `@graph` per halaman. Blok kedua yang diizinkan hanya
   * node global dari layout, jadi batasnya 2. Lebih dari itu berarti ada
   * halaman yang kembali mengemit blok lepas.
   */
  const MAX_BLOCKS = 2;
  const tooManyBlocks = perPage.filter((p) => p.blocks > MAX_BLOCKS);

  console.log(`\n=== Jumlah blok JSON-LD (maks ${MAX_BLOCKS}) ===`);
  if (tooManyBlocks.length === 0) {
    console.log("  Nol pelanggaran. Setiap halaman satu @graph + node global layout.");
  } else {
    tooManyBlocks.forEach((p) =>
      console.log(`  TERPECAH ${p.path} -> ${p.blocks} blok`),
    );
  }

  const gagal =
    unique.size > 0 ||
    parseErrors > 0 ||
    found.length > 0 ||
    nearDuplicates.length > 0 ||
    redefined.length > 0 ||
    anonUnique.size > 0 ||
    tooManyBlocks.length > 0;
  console.log(gagal ? "\nGAGAL." : "\nLOLOS.");
  process.exit(gagal ? 2 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
