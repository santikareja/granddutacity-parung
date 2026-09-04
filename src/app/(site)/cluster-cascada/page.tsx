import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OG_SITE_NAME } from "@/lib/seo";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CarFront,
  CheckCircle2,
  Dumbbell,
  Home,
  MapPin,
  Maximize,
  Phone,
  ShieldCheck,
  Trees,
  Wallet,
} from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { ClusterFaqKprSection } from "@/components/sections/cluster-faq-kpr-section";
import { ClusterSpecs } from "@/components/sections/cluster-specs";
import { ClusterUnits } from "@/components/sections/cluster-units";
import { InlineVideoCard } from "@/components/ui/inline-video-card";
import { Header } from "@/components/ui/header-2";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { propertyTypes } from "@/lib/data";
import {
  SCHEMA_ID,
  breadcrumbNode,
  clusterOfferCatalogNode,
  graph,
  ref,
  serializeJsonLd,
} from "@/lib/schema";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/cluster-cascada`;
const HERO_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671246/cluster_cascada_gate_ecyykh.webp";
const FEATURED_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775922661/cluster-cascada-gdc-parung_qgy4jc.webp";
const FACADE_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917573/Cluster-Cascada-grand-duta-city-parung_bsre5n.jpg";
const VIDEO_URL = "https://res.cloudinary.com/dxgoshyei/video/upload/v1780901924/Di_tengah_aktivitas_yang_semakin_cepat_punya_ruang_untuk_menikmati_waktu_dengan_lebih_tenang_ja_gwlttb.mp4";
const SITEPLAN_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818893/Cascada_Update_Stock_9_Maret_2026-1_vcrnzw.webp";
const ALT_TEXT = "Cluster Cascada Grand Duta City Parung South of Jakarta";

/** Diekspor untuk guard G19 (seo-invariants.test.ts). */
export const PAGE_H1 = "Cluster Cascada — Aira, Manoa, Victoria & Alexandra";

const cascadaUnits = propertyTypes.filter((unit) => unit.cluster === "Cluster Cascada");
const getUnit = (id: string) => cascadaUnits.find((unit) => unit.id === id)!;

const featuredUnits = [
  { unit: getUnit("alexandra-88"), plan: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917838/cluster-cascada-tipe-alexandra_urmnh4.webp" },
  { unit: getUnit("victoria-69"), plan: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917834/cluster-cascada-tipe-victoria_xntjns.webp" },
  { unit: getUnit("manoa-58"), plan: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917835/cluster-cascada-tipe-manoa_xdmt5m.webp" },
  { unit: getUnit("aira-42"), plan: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917837/cluster-cascada-tipe-aira_q7et6h.webp" },
];

const cascadaFaqs = [
  {
    question: "Apa saja tipe rumah Cluster Cascada Grand Duta City Parung?",
    answer:
      "Tipe yang ditampilkan pada halaman ini meliputi Aira+ 42/60, Manoa 58/60, Victoria 69/72, Alexandra 88/105, serta Keila 47/72 yang saat ini ditandai sold out.",
  },
  {
    question: "Berapa harga Cluster Cascada Grand Duta City?",
    answer:
      "Harga mulai dari 800 Juta-an untuk tipe entry, lalu naik sesuai ukuran bangunan dan luas tanah. Untuk promo dan simulasi KPR terbaru, konfirmasi langsung ke marketing.",
  },
  {
    question: "Apa keunggulan utama Cluster Cascada?",
    answer:
      "Keunggulan utamanya meliputi smart home dan digital door lock, desain minimalis tropis, akses dekat tol, kawasan hijau 200 hektare, clubhouse, The Beach, serta fasilitas internal untuk keluarga aktif.",
  },
  {
    question: "Bagaimana cara survey dan membandingkan Cascada dengan Ladera?",
    answer:
      "Anda bisa menghubungi marketing untuk menjadwalkan survey, lalu membandingkan tipe, harga, akses, dan karakter lingkungan Cascada dengan Cluster Ladera sesuai kebutuhan keluarga Anda.",
  },
];

// Title dipendekkan dari 65 -> 51 karakter dan frasa "South of Jakarta"
// dicabut. Description sebelumnya BYTE-IDENTICAL dengan /cluster-ladera;
// sekarang dibedakan lewat tema resort tropis dan nama tipe unit Cascada.
// Keyword yang memuat frasa target homepage juga dicabut (Fase 1).
const PAGE_TITLE = "Cluster Cascada GDC Parung: Tipe, Harga & Stok Unit";
const PAGE_DESCRIPTION =
  "Cluster Cascada bertema Modern Tropical Resort di GDC Parung. Tipe Aira 42, Manoa 58, Victoria 69, dan Alexandra 88 — denah, harga KPR, dan blok tersedia.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  keywords: [
    "cluster cascada parung",
    "cluster cascada gdc",
    "harga cluster cascada",
    "denah cluster cascada",
    "tipe rumah cluster cascada",
    "tipe alexandra 88",
    "tipe victoria 69",
  ],
  alternates: { canonical: PAGE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [{ url: FEATURED_IMAGE, width: 1200, height: 630, alt: ALT_TEXT }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [FEATURED_IMAGE],
  },
};

export default function ClusterCascadaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            graph([
              // `breadcrumbNode()` menggantikan susunan inline (4 September 2026).
              //
              // Versi inline memakai `item: ${SITE_URL}/` — dengan garis miring —
              // sementara builder dan 61 breadcrumb lain memakai `SITE_URL` tanpa
              // garis miring, sama dengan canonical homepage. Akibatnya sinyal
              // "Beranda adalah akar situs" terbelah ke dua bentuk URL. Memakai
              // builder membuat bentuknya punya satu sumber sekaligus ikut
              // terlindungi guard test-nya.
              breadcrumbNode(
                [{ name: "Cluster Cascada", path: "/cluster-cascada" }],
                PAGE_URL,
              ),
              {
                "@type": "ImageObject",
                "@id": `${PAGE_URL}#primaryimage`,
                url: FEATURED_IMAGE,
                contentUrl: FEATURED_IMAGE,
                caption: ALT_TEXT,
              },
              {
                "@type": "WebPage",
                "@id": `${PAGE_URL}#webpage`,
                url: PAGE_URL,
                name: "Cluster Cascada Grand Duta City Parung | Cascada South of Jakarta",
                description:
                  "Informasi Cluster Cascada Grand Duta City Parung lengkap: tipe unit, denah, spesifikasi, harga, lokasi cluster, fasilitas, dan update stok terbaru.",
                isPartOf: ref(SCHEMA_ID.website),
                about: ref(SCHEMA_ID.clusterCascada),
                breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
                primaryImageOfPage: ref(`${PAGE_URL}#primaryimage`),
                inLanguage: "id",
              },
              // Sebelumnya katalog ini disusun inline dan menyatakan `InStock`
              // untuk setiap unit yang tidak ditandai sold out. Pemilik
              // menegaskan hardcode itu tidak akurat, jadi builder bersama
              // memetakan status `check-siteplan` ke `LimitedAvailability`.
              clusterOfferCatalogNode("cascada", PAGE_URL),
            ]),
          ),
        }}
      />
      <Header />
      <main className="relative w-full overflow-hidden bg-brand-light">
        <section className="relative flex min-h-[78vh] items-end overflow-hidden bg-[#0b120c] lg:min-h-[100dvh]">
          <Image src={HERO_IMAGE} alt={ALT_TEXT} fill priority sizes="100vw" className="object-cover opacity-55" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,12,0.25)_0%,rgba(11,18,12,0.45)_40%,rgba(11,18,12,0.92)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-screen-xl px-6 pb-16 pt-28 md:px-14 md:pb-20">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Cluster Cascada" }
              ]} />
            </div>
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#F5A524]">Modern Tropical Resort</p>
            {/* H1 dan eyebrow sebelumnya mengulang frasa target homepage
                ("Cluster Cascada Grand Duta City Parung" + "Cascada South of
                Jakarta"). Diganti nama tipe unit supaya halaman ini menang di
                query tipe. Frasa brand tetap ada sebagai anchor ke "/". */}
            <h1 className="max-w-5xl font-serif text-5xl font-bold leading-[0.95] text-[#F5F1E8] md:text-7xl lg:text-8xl">
              {PAGE_H1}
            </h1>
            <p className="mt-8 max-w-3xl text-base leading-relaxed text-[#F5F1E8]/82 md:text-xl">
              Cluster Cascada di kawasan{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              menghadirkan hunian modern minimalis tropis dengan fitur smart home, akses strategis
              dekat tol, fasilitas kawasan lengkap, dan harga mulai Rp800 jutaan.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link href="/pricelist-grand-duta-city" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c] hover:bg-brand-light">
                Cek harga Cluster Cascada <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/update-stok-siteplan-grand-duta-city-parung#cluster-cascada" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F5F1E8]/25 bg-brand-light/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#F5F1E8] hover:border-[#F5A524] hover:text-[#F5A524]">
                Lihat stok Cluster Cascada <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                ["Tipe Utama", "Aira+, Manoa, Victoria, Alexandra"],
                ["Harga Mulai", "800 Juta-an"],
                ["Lokasi", "Parung, Bogor"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#F5F1E8]/10 bg-brand-light/6 px-5 py-5 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#F5A524]/90">{label}</p>
                  <p className="mt-2 text-sm font-medium text-[#F5F1E8] md:text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tentang-kami" className="scroll-mt-28 bg-brand-light py-24">
          <div className="mx-auto grid max-w-screen-xl gap-14 px-6 md:px-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-[#0b120c]/10 shadow-lg">
                <Image src={FACADE_IMAGE} alt={ALT_TEXT} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
              </div>
            </div>
            <div className="lg:col-span-7">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Ringkasan Cluster Cascada</p>
              <h2 className="font-serif text-4xl font-semibold text-[#0b120c] md:text-5xl">Cascada Grand Duta City</h2>
              <p className="mt-6 text-base leading-relaxed text-[#0b120c]/75">
                Temukan harmoni kehidupan modern di Cluster Cascada{" "}
                <Link href="/" className="font-medium text-[#A85D16] underline decoration-[#F5A524]/40 underline-offset-2 hover:text-[#F5A524]">Grand Duta City Parung</Link>. Didesain dengan gaya minimalis tropis yang elegan, klaster ini adalah jawaban bagi Anda yang mendambakan hunian prestisius dengan fasilitas super lengkap. Nikmati kenyamanan tinggal di kawasan mandiri seluas 200 hektare dengan akses tol terdekat di Selatan Jakarta.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[
                  "Dilengkapi fitur Smart Home System & Digital Door Lock untuk keamanan maksimal keluarga Anda.",
                  "Arsitektur modern tropis dengan High Ceiling, memastikan rumah lebih sejuk dan sirkulasi udara lebih sehat.",
                  "Lingkungan eksklusif di kota mandiri 200 Ha dengan The Beach, Clubhouse, dan ruang terbuka hijau.",
                  "Peluang investasi bernilai tinggi dengan harga perdana mulai Rp 800 Jutaan dan kemudahan cara bayar.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#0b120c]/8 bg-brand-light px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F5A524]" />
                    <p className="text-sm leading-relaxed text-[#0b120c]/75">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link href="/lokasi-akses-gdc-parung" className="inline-flex items-center gap-2 rounded-full border border-[#F5A524]/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#F5A524] hover:border-[#F5A524] hover:bg-[#F5A524] hover:text-[#F5F1E8]">
                  Pelajari Lokasi & Akses
                </Link>
                <Link href="/cluster-ladera" className="inline-flex items-center gap-2 rounded-full border border-[#0b120c]/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#0b120c] hover:border-[#0b120c] hover:bg-[#0b120c] hover:text-[#F5F1E8]">
                  Bandingkan dengan Ladera
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="keunggulan" className="scroll-mt-28 bg-[#0b120c] py-24 text-[#F5F1E8]">
          <div className="mx-auto grid max-w-screen-xl gap-14 px-6 md:px-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Fasilitas Premium</p>
              <h2 className="font-serif text-4xl font-semibold md:text-5xl">Gaya hidup eksklusif dengan akses yang memudahkan mobilitas Anda</h2>
              <p className="mt-6 text-base leading-relaxed text-[#F5F1E8]/75">
                Cluster Cascada menjanjikan kualitas hidup terbaik. Dirancang tidak hanya sebagai tempat tinggal, namun juga menjadi rumah di mana anak Anda tumbuh dan mengeksplorasi lingkungan dengan aman dan nyaman.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: "One Gate System & CCTV" },
                  { icon: MapPin, label: "15 Menit ke Pintu Tol" },
                  { icon: Building2, label: "Clubhouse, pool & The Beach" },
                  { icon: Trees, label: "Kawasan hijau 200 hektare" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl border border-[#F5F1E8]/10 bg-brand-light/5 p-5">
                    <Icon className="h-6 w-6 text-[#F5A524]" />
                    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5F1E8]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7">
              <InlineVideoCard
                src={VIDEO_URL}
                poster={FACADE_IMAGE}
                ariaLabel="Video keunggulan utama Cluster Cascada Grand Duta City Parung"
                className="max-w-[530px] lg:mr-0"
                videoClassName="max-h-[580px] max-w-[455px]"
              />
            </div>
          </div>
        </section>

        <ClusterUnits clusterName="Cluster Cascada" sectionId="tipe-unit" />

        <section className="bg-brand-light py-24 [content-visibility:auto] [contain-intrinsic-size:1px_980px]">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="max-w-3xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#0b120c]">Denah Cluster Cascada</p>
              <h2 className="font-serif text-4xl font-semibold text-[#0b120c] md:text-5xl">Denah dan detail per tipe rumah Cluster Cascada</h2>
            </div>
            <div className="mt-16 space-y-16">
              {featuredUnits.map((item, index) => (
                <div key={item.unit.id} className="grid items-center gap-10 border-b border-[#0b120c]/8 pb-16 last:border-none last:pb-0 lg:grid-cols-12">
                  <div className={`lg:col-span-6 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-[#0b120c]/10 bg-brand-light shadow-md">
                      <Image src={item.plan} alt={`Denah ${item.unit.name} Cluster Cascada Grand Duta City Parung`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 48vw, 620px" className="object-contain p-4" />
                    </div>
                  </div>
                  <div className={`lg:col-span-6 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="inline-flex rounded-full bg-[#0b120c]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c]">{item.unit.typeCategory.replace("Type", "Tipe")}</div>
                    <h3 className="mt-5 font-serif text-4xl font-bold text-[#0b120c]">{item.unit.name}</h3>
                    <p className="mt-4 text-2xl font-medium text-[#0b120c]">Rp {item.unit.price}</p>
                    <div className="mt-6 flex flex-wrap gap-5 border-y border-[#0b120c]/10 py-5">
                      <div className="flex items-center gap-2 text-[#0b120c]"><BedDouble className="h-5 w-5" /><span className="text-sm font-medium">{item.unit.specs.bed} K.Tidur</span></div>
                      <div className="flex items-center gap-2 text-[#0b120c]"><Bath className="h-5 w-5" /><span className="text-sm font-medium">{item.unit.specs.bath} K.Mandi</span></div>
                      <div className="flex items-center gap-2 text-[#0b120c]"><CarFront className="h-5 w-5" /><span className="text-sm font-medium">{item.unit.specs.carport} Carport</span></div>
                      <div className="flex items-center gap-2 text-[#0b120c]"><Maximize className="h-5 w-5" /><span className="text-sm font-medium">LB {item.unit.specs.lb} / LT {item.unit.specs.lt}</span></div>
                    </div>
                    <p className="mt-6 text-base leading-relaxed text-[#0b120c]/72">{item.unit.desc}</p>
                    <div className="mt-6 space-y-3">
                      {[
                        "Tata ruang (layout) dirancang efisien, memastikan setiap sudut ruangan berfungsi optimal tanpa area terbuang.",
                        "Sirkulasi udara dan pencahayaan alami yang maksimal membuat rumah lebih sejuk, sehat, dan hemat energi.",
                        "Fasad elegan dan mewah ala hunian premium dengan carport ekstra luas.",
                      ].map((highlight) => (
                        <div key={highlight} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0b120c]" />
                          <p className="text-sm leading-relaxed text-[#0b120c]/72">{highlight}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                      <a
                        href={`https://wa.me/628131742034?text=${encodeURIComponent(`Halo, saya tertarik dengan ${item.unit.name} di Cluster Cascada Grand Duta City Parung. Mohon info harga, denah, dan jadwal survey.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-wa-placement="cascada-unit-card"
                        data-wa-unit={item.unit.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#F5F1E8] hover:bg-[#0b120c]"
                      >
                        Tanya {item.unit.name}
                      </a>
                      <Link href="/pricelist-grand-duta-city" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0b120c]/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#0b120c] hover:border-[#F5A524] hover:text-[#F5A524]">
                        Lihat pricelist
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ClusterSpecs />

        <section className="bg-brand-light py-24">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Harga Cluster Cascada Grand Duta City</p>
              <h2 className="font-serif text-4xl font-semibold text-[#0b120c] md:text-5xl">Kisaran harga dan jalur konsultasi yang paling cepat</h2>
            </div>
            {/* Kartu harga kini DITURUNKAN dari `cascadaUnits` (yang berakar di
                src/data/units.ts) dan setiap kartu MENAUT halaman tipenya.
                Sebelumnya array ini hardcode 4 baris nama+ukuran+harga — salinan
                keempat data unit yang bisa menyimpang dari pricelist, sekaligus
                jalan buntu bagi pengunjung yang ingin melihat detail tipe. */}
            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {cascadaUnits
                .filter((unit) => !unit.soldOut)
                .map((unit) => (
                  <Link
                    key={unit.id}
                    href={unit.href}
                    className="group rounded-[28px] border border-[#0b120c]/8 bg-brand-light p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#F5A524]/40 hover:shadow-md"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#F5A524]">
                      {unit.typeCategory} / {unit.specs.lt}
                    </p>
                    <h3 className="mt-4 font-serif text-3xl text-[#0b120c]">{unit.name}</h3>
                    <p className="mt-3 text-lg font-semibold text-[#F5A524]">Mulai {unit.price}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b120c]/60 transition-colors group-hover:text-[#A85D16]">
                      Lihat detail &amp; denah
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {["Cash Keras", "Cash Bertahap", "KPR"].map((method) => (
                <div key={method} className="rounded-full border border-[#0b120c]/10 bg-brand-light px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#F5A524]">
                  {method}
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/pricelist-grand-duta-city" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b120c] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#F5F1E8] hover:bg-[#F5A524]">
                Cek harga Cluster Cascada <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20tanya%20harga%20Cluster%20Cascada%20Grand%20Duta%20City%20Parung." data-wa-placement="cascada-harga-cta" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F5A524]/20 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#F5A524] hover:border-[#F5A524] hover:bg-[#F5A524] hover:text-[#F5F1E8]">
                <Wallet className="h-4 w-4" /> Hubungi marketing
              </a>
            </div>
          </div>
        </section>

        <section className="bg-brand-light py-24">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="mb-14 flex flex-col gap-6 border-b border-[#0b120c]/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Posisi di Dalam Siteplan</p>
                <h2 className="font-serif text-4xl font-semibold text-[#0b120c] md:text-5xl">Posisi Cluster Cascada dan update stok terbaru</h2>
              </div>
              <Link href="/update-stok-siteplan-grand-duta-city-parung#cluster-cascada" className="inline-flex items-center gap-2 rounded-full border border-[#F5A524]/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-[#F5A524] hover:border-[#F5A524] hover:bg-[#F5A524] hover:text-[#F5F1E8]">
                Lihat stok Cluster Cascada
              </Link>
            </div>
            <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-[#0b120c]/10 bg-[#0b120c] shadow-lg">
                  <Image src={SITEPLAN_IMAGE} alt="Siteplan Update Stok Cluster Cascada" fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 720px" className="object-contain p-3" />
                </div>
              </div>
              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-[28px] border border-[#0b120c]/8 bg-brand-light p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5A524]">Sebaran tipe & blok</h3>
                  <ul className="mt-5 space-y-3">
                    {[
                      ["T-42", "Blok H.18 & H.19"],
                      ["T-47", "Blok H.10 & H.11"],
                      ["T-58", "Blok H.15, H.16, H.18"],
                      ["T-69", "Blok H.14"],
                      ["T-88", "Blok H.1 & H.3"],
                    ].map(([type, blocks]) => (
                      <li key={type} className="flex items-start justify-between gap-4 text-sm">
                        <span className="font-semibold text-[#0b120c]">{type}</span>
                        <span className="text-right text-[#0b120c]/70">{blocks}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[28px] border border-[#0b120c]/8 bg-brand-light p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5A524]">Status geografis</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#0b120c]/72">
                    Posisi Cluster Cascada berada di dalam kawasan kota mandiri Grand Duta City South of
                    Jakarta, sehingga menarik untuk dihuni sekaligus dipertimbangkan sebagai investasi
                    properti jangka menengah hingga panjang.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20cek%20ketersediaan%20unit%20di%20Cluster%20Cascada." data-wa-placement="cascada-cek-stok" target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F5A524] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#F5F1E8] hover:bg-[#0b120c]">
                    <Phone className="h-4 w-4" /> Cek ketersediaan Cascada
                  </a>
                  <Link href="/lokasi-akses-gdc-parung" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#0b120c]/10 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#0b120c] hover:border-[#F5A524] hover:text-[#F5A524]">
                    <MapPin className="h-4 w-4" /> Lihat detail lokasi
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fasilitas" className="scroll-mt-28 bg-brand-light py-24">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Fasilitas Pendukung</p>
              <h2 className="font-serif text-4xl font-semibold text-[#0b120c] md:text-5xl">Fasilitas yang mendukung kenyamanan tinggal di Cluster Cascada</h2>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Smart Home & Keamanan", desc: "Setiap unit dilengkapi digital door lock dan sistem elektronik via smartphone untuk kenyamanan sehari-hari." },
                { icon: Building2, title: "Clubhouse & Private Pool Lounge", desc: "Fasilitas internal eksklusif menghadirkan area bersantai dan aktivitas keluarga dalam satu kawasan." },
                { icon: Dumbbell, title: "Jogging, Cycling & Play Area", desc: "Area jogging, cycling, dan taman bermain anak mendukung gaya hidup aktif tanpa perlu jauh dari rumah." },
                { icon: Home, title: "Desain Minimalis Tropis", desc: "Konsep rumah yang sejuk dan terang memberi suasana tinggal yang nyaman dengan tampilan elegan." },
                { icon: Trees, title: "The Beach & Central Park", desc: "Dekat dengan area hangout The Beach F&B dan Central Park 4.000 m2 yang memperkaya gaya hidup penghuni." },
                { icon: MapPin, title: "Infrastruktur Kawasan Modern", desc: "Jaringan kabel underground dan jalan lingkungan yang lebar membuat kawasan terlihat rapi dan nyaman." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-[28px] border border-[#0b120c]/8 bg-brand-light p-6 shadow-sm hover:shadow-md transition-shadow">
                  <Icon className="h-7 w-7 text-[#F5A524]" />
                  <h3 className="mt-5 font-serif text-2xl text-[#0b120c]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/72">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ClusterFaqKprSection
          sectionId="faq-kpr-cascada"
          eyebrow="FAQ & Simulasi KPR"
          title="Pertanyaan umum dan simulasi KPR Cluster Cascada"
          faqs={cascadaFaqs}
          clusterName="Cluster Cascada"
          initialPrice={800000000}
          minPrice={800000000}
          maxPrice={1600000000}
          whatsappText="Halo, saya ingin konsultasi simulasi KPR dan jadwal survey untuk Cluster Cascada Grand Duta City Parung."
        />

        <section className="bg-[#0b120c] py-20 text-[#F5F1E8]">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="grid gap-10 rounded-[32px] border border-[#F5F1E8]/10 bg-brand-light/5 p-8 md:p-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#F5A524]">Survey & Informasi Internal</p>
                <h2 className="font-serif text-4xl font-semibold md:text-5xl">Temukan informasi Cluster Cascada sesuai kebutuhan Anda.</h2>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#F5F1E8]/75">
                  Anda bisa langsung cek pricelist, melihat stok unit di siteplan, mempelajari akses
                  lokasi, atau menghubungi tim marketing untuk konsultasi dan mengatur jadwal survey.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["/", "Grand Duta City Parung"],
                  ["/pricelist-grand-duta-city", "Cek harga Cluster Cascada"],
                  ["/update-stok-siteplan-grand-duta-city-parung#cluster-cascada", "Lihat stok Cluster Cascada"],
                  ["/lokasi-akses-gdc-parung", "Lihat detail lokasi & akses GDC Parung"],
                  ["/cluster-ladera", "Bandingkan dengan Cluster Ladera"],
                  ["/cara-beli-kpr", "Cara beli & KPR"],
                  ["/kontak", "Kontak marketing"],
                ].map(([href, label]) => (
                  <Link key={label as string} href={href as string} className="rounded-2xl border border-[#F5F1E8]/10 px-5 py-4 text-sm font-medium text-[#F5F1E8]/80 hover:border-[#F5A524] hover:text-[#F5A524]">
                    {label}
                  </Link>
                ))}
                <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20jadwal%20survey%20Cluster%20Cascada%20Grand%20Duta%20City%20Parung." data-wa-placement="cascada-jadwal-survey" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-[#F5A524]/50 bg-[#F5A524]/10 px-5 py-4 text-sm font-semibold text-[#F5A524] hover:bg-[#F5A524] hover:text-[#0b120c]">
                  Hubungi marketing untuk survey
                </a>
              </div>
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-[#F5F1E8]/20 px-8 py-3 text-xs font-bold uppercase tracking-[0.24em] text-[#F5F1E8] hover:border-[#F5A524] hover:text-[#F5A524]">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
