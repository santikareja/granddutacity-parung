const SITE_URL = "https://granddutacitysouthofjakarta.com";

export type ArticleSortKey = "rekomendasi" | "terbaru" | "populer";

export type ArticleCategorySlug =
  | "panduan-properti"
  | "kawasan"
  | "seputar-gdc";

export type ArticleTagSlug =
  | "agen"
  | "pemasaran"
  | "agen-properti"
  | "update-stok"
  | "siteplan"
  | "cluster-cascada"
  | "cluster-ladera"
  | "kpr-rumah"
  | "cara-beli-rumah"
  | "dokumen-kpr"
  | "lokasi-parung"
  | "akses-jakarta"
  | "fasilitas-sekitar";

export type ArticleAuthorSlug = "santika-reza";

type BaseStructuredValue = {
  "@type": string;
  [key: string]: unknown;
};

export type EditorialLink = {
  label: string;
  href: string;
};

export type ArticleCategoryDefinition = {
  slug: ArticleCategorySlug;
  name: string;
  shortName: string;
  description: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  openGraphTitle: string;
  openGraphDescription: string;
  imagePublicId: string;
  eyebrow: string;
  trustTitle: string;
  trustBody: string;
  featuredLabel: string;
  sectionNote: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: EditorialLink;
  ctaSecondary?: EditorialLink;
  ctaPlacement: "bottom" | "middle" | "both";
  relatedCategories: ArticleCategorySlug[];
  about: BaseStructuredValue;
  sitemapPriority: number;
  featuredStrategy?: "rekomendasi" | "terbaru";
};

export type ArticleTagDefinition = {
  slug: ArticleTagSlug;
  name: string;
  description: string;
  intro: string;
};

export type ArticleAuthorDefinition = {
  slug: ArticleAuthorSlug;
  name: string;
  role: string;
  shortBio: string;
  fullBio: string;
  description: string;
  imagePublicId: string;
  knowsAbout: string[];
  sameAs: string[];
  linkedinUrl: string;
  muckrackUrl: string;
  websiteUrl: string;
};

export type ArticleArchiveEntry = {
  id: string;
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  description: string;
  category: string;
  categorySlug: ArticleCategorySlug;
  authorSlug: ArticleAuthorSlug;
  tags: ArticleTagSlug[];
  coverImage: string;
  coverAlt: string;
  updatedAt: string;
  updatedLabel: string;
  readingTime: string;
  featured?: boolean;
  popularityRank: number;
  recommendationRank: number;
  searchTerms: string[];
};

export const CATEGORY_PAGE_SIZE = 9;
export const TAG_PAGE_SIZE = 9;

export const SORT_LABELS: Record<ArticleSortKey, string> = {
  rekomendasi: "Rekomendasi",
  terbaru: "Terbaru",
  populer: "Populer",
};

export const articleCategoryDefinitions: Record<
  ArticleCategorySlug,
  ArticleCategoryDefinition
> = {
  "panduan-properti": {
    slug: "panduan-properti",
    name: "Panduan Properti",
    shortName: "Panduan",
    description:
      "Panduan properti lengkap untuk pembeli rumah: cara membeli rumah, KPR, investasi, dan desain hunian.",
    intro:
      "Membeli rumah adalah keputusan finansial terbesar dalam hidup. Namun banyak calon pembeli yang masih bingung soal proses KPR, kelengkapan dokumen, hingga memilih lokasi yang tepat. Di sini kami mengumpulkan panduan properti lengkap yang ditulis untuk membantu Anda memahami setiap tahap, dari riset awal, proses pembiayaan, hingga serah terima kunci. Semua artikel dikurasi tim Grand Duta City berdasarkan pengalaman nyata di lapangan dan pertanyaan paling umum dari calon pembeli.",
    // Brand tag menggantung dicabut (68 -> 50 karakter) dan frasa
    // "Grand Duta City South of Jakarta" diganti agar tidak bersaing dengan
    // homepage. metaDescription dipendekkan dari 193 ke rentang 120-160.
    metaTitle:
      "Panduan Properti: Tips Beli Rumah, KPR & Investasi",
    metaDescription:
      "Panduan properti untuk pembeli rumah pertama: langkah membeli, tips lolos KPR, membaca dokumen, strategi investasi, dan pertimbangan desain hunian keluarga.",
    openGraphTitle: "Panduan Properti: Tips Beli Rumah, KPR & Investasi",
    openGraphDescription:
      "Panduan properti lengkap: cara beli rumah, KPR, investasi, dan desain hunian dari Grand Duta City.",
    imagePublicId: "v1776105396/Panduan_Properti_bg5b0y.webp",
    eyebrow: "Editorial Section / Panduan Properti",
    trustTitle: "Ditulis untuk membantu keputusan yang tenang",
    trustBody:
      "Setiap artikel di section ini merangkum proses, risiko, dan istilah penting yang paling sering membuat calon pembeli ragu sebelum booking unit.",
    featuredLabel: "Panduan pilihan editor",
    sectionNote:
      "Gunakan section ini untuk memahami proses beli rumah dengan bahasa yang lebih jernih, bukan jargon pemasaran.",
    ctaTitle: "Cari rumah di Grand Duta City?",
    ctaBody:
      "Jika Anda sudah memahami skema pembelian, lanjutkan dengan melihat unit, harga terbaru, dan simulasi langkah berikutnya.",
    ctaPrimary: {
      label: "Lihat Pricelist Terbaru",
      href: "/pricelist-grand-duta-city",
    },
    ctaSecondary: {
      label: "Hubungi Marketing",
      href: "/kontak",
    },
    ctaPlacement: "bottom",
    relatedCategories: ["kawasan", "seputar-gdc"],
    about: {
      "@type": "Thing",
      name: "Panduan Properti Indonesia",
    },
    sitemapPriority: 0.7,
    featuredStrategy: "rekomendasi",
  },
  kawasan: {
    slug: "kawasan",
    name: "Kawasan",
    shortName: "Kawasan",
    description:
      "Ulasan kawasan perumahan di area Parung, Bogor Selatan, dan sekitarnya: akses, infrastruktur, dan fasilitas.",
    intro:
      "Lokasi adalah faktor paling menentukan dalam memilih properti. Bukan hanya soal jarak ke pusat kota, tapi juga soal kemudahan akses, fasilitas sekitar, risiko banjir, dan potensi pertumbuhan kawasan ke depan. Artikel di kategori ini membahas kawasan-kawasan properti yang sedang berkembang di area Parung, Bogor Selatan, dan sekitarnya, termasuk ulasan infrastruktur, akses tol, ketersediaan sekolah dan rumah sakit, serta tren harga tanah per kawasan. Cocok dibaca sebelum Anda memutuskan di mana akan membeli hunian.",
    // Brand tag menggantung dicabut (75 -> 50 karakter).
    // metaDescription dipendekkan dari 180 ke rentang 120-160.
    metaTitle:
      "Ulasan Kawasan Properti Parung, Bogor & Sekitarnya",
    metaDescription:
      "Ulasan kawasan perumahan di Parung dan Bogor Selatan: akses jalan, exit tol terdekat, infrastruktur, fasilitas umum, dan arah perkembangan kawasan ke depan.",
    openGraphTitle: "Kawasan Properti — Ulasan Area Parung & Bogor",
    openGraphDescription:
      "Ulasan kawasan, akses, dan perkembangan infrastruktur di Parung, Bogor Selatan dan sekitarnya.",
    imagePublicId: "v1776105396/Lokasi_Kawasan_rzduuw.webp",
    eyebrow: "Editorial Section / Kawasan",
    trustTitle: "Membantu Anda menilai kawasan sebelum survei",
    trustBody:
      "Fokus editorialnya bukan sekadar dekat atau jauh, tetapi bagaimana mobilitas, fasilitas, dan potensi kawasan memengaruhi kenyamanan harian Anda.",
    featuredLabel: "Ulasan kawasan terpilih",
    sectionNote:
      "Section ini relevan untuk pembeli yang ingin membandingkan akses, fasilitas publik, dan konteks kawasan sebelum mengunjungi lokasi.",
    ctaTitle: "Lihat akses dan konteks kawasan GDC",
    ctaBody:
      "Baca detail lokasi, jalur akses, dan titik penting sekitar Grand Duta City untuk menilai apakah rute hariannya sesuai kebutuhan Anda.",
    ctaPrimary: {
      label: "Lihat Akses & Lokasi GDC",
      href: "/lokasi-akses-grand-duta-city-parung",
    },
    ctaSecondary: {
      label: "Konsultasikan Kebutuhan",
      href: "/kontak",
    },
    ctaPlacement: "middle",
    relatedCategories: ["panduan-properti", "seputar-gdc"],
    // Sebelumnya `"@type": "Place"` TANPA `@id` tapi MEMBAWA alamat. Node
    // lokasi anonim beralamat adalah cara paling mudah memecah entitas: Google
    // melihat sebuah tempat di Parung yang tidak pernah dihubungkan ke
    // `#project`, dan tidak jelas apakah maksudnya kawasan proyek atau
    // kecamatannya. Kini eksplisit: ini WILAYAH ADMINISTRATIF Parung, entitas
    // yang memang berbeda dari kawasan proyek, dan punya `@id` sendiri.
    about: {
      "@type": "AdministrativeArea",
      "@id": `${SITE_URL}/#area-parung`,
      name: "Parung, Bogor, Jawa Barat",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Parung",
        addressRegion: "Bogor",
        addressCountry: "ID",
      },
    },
    sitemapPriority: 0.75,
    featuredStrategy: "rekomendasi",
  },
  "seputar-gdc": {
    slug: "seputar-gdc",
    name: "Seputar GDC",
    shortName: "Seputar GDC",
    description:
      "Informasi terbaru seputar Grand Duta City Parung: update stok unit, fasilitas, cluster Cascada dan Ladera.",
    intro:
      "Grand Duta City adalah perumahan premium di Parung, Bogor Selatan, yang dirancang untuk keluarga modern yang menginginkan hunian asri dengan fasilitas lengkap dan akses mudah ke Jakarta. Di sini kami mengumpulkan informasi terbaru seputar GDC: dari update ketersediaan unit, progres pembangunan cluster Cascada dan Ladera, fasilitas The Beach GDC, hingga panduan pembelian dan skema KPR yang tersedia. Semua informasi diperbarui langsung dari tim pemasaran Grand Duta City.",
    // Frasa "Grand Duta City Parung" dicabut dari metaTitle (63 -> 45
    // karakter) karena di sini ia hanya brand tag tanpa modifier pembeda.
    // metaDescription dipendekkan dari 164 ke rentang 120-160.
    metaTitle:
      "Seputar GDC: Update Stok, Fasilitas & Cluster",
    metaDescription:
      "Informasi terbaru seputar proyek GDC di Parung, Bogor Selatan: update stok unit per blok, fasilitas kawasan, serta progres Cluster Cascada dan Cluster Ladera.",
    openGraphTitle:
      "Seputar GDC — Informasi & Update Grand Duta City Terbaru",
    openGraphDescription:
      "Update stok unit, fasilitas, cluster Cascada & Ladera, dan berita terbaru Grand Duta City Parung.",
    imagePublicId: "v1776105396/Seputar_GDC_syygpl.webp",
    eyebrow: "Editorial Section / Seputar GDC",
    trustTitle: "Sumber resmi untuk perkembangan project",
    trustBody:
      "Section ini menempatkan pembaruan project, stok, dan konteks cluster dalam satu arsip yang lebih mudah dipercaya dan lebih mudah dipindai.",
    featuredLabel: "Update paling baru",
    sectionNote:
      "Jika Anda sedang mengecek progres kawasan atau stok unit, mulai dari artikel teratas lalu lanjutkan ke pricelist dan kontak marketing.",
    ctaTitle: "Cek langkah berikutnya untuk unit yang Anda incar",
    ctaBody:
      "Bandingkan harga terbaru, tanyakan stok aktual, dan minta bantuan tim marketing untuk menyaring unit yang paling relevan dengan kebutuhan keluarga Anda.",
    ctaPrimary: {
      label: "Cek Pricelist Terbaru",
      href: "/pricelist-grand-duta-city",
    },
    ctaSecondary: {
      label: "Hubungi Kami Sekarang",
      href: "/kontak",
    },
    ctaPlacement: "both",
    relatedCategories: ["panduan-properti", "kawasan"],
    about: {
      "@type": "RealEstateListing",
      name: "Grand Duta City South of Jakarta",
      description:
        "Perumahan premium di Parung, Bogor Selatan dengan fasilitas lengkap.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Parung",
        addressRegion: "Bogor",
        postalCode: "16330",
        addressCountry: "ID",
      },
    },
    sitemapPriority: 0.85,
    featuredStrategy: "terbaru",
  },
};

export const articleTagDefinitions: Record<ArticleTagSlug, ArticleTagDefinition> = {
  agen: {
    slug: "agen",
    name: "Agen",
    description:
      "Artikel yang membahas peran agen dalam transaksi properti serta cara menilai kualitas layanan agen.",
    intro:
      "Tag ini membantu Anda menemukan panduan memilih agen yang tepat sebelum membeli atau menjual properti.",
  },
  pemasaran: {
    slug: "pemasaran",
    name: "Pemasaran",
    description:
      "Artikel seputar strategi pemasaran properti, positioning listing, dan pendekatan promosi berbasis data.",
    intro:
      "Gunakan tag ini jika Anda ingin memahami bagaimana proses pemasaran properti berjalan lebih efektif.",
  },
  "agen-properti": {
    slug: "agen-properti",
    name: "Agen Properti",
    description:
      "Topik tentang standar profesional agen properti, etika kerja, serta praktik pendampingan klien yang aman.",
    intro:
      "Tag ini mengelompokkan artikel yang relevan untuk mengevaluasi kualitas agen properti sebelum bekerja sama.",
  },
  "update-stok": {
    slug: "update-stok",
    name: "Update Stok",
    description:
      "Artikel yang membahas perkembangan ketersediaan unit, ritme penjualan, dan pembaruan penting terkait stok rumah.",
    intro:
      "Tag ini mengumpulkan artikel yang relevan saat Anda sedang memantau momentum unit tersedia dan perubahan stok terbaru.",
  },
  siteplan: {
    slug: "siteplan",
    name: "Siteplan",
    description:
      "Artikel yang membantu Anda membaca siteplan kawasan, posisi blok, dan konteks tata letak cluster.",
    intro:
      "Gunakan tag ini ketika Anda ingin memahami posisi unit, pola cluster, dan gambaran siteplan sebelum survei lokasi.",
  },
  "cluster-cascada": {
    slug: "cluster-cascada",
    name: "Cluster Cascada",
    description:
      "Artikel yang menyinggung cluster Cascada, unit yang tersedia, dan konteks proyek di area tersebut.",
    intro:
      "Tag ini merangkum artikel yang berkaitan dengan Cluster Cascada agar Anda bisa menelusuri informasinya lebih cepat.",
  },
  "cluster-ladera": {
    slug: "cluster-ladera",
    name: "Cluster Ladera",
    description:
      "Artikel yang menyinggung cluster Ladera, sebaran unit, dan konteks pembelian di area tersebut.",
    intro:
      "Tag ini membantu Anda menelusuri artikel yang berkaitan langsung dengan Cluster Ladera tanpa harus menyaring manual.",
  },
  "kpr-rumah": {
    slug: "kpr-rumah",
    name: "KPR Rumah",
    description:
      "Topik KPR, simulasi pembiayaan, alur pengajuan, dan pertimbangan pembeli rumah pertama.",
    intro:
      "Tag ini relevan jika Anda sedang mencari gambaran pembiayaan rumah yang lebih praktis dan mudah diikuti.",
  },
  "cara-beli-rumah": {
    slug: "cara-beli-rumah",
    name: "Cara Beli Rumah",
    description:
      "Artikel langkah demi langkah yang membahas proses memilih unit, booking, dokumen, hingga akad.",
    intro:
      "Tag ini mengelompokkan panduan pembelian rumah agar Anda bisa membaca prosesnya secara runtut.",
  },
  "dokumen-kpr": {
    slug: "dokumen-kpr",
    name: "Dokumen KPR",
    description:
      "Artikel tentang persiapan dokumen, verifikasi bank, dan hal administratif yang memengaruhi proses KPR.",
    intro:
      "Gunakan tag ini ketika Anda ingin fokus pada persiapan dokumen agar proses KPR berjalan lebih lancar.",
  },
  "lokasi-parung": {
    slug: "lokasi-parung",
    name: "Lokasi Parung",
    description:
      "Artikel yang membahas konteks Parung, Bogor Selatan, dan pertimbangan lokasi untuk pembeli rumah.",
    intro:
      "Tag ini membantu Anda memahami konteks Parung sebagai kawasan tinggal, bukan hanya sebagai titik di peta.",
  },
  "akses-jakarta": {
    slug: "akses-jakarta",
    name: "Akses Jakarta",
    description:
      "Artikel yang menyorot mobilitas menuju Jakarta, Depok, atau Bogor dari kawasan Grand Duta City.",
    intro:
      "Tag ini berguna ketika waktu tempuh dan opsi akses menjadi faktor penting dalam keputusan membeli rumah.",
  },
  "fasilitas-sekitar": {
    slug: "fasilitas-sekitar",
    name: "Fasilitas Sekitar",
    description:
      "Artikel yang membahas sekolah, rumah sakit, titik belanja, dan fasilitas harian di sekitar kawasan.",
    intro:
      "Tag ini mengumpulkan artikel yang relevan untuk menilai kenyamanan hidup sehari-hari di sekitar kawasan.",
  },
};

export const articleAuthorDefinitions: Record<
  ArticleAuthorSlug,
  ArticleAuthorDefinition
> = {
  "santika-reza": {
    slug: "santika-reza",
    name: "Santika Reza",
    role: "Praktisi, Penulis, dan Marketing Properti",
    shortBio:
      "Santika Reza adalah praktisi marketing properti yang aktif menulis tentang panduan membeli rumah, KPR, dan perkembangan kawasan properti di Indonesia. Saat ini bergabung dengan tim Grand Duta City South of Jakarta.",
    fullBio:
      "Santika Reza adalah praktisi marketing properti yang aktif menulis untuk membantu calon pembeli memahami keputusan penting sebelum membeli rumah. Fokus tulisannya mencakup panduan membeli rumah pertama, proses KPR, dinamika kawasan Parung dan Bogor Selatan, hingga informasi terbaru seputar Grand Duta City. Setiap artikel disusun dari pengalaman lapangan, pertanyaan yang paling sering muncul saat konsultasi, serta riset terhadap kebutuhan pembeli yang ingin bergerak dengan lebih yakin. Pendekatannya sederhana: menjelaskan hal yang sering terasa rumit menjadi lebih mudah dipahami, tanpa membuat pembaca merasa digiring. Anda juga dapat mengenal profil dan karya lainnya melalui website pribadinya di santikareza.app.",
    description:
      "Santika Reza adalah praktisi dan penulis di bidang marketing properti, aktif di Grand Duta City South of Jakarta.",
    imagePublicId: "v1776109088/Santika_Reza_npjbvq.webp",
    knowsAbout: [
      "Marketing Properti",
      "KPR dan Pembiayaan Rumah",
      "Investasi Properti",
      "Perumahan Parung Bogor",
      "Grand Duta City",
    ],
    sameAs: [
      "https://www.linkedin.com/in/santikareja",
      "https://muckrack.com/santikareja",
      "https://santikareza.app",
    ],
    linkedinUrl: "https://www.linkedin.com/in/santikareja",
    muckrackUrl: "https://muckrack.com/santikareja",
    websiteUrl: "https://santikareza.app",
  },
};

/**
 * ANCHOR TEXT, BUKAN SEKADAR JUDUL KARTU.
 *
 * `title` dan `coverAlt` di daftar ini dirender sebagai teks tautan internal di
 * SETIAP halaman artikel: sidebar "Artikel Populer"/"Artikel Terbaru"/"Seputar
 * GDC", kartu "Artikel Terkait", navigasi sebelum/berikutnya, dan blok "Baca
 * juga" yang disuntikkan otomatis tiap tiga paragraf oleh
 * `injectReadAlsoNodes()`. Satu judul karena itu bisa tayang 5x per halaman
 * dikali 40 halaman artikel.
 *
 * Audit tautan internal (3 September 2026, crawl 66 URL sitemap; `alt` gambar
 * dihitung sebagai anchor text karena begitulah Google membacanya untuk tautan
 * bergambar) menemukan akibatnya:
 *
 *   tujuan                                       anchor bermuatan frasa brand
 *   /  (homepage)                                244 dari 66 halaman
 *   /cara-beli-kpr                               168 dari 40 halaman
 *   /update-stok-siteplan-grand-duta-city-parung  165 dari 40 halaman
 *   /lokasi-akses-grand-duta-city-parung          161 dari 42 halaman
 *
 * Homepage unggul tipis, padahal ia satu-satunya pemilik frasa itu: gabungan
 * tiga halaman di atas justru dua kali lipat lebih banyak. Untuk query
 * navigasional/brand, anchor text internal adalah salah satu sinyal terkuat soal
 * halaman mana pemilik sebuah nama. Selama tiga judul di bawah memuat
 * "Grand Duta City Parung" utuh, struktur internal situs membagi klaim itu ke
 * halaman lain — dan itu persis yang terjadi: dua halaman menyalip homepage di
 * query "grand duta city parung".
 *
 * Karena itu ketiganya memakai "GDC Parung" — varian yang sudah dipakai
 * `title` produksi halaman-halaman itu sendiri ("Lokasi GDC Parung: 4 Exit Tol
 * ke Jakarta & Depok", "Cara Beli Rumah GDC Parung: Alur KPR & Dokumen",
 * "Update Stok Unit & Siteplan GDC Parung 2026"), jadi ini justru MENYELARASKAN
 * anchor dengan judul halaman tujuan, bukan mengaburkannya.
 *
 * Guard G20 di `src/app/(site)/__tests__/seo-invariants.test.ts` menggagalkan
 * test bila frasa milik homepage kembali masuk ke `title` atau `coverAlt`.
 */
export const articleArchiveEntries: ArticleArchiveEntry[] = [
  {
    id: "10-ciri-agen-properti-terbaik",
    slug: "10-ciri-agen-properti-terbaik",
    href: "/10-ciri-agen-properti-terbaik",
    title: "10 Ciri Agen Properti Terbaik: Panduan Lengkap Memilih Mitra Jual Beli Rumah Anda",
    excerpt:
      "Panduan lengkap untuk menilai agen properti profesional di Indonesia melalui 10 kriteria utama, dari legalitas hingga kemampuan negosiasi.",
    description:
      "Temukan rahasia memilih agen properti terbaik untuk transaksi jual beli rumah Anda. Pelajari 10 ciri utama yang harus dimiliki agen profesional.",
    category: articleCategoryDefinitions["panduan-properti"].name,
    categorySlug: "panduan-properti",
    authorSlug: "santika-reza",
    tags: ["agen", "pemasaran", "agen-properti"],
    coverImage:
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776585039/10_Ciri_Agen_Properti_Terbaik_qnwhni.webp",
    coverAlt:
      "Ilustrasi panduan memilih agen properti terbaik untuk transaksi jual beli rumah",
    updatedAt: "2026-04-19",
    updatedLabel: "19 April 2026",
    readingTime: "8 menit baca",
    popularityRank: 4,
    recommendationRank: 4,
    searchTerms: [
      "agen properti terbaik",
      "ciri agen properti profesional",
      "memilih agen properti",
      "pemasaran properti",
      "legalitas agen properti",
      "panduan properti",
    ],
  },
  {
    id: "update-stok-siteplan-grand-duta-city-parung",
    slug: "update-stok-siteplan-grand-duta-city-parung",
    href: "/update-stok-siteplan-grand-duta-city-parung",
    title: "Update Stok & Siteplan GDC Parung",
    excerpt:
      "Lihat posisi unit, status ketersediaan terbaru, dan ringkasan stok Cluster Ladera serta Cascada dalam satu halaman resmi.",
    description:
      "Halaman update resmi untuk memantau siteplan kawasan, status unit available, reservasi, sold, dan progress rumah di GDC Parung.",
    category: articleCategoryDefinitions["seputar-gdc"].name,
    categorySlug: "seputar-gdc",
    authorSlug: "santika-reza",
    tags: ["update-stok", "siteplan", "cluster-cascada", "cluster-ladera"],
    coverImage:
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp",
    coverAlt:
      "Siteplan GDC Parung dengan update stok cluster terbaru",
    updatedAt: "2026-03-09",
    updatedLabel: "9 Maret 2026",
    readingTime: "5 menit baca",
    featured: true,
    popularityRank: 1,
    recommendationRank: 1,
    searchTerms: [
      "stok rumah",
      "siteplan grand duta city",
      "update cluster ladera",
      "update cluster cascada",
      "unit tersedia",
      "seputar gdc",
    ],
  },
  {
    id: "cara-beli-kpr",
    slug: "cara-beli-kpr",
    href: "/cara-beli-kpr",
    title: "Cara Beli Rumah dan Proses KPR di GDC Parung",
    excerpt:
      "Panduan langkah demi langkah mulai dari pilih unit, booking fee, DP, pengajuan KPR, verifikasi bank, hingga akad kredit.",
    description:
      "Panduan pembelian rumah untuk membantu Anda memahami proses KPR, dokumen yang dibutuhkan, dan tahapan transaksi di GDC Parung.",
    category: articleCategoryDefinitions["panduan-properti"].name,
    categorySlug: "panduan-properti",
    authorSlug: "santika-reza",
    tags: ["kpr-rumah", "cara-beli-rumah", "dokumen-kpr"],
    coverImage:
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp",
    coverAlt:
      "Panduan cara beli rumah dan proses KPR GDC Parung",
    updatedAt: "2026-04-12",
    updatedLabel: "12 April 2026",
    readingTime: "7 menit baca",
    popularityRank: 2,
    recommendationRank: 2,
    searchTerms: [
      "cara beli rumah",
      "kpr grand duta city",
      "dokumen kpr",
      "booking fee",
      "akad kredit",
      "panduan properti",
    ],
  },
  {
    id: "lokasi-akses-grand-duta-city-parung",
    slug: "lokasi-akses-grand-duta-city-parung",
    href: "/lokasi-akses-grand-duta-city-parung",
    title: "Lokasi GDC Parung dan Akses ke Bogor, Depok, Jakarta",
    excerpt:
      "Peta lokasi, jalur akses utama, serta fasilitas penting di sekitar kawasan untuk membantu Anda menilai kenyamanan mobilitas harian.",
    description:
      "Panduan lokasi dan akses GDC Parung yang membahas konektivitas kawasan, titik penting sekitar, dan kedekatan dengan fasilitas publik.",
    category: articleCategoryDefinitions.kawasan.name,
    categorySlug: "kawasan",
    authorSlug: "santika-reza",
    tags: ["lokasi-parung", "akses-jakarta", "fasilitas-sekitar"],
    coverImage:
      "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763613/Grand-Duta-City-Parung-Map-scaled_mth9ir.webp",
    coverAlt:
      "Peta lokasi GDC Parung dengan akses ke Bogor, Depok, dan Jakarta",
    updatedAt: "2026-04-12",
    updatedLabel: "12 April 2026",
    readingTime: "6 menit baca",
    popularityRank: 3,
    recommendationRank: 3,
    searchTerms: [
      "lokasi grand duta city parung",
      "akses bogor depok jakarta",
      "peta lokasi",
      "fasilitas sekitar",
      "jalur tol parung",
      "kawasan parung",
    ],
  },
];

export const articleCategorySlugs = Object.keys(
  articleCategoryDefinitions,
) as ArticleCategorySlug[];

export const articleCategories = articleCategorySlugs.map(
  (slug) => articleCategoryDefinitions[slug].name,
);

export const articleAuthorSlugs = Object.keys(
  articleAuthorDefinitions,
) as ArticleAuthorSlug[];

export const articleTagSlugs = (
  Array.from(
    new Set(articleArchiveEntries.flatMap((article) => article.tags)),
  ) as ArticleTagSlug[]
).sort((left, right) =>
  articleTagDefinitions[left].name.localeCompare(articleTagDefinitions[right].name),
);

export function resolveSortKey(
  value: string | string[] | undefined,
): ArticleSortKey {
  const resolved = Array.isArray(value) ? value[0] : value;

  if (resolved === "terbaru" || resolved === "populer") {
    return resolved;
  }

  return "rekomendasi";
}

export function sortArticles(
  entries: ArticleArchiveEntry[],
  sortKey: ArticleSortKey,
) {
  const next = [...entries];

  switch (sortKey) {
    case "terbaru":
      return next.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt),
      );
    case "populer":
      return next.sort((left, right) => left.popularityRank - right.popularityRank);
    case "rekomendasi":
    default:
      return next.sort(
        (left, right) => left.recommendationRank - right.recommendationRank,
      );
  }
}

export function getFeaturedArticle(categorySlug?: ArticleCategorySlug) {
  if (!categorySlug) {
    return articleArchiveEntries.find((article) => article.featured);
  }

  const definition = articleCategoryDefinitions[categorySlug];
  const sortKey =
    definition.featuredStrategy === "terbaru" ? "terbaru" : "rekomendasi";

  return sortArticles(getArticlesByCategory(categorySlug), sortKey)[0];
}

export function getCategoryDefinition(slug: string) {
  return articleCategoryDefinitions[slug as ArticleCategorySlug];
}

export function getTagDefinition(slug: string) {
  return articleTagDefinitions[slug as ArticleTagSlug];
}

export function getAuthorDefinition(slug: string) {
  return articleAuthorDefinitions[slug as ArticleAuthorSlug];
}

export function getArticlesByCategory(categorySlug: ArticleCategorySlug) {
  return articleArchiveEntries.filter(
    (article) => article.categorySlug === categorySlug,
  );
}

export function getArticlesByTag(tagSlug: ArticleTagSlug) {
  return articleArchiveEntries.filter((article) => article.tags.includes(tagSlug));
}

export function getArticlesByAuthor(authorSlug: ArticleAuthorSlug) {
  return articleArchiveEntries.filter((article) => article.authorSlug === authorSlug);
}

export function getCategoryPath(categorySlug: ArticleCategorySlug) {
  return `/category/${categorySlug}`;
}

export function getCategoryPagePath(
  categorySlug: ArticleCategorySlug,
  pageNumber: number,
) {
  return pageNumber <= 1
    ? getCategoryPath(categorySlug)
    : `${getCategoryPath(categorySlug)}/page/${pageNumber}`;
}

export function getTagPath(tagSlug: ArticleTagSlug) {
  return `/tag/${tagSlug}`;
}

export function getAuthorPath(authorSlug: ArticleAuthorSlug) {
  return `/author/${authorSlug}`;
}

export function getTagPagePath(tagSlug: ArticleTagSlug, pageNumber: number) {
  return pageNumber <= 1 ? getTagPath(tagSlug) : `${getTagPath(tagSlug)}/page/${pageNumber}`;
}

export function toAbsoluteUrl(path: string) {
  if (!path || path === "/") {
    return SITE_URL;
  }

  const normalizedPath = path.replace(/\/+$/, "");
  const prefixedPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${SITE_URL}${prefixedPath}`;
}

export function paginateArticles(
  entries: ArticleArchiveEntry[],
  pageNumber: number,
  pageSize: number,
) {
  const totalItems = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(pageNumber, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = entries.slice(start, start + pageSize);

  return {
    items,
    totalItems,
    totalPages,
    pageNumber: safePage,
  };
}

export function getRelatedCategories(categorySlug: ArticleCategorySlug) {
  return articleCategoryDefinitions[categorySlug].relatedCategories.map(
    (slug) => articleCategoryDefinitions[slug],
  );
}

export function getTagsForArticles(entries: ArticleArchiveEntry[]) {
  const used = new Set(entries.flatMap((article) => article.tags));

  return Array.from(used)
    .map((slug) => articleTagDefinitions[slug as ArticleTagSlug])
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getCategoryPageCount(categorySlug: ArticleCategorySlug) {
  return Math.max(
    1,
    Math.ceil(getArticlesByCategory(categorySlug).length / CATEGORY_PAGE_SIZE),
  );
}

export function getTagPageCount(tagSlug: ArticleTagSlug) {
  return Math.max(1, Math.ceil(getArticlesByTag(tagSlug).length / TAG_PAGE_SIZE));
}

export function getCategorySitemapEntries() {
  return articleCategorySlugs.map((slug) => ({
    url: toAbsoluteUrl(getCategoryPath(slug)),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: articleCategoryDefinitions[slug].sitemapPriority,
  }));
}

export function getCategoryArticleCount(categorySlug: ArticleCategorySlug) {
  return getArticlesByCategory(categorySlug).length;
}

export function getAuthorArticleCount(authorSlug: ArticleAuthorSlug) {
  return getArticlesByAuthor(authorSlug).length;
}

export function getLatestArticles(limit: number) {
  return sortArticles(articleArchiveEntries, "terbaru").slice(0, limit);
}

export function buildItemListElements(entries: ArticleArchiveEntry[], offset = 0) {
  return entries.map((article, index) => ({
    "@type": "ListItem",
    position: offset + index + 1,
    url: toAbsoluteUrl(article.href),
    name: article.title,
  }));
}
