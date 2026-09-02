/**
 * Pembangun structured data terpusat — Fase 5 spec `seo-cannibalization-and-pseo`.
 *
 * MASALAH YANG DISELESAIKAN
 *
 * Sebelum fase ini, setiap halaman menulis JSON-LD sendiri tanpa `@id`, dan
 * homepage saja mengemit ENAM blok `<script>` terpisah. Akibatnya:
 *
 *   1. Graf TERPUTUS. Halaman `/category/*` merujuk
 *      `isPartOf: { "@id": ".../#website" }`, tetapi node `WebSite` di homepage
 *      TIDAK punya `@id` sama sekali — referensinya menggantung ke node yang
 *      tidak eksis.
 *   2. ENTITAS TERPECAH. `BlogPosting.publisher.name` = "Grand Duta City Parung"
 *      sementara `Organization.name` di layout = "Duta Putra Land", tanpa
 *      penghubung. Google melihat dua entitas berbeda, dan konsolidasi entitas
 *      adalah prasyarat sitelink serta knowledge panel.
 *   3. ENTITAS UTAMA SALAH. Situs ini tentang PROYEK, tapi satu-satunya entitas
 *      kuat yang dideklarasikan adalah developer-nya.
 *
 * SOLUSI: satu `@graph` per halaman, semua node ber-`@id` dengan konvensi tetap
 * di `SCHEMA_ID`, dan node lintas halaman saling merujuk lewat `@id` alih-alih
 * mengulang isinya.
 *
 * ENTITAS UTAMA sekarang `Place` bernama "Grand Duta City Parung South of
 * Jakarta" dengan `alternateName` memuat KEDUA varian brand. Ini cara paling
 * langsung memberi tahu Google bahwa "Grand Duta City South of Jakarta" dan
 * "Grand Duta City Parung" adalah entitas yang sama, dan homepage adalah
 * halamannya.
 */

import { bankPartnerNames } from "@/data/bank-partners";
import { facilities } from "@/data/facilities";
import { homepageFaqs } from "@/data/faq-homepage";
import {
  CLUSTER_LABEL,
  getUnitsByCluster,
  unitSpecSentence,
  type ClusterKey,
  type Unit,
} from "@/data/units";
import { SITE_URL } from "@/lib/seo";

/** Konvensi `@id` — satu tempat supaya referensi lintas halaman tidak menggantung. */
export const SCHEMA_ID = {
  project: `${SITE_URL}/#project`,
  organization: `${SITE_URL}/#organization`,
  brand: `${SITE_URL}/#brand`,
  salesOffice: `${SITE_URL}/#salesoffice`,
  salesOfficeImage: `${SITE_URL}/#salesoffice-image`,
  website: `${SITE_URL}/#website`,
  homepage: `${SITE_URL}/#webpage`,
  primaryImage: `${SITE_URL}/#primaryimage`,
  faq: `${SITE_URL}/#faq`,
  video: `${SITE_URL}/#video`,
  clusterLadera: `${SITE_URL}/#cluster-ladera`,
  clusterCascada: `${SITE_URL}/#cluster-cascada`,
  /** Penulis konten. Node lengkapnya didefinisikan di /author/santika-reza. */
  author: `${SITE_URL}/author/santika-reza#person`,
} as const;

/** Referensi ringkas ke node lain dalam graf. */
export const ref = (id: string) => ({ "@id": id });

export const PROJECT_NAME = "Grand Duta City Parung South of Jakarta";
export const SITE_NAME = "Grand Duta City Parung";

export const SITE_ALTERNATE_NAMES = [
  "Grand Duta City South of Jakarta",
  "GDC Parung",
  "GDC SOJ",
];

/**
 * Varian nama yang Google harus tahu menunjuk entitas yang SAMA.
 * Termasuk kedua kata kunci target pemilik.
 */
export const PROJECT_ALTERNATE_NAMES = [
  "Grand Duta City Parung",
  "Grand Duta City South of Jakarta",
  "GDC SOJ Parung",
  "GDC Parung",
];

export const PROJECT_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Jl. Raya Parung No.47, Jabon Mekar",
  addressLocality: "Parung",
  addressRegion: "Jawa Barat",
  postalCode: "16330",
  addressCountry: "ID",
} as const;

export const PROJECT_GEO = {
  "@type": "GeoCoordinates",
  latitude: -6.462459,
  longitude: 106.729392,
} as const;

export const PROJECT_PHONE = "+628131742034";
export const PROJECT_EMAIL = "contact@granddutacitysouthofjakarta.com";
export const PROJECT_MAP = "https://maps.app.goo.gl/hCasFSyKPXv5nwY5A";

export const PROJECT_SAME_AS = [
  "https://www.instagram.com/granddutacityparungsoj/",
  "https://www.facebook.com/granddutacityparungsoj",
  "https://www.youtube.com/@marketinggdcparung",
];

export const DEVELOPER_URL = "https://dutaputraland.com/main/public/";
export const DEVELOPER_LOGO =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/c_pad,b_white,w_512,h_512/v1775669124/Logo_Duta_Putra_Land_rq0kzk.png";
export const SALES_OFFICE_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Marketing_Galeri_n0hwsx.webp";

const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "09:00",
    closes: "18:00",
  },
];

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

/**
 * `WebSite` — WAJIB ber-`@id` karena `/category/*` dan `/artikel` merujuknya.
 *
 * `potentialAction`/`SearchAction` SENGAJA TIDAK ADA. Google meretirekan
 * sitelinks searchbox pada 21 November 2024, dan `urlTemplate` lama
 * (`/?s={search_term_string}`, pola WordPress warisan migrasi) menunjuk route
 * yang tidak pernah ada di situs ini.
 */
export const websiteNode = () => ({
  "@type": "WebSite",
  "@id": SCHEMA_ID.website,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  inLanguage: "id-ID",
  publisher: ref(SCHEMA_ID.organization),
  about: ref(SCHEMA_ID.project),
});

/** Brand proyek, terpisah dari badan hukum developer dan kantor pemasaran. */
export const projectBrandNode = () => ({
  "@type": "Brand",
  "@id": SCHEMA_ID.brand,
  name: SITE_NAME,
  alternateName: PROJECT_ALTERNATE_NAMES,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  sameAs: PROJECT_SAME_AS,
});

/** Developer/publisher situs. Data lokasi proyek tidak ditempelkan ke node ini. */
export const developerOrganizationNode = () => ({
  "@type": "Organization",
  "@id": SCHEMA_ID.organization,
  name: "Duta Putra Land",
  legalName: "PT. Duta Putra Mahkota",
  url: DEVELOPER_URL,
  logo: {
    "@type": "ImageObject",
    url: DEVELOPER_LOGO,
    contentUrl: DEVELOPER_LOGO,
    width: 512,
    height: 512,
  },
  foundingDate: "1983",
  foundingLocation: {
    "@type": "Country",
    name: "Indonesia",
  },
  slogan: "Best Living For Generations",
  brand: ref(SCHEMA_ID.brand),
  knowsAbout: ["Pengembangan properti", "Perumahan", "Kota mandiri"],
});

/**
 * ENTITAS UTAMA. `Place` dipilih, bukan `Product`: yang dijual di sini adalah
 * rumah tapak dalam sebuah kawasan, dan `Product` membawa serta ekspektasi
 * merchant listing yang tidak berlaku untuk properti.
 */
export const projectPlaceNode = () => ({
  "@type": "Place",
  "@id": SCHEMA_ID.project,
  name: PROJECT_NAME,
  alternateName: PROJECT_ALTERNATE_NAMES,
  url: SITE_URL,
  mainEntityOfPage: ref(SCHEMA_ID.homepage),
  description:
    "Kawasan hunian kota mandiri 200 hektar di Parung, Bogor, persembahan Duta Putra Land. Terdiri dari Cluster Ladera dan Cluster Cascada, 20 menit ke CBD Jakarta Selatan.",
  address: PROJECT_ADDRESS,
  geo: PROJECT_GEO,
  hasMap: PROJECT_MAP,
  telephone: PROJECT_PHONE,
  photo: ref(SCHEMA_ID.primaryImage),
  publicAccess: true,
  smokingAllowed: false,
  // Diturunkan dari src/data/facilities.ts — daftar yang sama dengan kartu
  // fasilitas yang dilihat pengunjung.
  amenityFeature: facilities.map((facility) => ({
    "@type": "LocationFeatureSpecification",
    name: facility.title,
    value: true,
  })),
  containsPlace: [
    ref(SCHEMA_ID.clusterLadera),
    ref(SCHEMA_ID.clusterCascada),
  ],
  isicV4: "6810",
  additionalProperty: [
    {
      "@type": "PropertyValue",
      name: "Luas kawasan",
      value: "200 hektar",
    },
    {
      "@type": "PropertyValue",
      name: "Bank mitra KPR",
      value: bankPartnerNames,
    },
  ],
});

export const clusterNodes = () => [
  {
    "@type": "Place",
    "@id": SCHEMA_ID.clusterLadera,
    name: "Cluster Ladera",
    description:
      "Cluster bertema American Classic Modern di Grand Duta City Parung. Tipe Verona 39/60, Malta 47/72, dan Tuscan 66/72.",
    url: `${SITE_URL}/cluster-ladera`,
    address: PROJECT_ADDRESS,
    containedInPlace: ref(SCHEMA_ID.project),
  },
  {
    "@type": "Place",
    "@id": SCHEMA_ID.clusterCascada,
    name: "Cluster Cascada",
    description:
      "Cluster bertema Modern Tropical Resort di Grand Duta City Parung. Tipe Aira+ 42/60, Manoa 58/60, Victoria 69, dan Alexandra 88/105.",
    url: `${SITE_URL}/cluster-cascada`,
    address: PROJECT_ADDRESS,
    containedInPlace: ref(SCHEMA_ID.project),
  },
];

/**
 * Kantor pemasaran. `RealEstateAgent` adalah subtipe `LocalBusiness`, jadi ia
 * yang membawa jam operasional dan rentang harga — bukan `Place` proyek.
 */
export const salesOfficeNode = () => ({
  "@type": "RealEstateAgent",
  "@id": SCHEMA_ID.salesOffice,
  name: "Marketing Gallery Grand Duta City Parung",
  url: `${SITE_URL}/kontak`,
  description:
    "Kantor pemasaran resmi Grand Duta City Parung untuk informasi produk, harga, simulasi KPR, dan kunjungan lokasi.",
  image: ref(SCHEMA_ID.salesOfficeImage),
  telephone: PROJECT_PHONE,
  email: PROJECT_EMAIL,
  address: PROJECT_ADDRESS,
  geo: PROJECT_GEO,
  hasMap: PROJECT_MAP,
  brand: ref(SCHEMA_ID.brand),
  location: ref(SCHEMA_ID.project),
  areaServed: [
    { "@type": "AdministrativeArea", name: "Parung, Kabupaten Bogor" },
    { "@type": "City", name: "Depok" },
    { "@type": "AdministrativeArea", name: "Jakarta Selatan" },
  ],
  openingHoursSpecification: OPENING_HOURS,
  // Batas bawah mengikuti Verona 39/60 (600 juta-an, tipe termurah sejak
  // 30 Agustus 2026), batas atas mengikuti Ruko SOJ. Angka ini WAJIB dijaga
  // konsisten dengan `priceLabel` terendah di src/data/units.ts.
  priceRange: "Rp 600.000.000 - Rp 1.900.000.000",
  currenciesAccepted: "IDR",
  parentOrganization: ref(SCHEMA_ID.organization),
});

export const salesOfficeImageNode = () => ({
  "@type": "ImageObject",
  "@id": SCHEMA_ID.salesOfficeImage,
  url: SALES_OFFICE_IMAGE,
  contentUrl: SALES_OFFICE_IMAGE,
  caption: "Marketing Gallery Grand Duta City Parung",
});

export const primaryImageNode = (url: string, caption: string) => ({
  "@type": "ImageObject",
  "@id": SCHEMA_ID.primaryImage,
  url,
  contentUrl: url,
  caption,
  representativeOfPage: true,
});

/**
 * `FAQPage` dipertahankan meski Google menghapus FAQ rich result (7 Mei 2026).
 * Alasannya bukan SERP: markup ini masih dibaca LLM dan mesin AI search, dan
 * pertanyaan-pertanyaan ini persis yang ditanyakan calon pembeli.
 * Sumbernya SATU dengan yang dirender pengunjung (`src/data/faq-homepage.ts`).
 */
export const faqNode = () => ({
  "@type": "FAQPage",
  "@id": SCHEMA_ID.faq,
  url: SITE_URL,
  inLanguage: "id-ID",
  isPartOf: ref(SCHEMA_ID.website),
  about: ref(SCHEMA_ID.project),
  mainEntity: homepageFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
});

/** Item breadcrumb: label + path relatif (tanpa domain). */
export type BreadcrumbEntry = {
  name: string;
  path: string;
};

/**
 * `BreadcrumbList` — rich result yang MASIH AKTIF dan tampil di SERP.
 *
 * Dibuat sebagai builder bersama karena sebelumnya setiap halaman menyusun
 * breadcrumb sendiri, dan pada `article-taxonomy-archive.tsx` daftar visual
 * serta daftar JSON-LD dipelihara sebagai DUA array terpisah yang bisa
 * menyimpang. Sekarang satu array bisa memberi makan keduanya.
 */
export const breadcrumbNode = (items: BreadcrumbEntry[], pageUrl: string) => ({
  "@type": "BreadcrumbList",
  "@id": `${pageUrl}#breadcrumb`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Beranda",
      item: SITE_URL,
    },
    ...items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 2,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  ],
});

/** Bungkus daftar node menjadi satu dokumen `@graph`. */
export const graph = (nodes: unknown[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes.filter(Boolean),
});

/** Serialize JSON-LD safely when embedded in an HTML script element. */
export const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

// ---------------------------------------------------------------------------
// Node unit rumah
//
// Dibuat sebagai builder bersama karena `/cluster-ladera` dan `/cluster-cascada`
// sebelumnya masing-masing MENGARANG bentuk `Offer` sendiri dari angka hardcode.
// Akibatnya Malta 47/72 diberi `price: "900000000"` di Ladera padahal harga
// tunai keras terendahnya Rp 845.550.000 — sebuah klaim harga yang salah di
// structured data. Sekarang keduanya membaca `src/data/units.ts`.
// ---------------------------------------------------------------------------

/**
 * Ketersediaan unit dalam kosakata schema.org.
 *
 * `check-siteplan` DISENGAJA dipetakan ke `LimitedAvailability`, BUKAN
 * `InStock`. Pemilik menegaskan stok aktual hanya sah bila merujuk siteplan
 * terbaru dan mayoritas jalur utama Cascada sudah SOLD; menyatakan `InStock`
 * untuk seluruh tipe adalah klaim yang tidak bisa dipertanggungjawabkan.
 */
export const unitAvailability = (unit: Unit): string => {
  switch (unit.status) {
    case "sold-out":
      return "https://schema.org/SoldOut";
    case "coming-soon":
      return "https://schema.org/PreOrder";
    default:
      return "https://schema.org/LimitedAvailability";
  }
};

/**
 * `SingleFamilyResidence` untuk satu tipe unit.
 *
 * Field yang datanya belum dikonfirmasi pemilik SENGAJA tidak diemit
 * (`undefined` lalu dibersihkan `JSON.stringify`) alih-alih diisi angka tebakan.
 * Structured data dibaca mesin sebagai fakta, jadi menebak di sini sama dengan
 * memalsukan spesifikasi produk.
 *
 * Luas tanah dan jumlah lantai memakai `additionalProperty` karena schema.org
 * tidak punya properti baku untuk keduanya pada `Accommodation`.
 */
export const residenceNode = (unit: Unit) => {
  const additionalProperty = [
    {
      "@type": "PropertyValue",
      name: "Luas Tanah",
      value: unit.lt,
      unitCode: "MTK",
    },
    unit.floors !== null
      ? {
          "@type": "PropertyValue",
          name: "Jumlah Lantai",
          value: unit.floors,
        }
      : null,
    {
      "@type": "PropertyValue",
      name: "Kode Tipe",
      value: unit.typeCode,
    },
    // Hanya diemit bila benar. Kavling hook adalah karakteristik nyata
    // (luas tanah di atas tipe lain, dua sisi terbuka), bukan label pemasaran.
    unit.isHook
      ? {
          "@type": "PropertyValue",
          name: "Posisi Kavling",
          value: "Hook",
        }
      : null,
  ].filter(Boolean);

  return {
    "@type": "SingleFamilyResidence",
    "@id": `${SITE_URL}/tipe-rumah/${unit.id}#residence`,
    name: `${unit.name} ${unit.typeCategory}`,
    description: unit.description,
    image: unit.facadeImage,
    floorSize: {
      "@type": "QuantitativeValue",
      value: unit.lb,
      unitCode: "MTK",
    },
    numberOfRooms: unit.bedrooms ?? undefined,
    numberOfBedrooms: unit.bedrooms ?? undefined,
    numberOfBathroomsTotal: unit.bathrooms ?? undefined,
    accommodationFloorPlan: unit.floorPlanImage
      ? {
          "@type": "FloorPlan",
          name: `Denah ${unit.name} ${unit.typeCategory}`,
          layoutImage: unit.floorPlanImage,
          floorSize: {
            "@type": "QuantitativeValue",
            value: unit.lb,
            unitCode: "MTK",
          },
          numberOfBedrooms: unit.bedrooms ?? undefined,
          numberOfBathroomsTotal: unit.bathrooms ?? undefined,
        }
      : undefined,
    additionalProperty,
    containedInPlace: ref(
      unit.cluster === "ladera"
        ? SCHEMA_ID.clusterLadera
        : SCHEMA_ID.clusterCascada,
    ),
  };
};

/**
 * `Offer` pembungkus satu tipe unit.
 *
 * TIDAK memuat `price` numerik: harga di pricelist resmi adalah rentang per
 * kavling (tunai keras vs KPR berbeda jauh), sehingga satu angka tunggal pasti
 * salah untuk sebagian kavling. `priceSpecification` dengan `minPrice` juga
 * dihindari selama angka minimum per tipe belum dikonfirmasi seluruhnya.
 * Yang diemit adalah label harga yang sama dengan yang dilihat pengunjung.
 */
export const unitOfferNode = (unit: Unit) => ({
  "@type": "Offer",
  name: `${unit.name} ${unit.typeCategory} ${CLUSTER_LABEL[unit.cluster]}`,
  description: unitSpecSentence(unit),
  availability: unitAvailability(unit),
  priceCurrency: "IDR",
  url: `${SITE_URL}/tipe-rumah/${unit.id}`,
  seller: ref(SCHEMA_ID.salesOffice),
  itemOffered: residenceNode(unit),
});

/** `OfferCatalog` untuk satu cluster, dibangun dari sumber data unit. */
export const clusterOfferCatalogNode = (
  cluster: ClusterKey,
  pageUrl: string,
) => ({
  "@type": "OfferCatalog",
  "@id": `${pageUrl}#offercatalog`,
  name: `Tipe Rumah ${CLUSTER_LABEL[cluster]} Grand Duta City Parung`,
  url: pageUrl,
  itemListElement: getUnitsByCluster(cluster).map(unitOfferNode),
});
