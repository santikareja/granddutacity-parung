import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  CarFront,
  Check,
  Coffee,
  Layers,
  MapPin,
  Maximize,
  Ruler,
  ScrollText,
  ShieldCheck,
  Smile,
  TreePine,
  Waves,
  Wifi,
  Zap,
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ClickableSiteplanImage } from "@/components/ui/clickable-siteplan-image";
import { Header } from "@/components/ui/header-2";
import { UnitGallery } from "@/components/ui/unit-gallery";
import { VideoEmbed } from "@/components/ui/video-embed";
import { facilities, type FacilityIconKey } from "@/data/facilities";
import {
  ACCESS_SUMMARY,
  CLUSTER_SITEPLAN,
  CLUSTER_THEME,
  getUnitContent,
  resolveUnitGallery,
  resolveUnitOverview,
  resolveUnitVideo,
} from "@/data/unit-content";
import {
  CLUSTER_LABEL,
  PROJECT_ELECTRICAL,
  PROJECT_LEGALITY,
  bathroomLabel,
  bedroomLabel,
  getSiblingUnits,
  getUnitById,
  unitDisplayName,
  unitFacadeAlt,
  unitPagePath,
  unitSizeLabel,
  unitSpecSentence,
  units,
  type Unit,
} from "@/data/units";
import {
  SCHEMA_ID,
  breadcrumbNode,
  graph,
  ref,
  residenceNode,
  unitAvailability,
} from "@/lib/schema";
import { OG_SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * HALAMAN TIPE UNIT — Fase 7 spec `seo-cannibalization-and-pseo`.
 *
 * ALASAN UTAMA HALAMAN INI ADA, dan ini penting dicatat jujur:
 * bukan volume pencarian. Riset Semrush menunjukkan keyword tipe unit
 * volumenya kecil (`rumah tipe 42` 260/bln, sisanya 0-30/bln). Yang mendesak
 * adalah CACAT yang lahir di Fase 5: `residenceNode()` menyetel
 * `@id` = `/tipe-rumah/<id>#residence` dan `unitOfferNode()` menyetel
 * `Offer.url` = `/tipe-rumah/<id>`, keduanya sudah tayang di produksi pada
 * /cluster-ladera, /cluster-cascada, dan /pricelist — sementara kesepuluh URL
 * itu MENGEMBALIKAN 404 (diverifikasi 10 dari 10).
 *
 * `Offer.url` yang menunjuk 404 melanggar pedoman structured data Google:
 * URL itu seharusnya tempat penawaran benar-benar bisa dilihat. Halaman ini
 * membuat referensi tersebut resolve.
 *
 * NILAI SEKUNDER yang nyata:
 *   - Niat pencarian dalam. Orang yang mencari "tipe manoa 58" sudah memilih
 *     unit, bukan sedang cari inspirasi. Volume kecil, konversi tinggi.
 *   - Hub-spoke: setiap halaman menaut homepage dengan anchor brand dan
 *     `about` -> `#project`, memperkuat entitas yang diperebutkan homepage.
 *
 * ANTIKANIBALISASI: setiap slug punya `primary` eksklusif di
 * `src/lib/keyword-ownership.ts`, dijaga guard G14-G17. Tidak ada satu pun
 * yang mengklaim frasa brand homepage.
 *
 * BUKAN DOORWAY PAGE: keunikan tiap halaman berasal dari data nyata yang
 * berbeda (spesifikasi, harga, denah, galeri, deskripsi per tipe, dan tabel
 * banding terhadap tetangga cluster yang berbeda), bukan nama tipe yang
 * ditukar pada template yang sama.
 *
 * ------------------------------------------------------------------------
 * TATA LETAK GAYA LISTING MARKETPLACE (30 Agustus 2026)
 * ------------------------------------------------------------------------
 * Permintaan pemilik: halaman ini harus terasa seperti halaman produk di
 * marketplace properti, mudah dinavigasi, dan menaikkan konversi.
 *
 * Yang berubah dan alasannya:
 *   - Hero full-bleed 62vh DIGANTI dua kolom: galeri foto di kiri, kartu
 *     ringkasan harga + CTA yang STICKY di kanan. Hero lama memaksa
 *     pengunjung menggulir sebelum melihat harga; sekarang harga dan tombol
 *     WhatsApp selalu terlihat selama membaca di desktop.
 *   - Di layar kecil kartu itu tidak bisa sticky (memakan tinggi layar), jadi
 *     ada BAR CTA melekat di bawah viewport. Ia hanya muncul di bawah `lg`.
 *   - NAVIGASI ANCHOR di bawah hero. Halaman ini jadi panjang, dan pembeli
 *     biasanya mencari satu hal spesifik (denah, harga, siteplan).
 *   - Seksi FASILITAS dan AKSES hanya RINGKASAN + tautan ke halaman
 *     pemiliknya. Menyalin blok panjang yang identik ke 10 halaman akan
 *     mengubahnya menjadi doorway page sekaligus berebut query lokasi dengan
 *     `/lokasi-akses-grand-duta-city-parung`. Lihat catatan di
 *     `src/data/unit-content.ts`.
 *   - SITEPLAN diambil per cluster, bukan satu gambar untuk semua, sehingga
 *     ia menambah pembeda alih-alih duplikasi.
 *
 * Aset yang belum ada (galeri foto per tipe, video Cascada) memakai slot
 * placeholder di `src/data/unit-content.ts`. Halaman TIDAK merender kotak
 * kosong: bila galeri belum diisi ia memakai render fasad, dan bila video
 * belum ada seksinya tidak dirender sama sekali.
 */

const SLASH = "\u2014";

/** Slug yang di-prerender. `unit.id` DIPAKAI APA ADANYA karena schema sudah memakainya. */
export function generateStaticParams() {
  return units.map((unit) => ({ slug: unit.id }));
}

type Props = { params: Promise<{ slug: string }> };

/**
 * Unit yang TIDAK diindeks.
 *
 * KOSONG sejak 30 Agustus 2026. Sebelumnya berisi `frontera-89`, yang saat itu
 * berstatus "Segera Hadir" tanpa harga maupun jumlah kamar — halaman seperti itu
 * tidak punya apa pun untuk dimenangkan di pencarian, jadi ia dibangun (supaya
 * `Offer.url` dan `@id` miliknya resolve) tapi tidak diindeks. Syarat "dibuka
 * kembali begitu datanya ada" kini TERPENUHI: pemilik sudah mengirim harga
 * (1,6 Milyar-an) dan spesifikasi penuh.
 *
 * Himpunan ini SENGAJA dipertahankan meski kosong, bukan dihapus: mekanismenya
 * akan dibutuhkan lagi saat tipe baru diumumkan sebelum pricelistnya siap.
 *
 * WAJIB SINKRON dengan `NOINDEX_UNIT_IDS` di src/app/sitemap.ts.
 */
const NOINDEX_UNITS = new Set<string>([]);

const isIndexable = (unit: Unit) => !NOINDEX_UNITS.has(unit.id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const unit = getUnitById(slug);
  if (!unit) return { title: "Tipe Tidak Ditemukan" };

  const name = unitDisplayName(unit);
  const size = unitSizeLabel(unit);
  const pageUrl = `${SITE_URL}${unitPagePath(unit)}`;

  // Title memakai "GDC Parung", BUKAN "Grand Duta City Parung": frasa penuh itu
  // milik homepage (RESERVED_HOMEPAGE_KEYWORDS). Dikunci guard G4/G5/G16.
  //
  // Penanda "Hook" ikut masuk untuk unit hook karena itu karakteristik produk
  // yang nyata (luas tanah jauh di atas tipe lain, dua sisi terbuka) sekaligus
  // istilah yang dipakai pembeli. Guard G17 yang menangkap ketidakcocokan
  // antara klaim keyword dan title-lah yang memaksa ini dibereskan dengan benar.
  const hookBit = unit.isHook ? " Hook" : "";
  const title = `Tipe ${name}${hookBit} ${size} GDC Parung: Harga & Denah`;

  // Description dibangun dari spesifikasi NYATA per unit, jadi otomatis unik
  // antar halaman tanpa perlu menulis 10 variasi manual. Field yang belum
  // dikonfirmasi pemilik tidak ikut muncul.
  //
  // PANJANGNYA HARUS 120-160 karakter (guard G7), dan itu tidak bisa dicapai
  // dengan satu template tetap: unit berspesifikasi lengkap seperti Alexandra
  // menghasilkan 184 karakter, sementara Verona yang datanya belum lengkap hanya
  // 102. Karena itu penutupnya dipilih ADAPTIF — varian terpanjang yang masih
  // masuk batas. Guard G7 yang menangkap masalah ini, bukan tebakan.
  const specBits: string[] = [];
  if (unit.bedrooms !== null) specBits.push(`${bedroomLabel(unit)} KT`);
  if (unit.bathrooms !== null) specBits.push(`${bathroomLabel(unit)} KM`);
  if (unit.carports !== null) specBits.push(`${unit.carports} carport`);
  if (unit.floors !== null) specBits.push(`${unit.floors} lantai`);
  const spec = specBits.length > 0 ? `${specBits.join(", ")}. ` : "";

  const hookBit2 = unit.isHook ? "Kavling hook dua sisi terbuka. " : "";
  const priceBit =
    unit.status === "coming-soon"
      ? "Pricelist resmi segera dirilis. "
      : `Harga mulai Rp ${unit.priceLabel}. `;

  const head = `Tipe ${name} ${size} ${CLUSTER_LABEL[unit.cluster]}, Parung Bogor. `;
  const base = `${head}${spec}${hookBit2}${priceBit}`;

  // Diurut dari terpanjang ke terpendek; yang dipakai adalah yang pertama muat.
  const TAILS = [
    "Lihat denah, spesifikasi, dan simulasi cicilan KPR di halaman ini.",
    "Lihat denah, spesifikasi, dan simulasi KPR-nya.",
    "Lihat denah & simulasi KPR.",
  ];
  const description =
    base + (TAILS.find((tail) => (base + tail).length <= 160) ?? TAILS[TAILS.length - 1]);

  return {
    title,
    description,
    keywords: [
      `tipe ${name.toLowerCase()} ${unit.lb}`,
      `rumah tipe ${unit.lb}`,
      `denah tipe ${name.toLowerCase()}`,
      `harga tipe ${name.toLowerCase()}`,
      `${CLUSTER_LABEL[unit.cluster].toLowerCase()}`,
    ],
    alternates: { canonical: pageUrl },
    robots: isIndexable(unit)
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: OG_SITE_NAME,
      locale: "id_ID",
      type: "website",
      images: [{ url: unit.facadeImage, width: 1200, height: 630, alt: `Fasad tipe ${name} ${size} GDC Parung` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [unit.facadeImage] },
  };
}

// ---------------------------------------------------------------------------
// Bagian tampilan
// ---------------------------------------------------------------------------

/** Ikon fasilitas disimpan sebagai KUNCI di data; pemetaan ke JSX ada di sini. */
const FACILITY_ICON: Record<FacilityIconKey, typeof TreePine> = {
  tree: TreePine,
  waves: Waves,
  smile: Smile,
  shield: ShieldCheck,
  coffee: Coffee,
  wifi: Wifi,
  "map-pin": MapPin,
};

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#0b120c]/10 bg-brand-light p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#F5A524]" aria-hidden="true" />
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">
          {label}
        </div>
        <div className="mt-1 font-medium text-[#0b120c]">{value}</div>
      </div>
    </div>
  );
}

/** Judul seksi + `scroll-mt` agar navigasi anchor tidak tertutup header. */
function SectionHeading({
  id,
  title,
  intro,
}: {
  id: string;
  title: string;
  intro?: string;
}) {
  return (
    <>
      <h2
        id={`${id}-title`}
        className="font-serif text-2xl font-semibold text-[#0b120c] sm:text-3xl md:text-4xl"
      >
        {title}
      </h2>
      {intro ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#0b120c]/65 sm:text-base">
          {intro}
        </p>
      ) : null}
    </>
  );
}

export default async function TipeRumahDetailPage({ params }: Props) {
  const { slug } = await params;
  const unit = getUnitById(slug);
  if (!unit) notFound();

  const name = unitDisplayName(unit);
  const size = unitSizeLabel(unit);
  const clusterLabel = CLUSTER_LABEL[unit.cluster];
  const clusterPath = `/cluster-${unit.cluster}`;
  const pageUrl = `${SITE_URL}${unitPagePath(unit)}`;
  const siblings = getSiblingUnits(unit);

  const content = getUnitContent(unit.id);
  const gallery = resolveUnitGallery(unit, unitFacadeAlt(unit));
  const video = resolveUnitVideo(unit);
  const overview = resolveUnitOverview(unit);
  const siteplan = CLUSTER_SITEPLAN[unit.cluster];
  const soldOut = unit.status === "sold-out";

  const priceDisplay =
    unit.status === "coming-soon" ? unit.priceLabel : `Rp ${unit.priceLabel}`;

  const availabilityLabel = soldOut
    ? "Sold out"
    : unit.status === "coming-soon"
      ? "Segera hadir"
      : "Cek siteplan terbaru";

  const waText = encodeURIComponent(
    `Halo, saya tertarik dengan Tipe ${name} ${size} di ${clusterLabel} Grand Duta City Parung. Boleh minta pricelist dan ketersediaan unitnya?`,
  );
  const waHref = `https://wa.me/628131742034?text=${waText}`;

  // Navigasi anchor dibangun dari seksi yang BENAR-BENAR dirender, supaya tidak
  // ada tautan yang menggantung ke seksi yang disembunyikan (mis. video atau
  // denah yang asetnya belum ada).
  const navItems: { href: string; label: string }[] = [
    { href: "#deskripsi", label: "Deskripsi" },
    { href: "#spesifikasi", label: "Spesifikasi" },
    ...(unit.floorPlanImage ? [{ href: "#denah", label: "Denah" }] : []),
    ...(video ? [{ href: "#video", label: "Video" }] : []),
    { href: "#fasilitas", label: "Fasilitas" },
    { href: "#lokasi", label: "Akses" },
    { href: "#siteplan", label: "Siteplan" },
    ...(siblings.length > 0 ? [{ href: "#banding", label: "Banding tipe" }] : []),
  ];

  // Ringkasan spesifikasi untuk kartu harga: hanya field yang datanya ada.
  const quickSpecs: { label: string; value: string }[] = [
    { label: "Luas bangunan", value: `${unit.lb} m²` },
    { label: "Luas tanah", value: `${unit.lt} m²` },
    ...(unit.bedrooms !== null
      ? [{ label: "Kamar tidur", value: bedroomLabel(unit) }]
      : []),
    ...(unit.bathrooms !== null
      ? [{ label: "Kamar mandi", value: bathroomLabel(unit) }]
      : []),
    ...(unit.carports !== null
      ? [{ label: "Carport", value: `${unit.carports} mobil` }]
      : []),
    ...(unit.floors !== null
      ? [{ label: "Jumlah lantai", value: `${unit.floors} lantai` }]
      : []),
  ];

  // Node hunian dipakai ULANG dari builder bersama, jadi @id di halaman ini
  // IDENTIK dengan yang dirujuk /cluster-* dan /pricelist. Inilah yang membuat
  // referensi silang menyatu jadi satu entitas, bukan tiga deskripsi berbeda.
  const pageSchema = graph([
    breadcrumbNode(
      [
        { name: "Tipe Rumah", path: "/tipe-rumah" },
        { name: `Tipe ${name} ${size}`, path: unitPagePath(unit) },
      ],
      pageUrl,
    ),
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: `Tipe ${name} ${size} ${clusterLabel} Grand Duta City Parung`,
      description: unitSpecSentence(unit),
      inLanguage: "id",
      isPartOf: ref(SCHEMA_ID.website),
      about: ref(SCHEMA_ID.project),
      breadcrumb: ref(`${pageUrl}#breadcrumb`),
      primaryImageOfPage: {
        "@type": "ImageObject",
        "@id": `${pageUrl}#primaryimage`,
        url: unit.facadeImage,
        contentUrl: unit.facadeImage,
        caption: `Fasad tipe ${name} ${size} di ${clusterLabel} Grand Duta City Parung`,
      },
      mainEntity: ref(`${pageUrl}#residence`),
    },
    residenceNode(unit),
    {
      "@type": "Offer",
      "@id": `${pageUrl}#offer`,
      name: `Tipe ${name} ${size} ${clusterLabel}`,
      description: unitSpecSentence(unit),
      availability: unitAvailability(unit),
      priceCurrency: "IDR",
      url: pageUrl,
      itemOffered: ref(`${pageUrl}#residence`),
      seller: { "@type": "RealEstateAgent", ...ref(SCHEMA_ID.salesOffice) },
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <Header />

      {/* `pb-24 lg:pb-0` memberi ruang untuk bar CTA melekat di ponsel supaya ia
          tidak menutupi konten terakhir. */}
      <main className="relative w-full overflow-hidden bg-brand-light pb-24 lg:pb-0">
        {/* ── Kepala listing: galeri + kartu harga sticky ── */}
        <section className="border-b border-[#0b120c]/10 pt-24 md:pt-28">
          <div className="mx-auto max-w-screen-xl px-4 pb-10 sm:px-6 md:px-14">
            <Breadcrumb
              items={[{ label: "Tipe Rumah", href: "/tipe-rumah" }, { label: `Tipe ${name} ${size}` }]}
            />

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={clusterPath}
                className="rounded-full bg-[#0b120c] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F1E8] transition-colors hover:bg-[#A85D16]"
              >
                {clusterLabel}
              </Link>
              <span className="rounded-full bg-[#F5A524] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b120c]">
                {unit.typeCategory}
              </span>
              {unit.isHook ? (
                <span className="rounded-full border border-[#0b120c]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b120c]/70">
                  Kavling hook
                </span>
              ) : null}
              {soldOut ? (
                <span className="rounded-full bg-red-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
                  Sold out
                </span>
              ) : null}
            </div>

            {/* H1 menyebut tipe + ukuran, TIDAK frasa brand penuh — itu milik
                homepage. Frasa penuhnya hadir di paragraf deskripsi sebagai
                anchor internal ke "/". */}
            <h1 className="mt-4 font-serif text-3xl font-bold leading-[1.08] text-[#0b120c] sm:text-4xl md:text-5xl">
              Tipe {name} {size}
            </h1>
            <p className="mt-3 text-sm text-[#0b120c]/60 sm:text-base">
              {CLUSTER_THEME[unit.cluster]} {SLASH} Parung, Kabupaten Bogor
            </p>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Galeri */}
              <div className="lg:col-span-7 xl:col-span-8">
                <UnitGallery images={gallery} priority />
              </div>

              {/* Kartu ringkasan — sticky di desktop */}
              <aside className="lg:col-span-5 xl:col-span-4">
                <div className="rounded-3xl border border-[#0b120c]/10 bg-white/70 p-6 shadow-sm lg:sticky lg:top-24">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0b120c]/50">
                    Harga mulai
                  </div>
                  <div className="mt-1.5 font-serif text-3xl font-bold text-[#A85D16]">
                    {priceDisplay}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#0b120c]/60">
                    Mewakili harga tunai keras terendah. Harga KPR berbeda dan bervariasi per
                    kavling.
                  </p>

                  <dl className="mt-5 divide-y divide-[#0b120c]/8 border-y border-[#0b120c]/8">
                    {quickSpecs.map((spec) => (
                      <div key={spec.label} className="flex items-center justify-between py-2.5">
                        <dt className="text-xs text-[#0b120c]/55">{spec.label}</dt>
                        <dd className="text-sm font-semibold text-[#0b120c]">{spec.value}</dd>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-xs text-[#0b120c]/55">Ketersediaan</dt>
                      <dd className="text-sm font-semibold text-[#0b120c]">{availabilityLabel}</dd>
                    </div>
                  </dl>

                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#0b120c]/55">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="size-3.5" aria-hidden="true" /> Listrik {PROJECT_ELECTRICAL}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ScrollText className="size-3.5" aria-hidden="true" /> Legalitas {PROJECT_LEGALITY}
                    </span>
                  </p>

                  <div className="mt-6 space-y-2.5">
                    <a
                      href={waHref}
                      data-wa-placement="tipe-rumah-sidebar"
                      data-wa-unit={`${name} ${size}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C8521A] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#DE5E1E]"
                    >
                      Tanya ketersediaan <ArrowRight className="size-4" />
                    </a>
                    <Link
                      href="/pricelist-grand-duta-city"
                      className="flex w-full items-center justify-center rounded-full border border-[#0b120c]/20 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#0b120c] transition-colors hover:border-[#A85D16] hover:text-[#A85D16]"
                    >
                      Simulasi KPR &amp; pricelist
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Navigasi anchor ── */}
        <nav
          aria-label="Navigasi bagian halaman"
          className="border-b border-[#0b120c]/10 bg-brand-light/95 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <ul className="no-scrollbar flex list-none gap-1 overflow-x-auto py-3">
              {navItems.map((item) => (
                <li key={item.href} className="shrink-0">
                  <a
                    href={item.href}
                    className="block rounded-full px-4 py-2 text-xs font-semibold text-[#0b120c]/65 transition-colors hover:bg-[#0b120c]/5 hover:text-[#0b120c]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* ── Deskripsi ── */}
        <section
          id="deskripsi"
          aria-labelledby="deskripsi-title"
          className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <SectionHeading id="deskripsi" title={`Tentang Tipe ${name}`} />

            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                {overview.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mb-4 leading-relaxed text-[#0b120c]/75 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}

                <p className="mt-5 text-sm leading-relaxed text-[#0b120c]/65">
                  Tipe ini berada di {clusterLabel}, bagian dari kawasan{" "}
                  <Link href="/" className="font-medium text-[#A85D16] hover:underline">
                    Grand Duta City Parung
                  </Link>{" "}
                  South of Jakarta.
                </p>
              </div>

              {content.highlights.length > 0 || content.suitedFor.length > 0 ? (
                <div className="lg:col-span-5">
                  {content.highlights.length > 0 ? (
                    <div className="rounded-2xl border border-[#0b120c]/10 bg-white/60 p-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A85D16]">
                        Keunggulan tipe ini
                      </h3>
                      <ul className="mt-4 space-y-2.5">
                        {content.highlights.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm text-[#0b120c]/75">
                            <Check
                              className="mt-0.5 size-4 shrink-0 text-[#F5A524]"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {content.suitedFor.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-[#0b120c]/10 bg-white/60 p-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A85D16]">
                        Cocok untuk
                      </h3>
                      <ul className="mt-4 space-y-2.5">
                        {content.suitedFor.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm text-[#0b120c]/75">
                            <Check
                              className="mt-0.5 size-4 shrink-0 text-[#F5A524]"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Spesifikasi — sumber keunikan utama tiap halaman ── */}
        <section
          id="spesifikasi"
          aria-labelledby="spesifikasi-title"
          className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <SectionHeading
              id="spesifikasi"
              title={`Spesifikasi Tipe ${name}`}
              intro={`Angka di bawah mengikuti pricelist dan denah resmi. Ketersediaan unit per blok berubah cepat ${SLASH} konfirmasi ke marketing sebelum memutuskan.`}
            />

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SpecItem icon={Maximize} label="Luas bangunan" value={`${unit.lb} m²`} />
              <SpecItem icon={Ruler} label="Luas tanah" value={`${unit.lt} m²`} />
              {unit.bedrooms !== null ? (
                <SpecItem icon={BedDouble} label="Kamar tidur" value={`${bedroomLabel(unit)} kamar`} />
              ) : null}
              {unit.bathrooms !== null ? (
                <SpecItem icon={Bath} label="Kamar mandi" value={`${bathroomLabel(unit)} kamar`} />
              ) : null}
              {unit.carports !== null ? (
                <SpecItem icon={CarFront} label="Carport" value={`${unit.carports} mobil`} />
              ) : null}
              {unit.floors !== null ? (
                <SpecItem icon={Layers} label="Jumlah lantai" value={`${unit.floors} lantai`} />
              ) : null}
              <SpecItem icon={Zap} label="Daya listrik" value={PROJECT_ELECTRICAL} />
              <SpecItem icon={ScrollText} label="Legalitas" value={PROJECT_LEGALITY} />
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[#0b120c]/62">
              Stok berubah cepat dan wajib merujuk siteplan terbaru, bukan angka statis di
              halaman ini.{" "}
              <Link
                href="/update-stok-siteplan-grand-duta-city-parung"
                className="font-medium text-[#A85D16] hover:underline"
              >
                Lihat update stok &amp; siteplan
              </Link>
              . Spesifikasi bangunan yang berlaku untuk seluruh kawasan (pondasi, struktur,
              dinding, sanitair) ada di{" "}
              <Link href={clusterPath} className="font-medium text-[#A85D16] hover:underline">
                halaman {clusterLabel}
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── Denah — hanya bila asetnya benar-benar ada ── */}
        {unit.floorPlanImage ? (
          <section
            id="denah"
            aria-labelledby="denah-title"
            className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
          >
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
              <SectionHeading
                id="denah"
                title={`Denah Tipe ${name}`}
                intro="Klik gambar untuk memperbesar dan melihat pembagian ruang lebih detail."
              />
              <div className="relative mt-8 h-80 overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-white sm:h-96 md:h-[620px]">
                <ClickableSiteplanImage
                  src={unit.floorPlanImage}
                  alt={`Denah tipe ${name} ${size} ${clusterLabel} GDC Parung`}
                  fill
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-contain p-4"
                  title={`Denah Tipe ${name} ${size}`}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Video — disembunyikan bila belum ada asetnya ── */}
        {video ? (
          <section
            id="video"
            aria-labelledby="video-title"
            className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
          >
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
              <SectionHeading
                id="video"
                title={`Video ${clusterLabel}`}
                intro="Suasana kawasan dan lingkungan cluster tempat tipe ini berada."
              />
              <div className="mt-8 max-w-4xl">
                <VideoEmbed
                  url={video.url}
                  poster={video.poster ?? unit.facadeImage}
                  title={video.title}
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Fasilitas kawasan — RINGKASAN, uraiannya milik halaman lain ── */}
        <section
          id="fasilitas"
          aria-labelledby="fasilitas-title"
          className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <SectionHeading
              id="fasilitas"
              title="Fasilitas Kawasan"
              intro="Fasilitas berikut berlaku untuk seluruh penghuni kawasan, termasuk pemilik tipe ini."
            />

            <ul className="mt-8 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
              {facilities.map((facility) => {
                const Icon = FACILITY_ICON[facility.icon];
                return (
                  <li
                    key={facility.title}
                    className="flex items-center gap-3 rounded-2xl border border-[#0b120c]/10 bg-white/60 p-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F5A524]/15 text-[#A85D16]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium leading-snug text-[#0b120c]/80 sm:text-sm">
                      {facility.title}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 text-sm text-[#0b120c]/62">
              Foto fasilitas selengkapnya ada di{" "}
              <Link href="/galeri" className="font-medium text-[#A85D16] hover:underline">
                galeri kawasan
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── Aksesibilitas — RINGKASAN, uraiannya milik /lokasi-akses-* ── */}
        <section
          id="lokasi"
          aria-labelledby="lokasi-title"
          className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <SectionHeading
              id="lokasi"
              title="Aksesibilitas"
              intro="Ringkasan akses dari kawasan. Peta, rincian jarak per exit tol, dan rute alternatif dibahas lengkap di halaman lokasi."
            />

            <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ACCESS_SUMMARY.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#0b120c]/10 bg-white/60 p-5"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0b120c]/50">
                    {item.label}
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-[#0b120c]">{item.value}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/lokasi-akses-grand-duta-city-parung"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#A85D16] hover:underline"
            >
              Lihat peta dan rincian akses <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* ── Siteplan cluster — berbeda per cluster ── */}
        <section
          id="siteplan"
          aria-labelledby="siteplan-title"
          className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
        >
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <SectionHeading
              id="siteplan"
              title={`Siteplan ${clusterLabel}`}
              intro={`Posisi blok dan kavling di ${clusterLabel}. Klik untuk memperbesar. Ketersediaan per kavling berubah cepat, jadi selalu konfirmasi ke marketing.`}
            />
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-white">
              <ClickableSiteplanImage
                src={siteplan.url}
                alt={siteplan.alt}
                fill
                sizes="(max-width: 768px) 100vw, 1100px"
                className="object-contain p-2"
                title={siteplan.alt}
              />
            </div>
          </div>
        </section>

        {/* ── Tabel banding terhadap tetangga cluster — beda di setiap halaman ── */}
        {siblings.length > 0 ? (
          <section
            id="banding"
            aria-labelledby="banding-title"
            className="scroll-mt-24 border-b border-[#0b120c]/10 py-14 md:py-20"
          >
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
              <SectionHeading
                id="banding"
                title={`Banding dengan Tipe Lain di ${clusterLabel}`}
                intro={`Kalau ukuran atau harga tipe ${name} belum pas, tipe di bawah berada di cluster yang sama dengan fasilitas dan akses yang identik.`}
              />

              <div className="mt-8 overflow-x-auto rounded-2xl border border-[#0b120c]/10">
                <table className="w-full min-w-[620px] border-collapse bg-white/60 text-left text-sm">
                  <caption className="sr-only">
                    Perbandingan spesifikasi tipe {name} dengan tipe lain di {clusterLabel}
                  </caption>
                  <thead>
                    <tr className="border-b border-[#0b120c]/10 text-[10px] uppercase tracking-[0.18em] text-[#0b120c]/55">
                      <th scope="col" className="px-5 py-4 font-semibold">Tipe</th>
                      <th scope="col" className="px-5 py-4 font-semibold">LB / LT</th>
                      <th scope="col" className="px-5 py-4 font-semibold">KT / KM</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Lantai</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Harga mulai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#0b120c]/8 bg-[#F5A524]/10">
                      <th scope="row" className="px-5 py-4 font-semibold text-[#0b120c]">
                        {name} {SLASH} halaman ini
                      </th>
                      <td className="px-5 py-4">{unit.lb} / {unit.lt} m²</td>
                      <td className="px-5 py-4">
                        {bedroomLabel(unit)} / {bathroomLabel(unit)}
                      </td>
                      <td className="px-5 py-4">{unit.floors !== null ? unit.floors : "-"}</td>
                      <td className="px-5 py-4">{priceDisplay}</td>
                    </tr>
                    {siblings.map((sibling) => {
                      const sName = unitDisplayName(sibling);
                      return (
                        <tr key={sibling.id} className="border-b border-[#0b120c]/8 last:border-0">
                          <th scope="row" className="px-5 py-4 font-medium">
                            <Link
                              href={unitPagePath(sibling)}
                              className="text-[#A85D16] hover:underline"
                            >
                              {sName} {unitSizeLabel(sibling)}
                            </Link>
                            {sibling.status === "sold-out" ? (
                              <span className="ml-2 text-[10px] uppercase tracking-widest text-[#0b120c]/45">
                                sold out
                              </span>
                            ) : null}
                          </th>
                          <td className="px-5 py-4">{sibling.lb} / {sibling.lt} m²</td>
                          <td className="px-5 py-4">
                            {bedroomLabel(sibling)} / {bathroomLabel(sibling)}
                          </td>
                          <td className="px-5 py-4">
                            {sibling.floors !== null ? sibling.floors : "-"}
                          </td>
                          <td className="px-5 py-4">
                            {sibling.status === "coming-soon"
                              ? sibling.priceLabel
                              : `Rp ${sibling.priceLabel}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-6 text-sm text-[#0b120c]/62">
                Daftar seluruh tipe ada di{" "}
                <Link href="/tipe-rumah" className="font-medium text-[#A85D16] hover:underline">
                  hub tipe rumah
                </Link>
                .
              </p>
            </div>
          </section>
        ) : null}

        {/* ── CTA penutup ── */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-screen-xl px-4 sm:px-6 md:px-14">
            <div className="rounded-3xl bg-[#0b120c] px-6 py-12 text-center sm:px-10 md:px-14">
              <h2 className="font-serif text-2xl font-semibold text-[#F5F1E8] sm:text-3xl md:text-4xl">
                Minat dengan Tipe {name}?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm text-[#F5F1E8]/72 sm:text-base">
                Marketing dapat mengirim pricelist terbaru, denah resolusi tinggi, dan
                simulasi KPR sesuai kemampuan cicilan Anda.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href={waHref}
                  data-wa-placement="tipe-rumah-bottom-cta"
                  data-wa-unit={`${name} ${size}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0b120c] transition-colors hover:bg-brand-light"
                >
                  Chat marketing sekarang <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/tipe-rumah"
                  className="inline-flex items-center justify-center rounded-full border border-[#F5F1E8]/25 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#F5F1E8] transition-colors hover:bg-[#F5F1E8]/10"
                >
                  Lihat semua tipe
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Bar CTA melekat, HANYA di bawah lg ──
          Di desktop tugas ini sudah dipegang kartu ringkasan yang sticky. Di
          ponsel kartu itu ikut tergulir hilang, dan harga plus tombol adalah dua
          hal yang paling sering dicari pengunjung. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0b120c]/10 bg-brand-light/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] uppercase tracking-wider text-[#0b120c]/50">
              Tipe {name} {size}
            </div>
            <div className="truncate font-serif text-base font-bold text-[#A85D16]">
              {priceDisplay}
            </div>
          </div>
          <a
            href={waHref}
            data-wa-placement="tipe-rumah-sticky-mobile"
            data-wa-unit={`${name} ${size}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-[#C8521A] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
          >
            Tanya unit
          </a>
        </div>
      </div>

      <Footer />
    </>
  );
}
