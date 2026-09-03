import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { ClusterFaqKprSection } from "@/components/sections/cluster-faq-kpr-section";
import { ClusterSpecs } from "@/components/sections/cluster-specs";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AmbientVideo } from "@/components/ui/ambient-video";
import { ArrowRight, ShieldCheck, TreePine, Bike, Footprints, Recycle, MapPin, Maximize, BedDouble, Bath, CarFront, Layers, Zap, ScrollText } from "lucide-react";
import {
  SCHEMA_ID,
  breadcrumbNode,
  clusterOfferCatalogNode,
  graph,
  ref,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";
import {
  PROJECT_ELECTRICAL,
  PROJECT_LEGALITY,
  bathroomLabel,
  bedroomLabel,
  getUnitsByCluster,
  unitDisplayName,
  unitFacadeAlt,
  unitPagePath,
  unitSizeLabel,
  type Unit,
} from "@/data/units";

const PAGE_URL = `${SITE_URL}/cluster-ladera`;

/** Diekspor untuk guard G19 (seo-invariants.test.ts). */
export const PAGE_H1 = "Cluster Ladera — Verona, Malta, Tuscan & Frontera";

// Title dipendekkan dari 88 -> 50 karakter dan brand tag menggantung dicabut.
// Description sebelumnya BYTE-IDENTICAL dengan /cluster-cascada; sekarang
// dibedakan lewat tema arsitektur dan nama tipe unit yang khas Ladera.
export const metadata: Metadata = {
  title: "Cluster Ladera GDC Parung: Tipe, Harga & Stok Unit",
  description:
    "Cluster Ladera American Classic di GDC Parung: tipe Verona, Malta, Tuscan & Frontera (39-89 m²) mulai Rp 600 jutaan. Lihat denah, spesifikasi & harga KPR.",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  alternates: {
    canonical: PAGE_URL,
  },
};

const HERO_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp";
const HERO_ALT = "Gerbang Cluster Ladera GDC Parung";

/**
 * SATU `@graph` menggantikan tiga blok JSON-LD terpisah tanpa `@id`.
 *
 * Sebelum Fase 5 halaman ini mengemit `BreadcrumbList`, `WebPage`, dan
 * `OfferCatalog` sebagai tiga dokumen yang tidak saling kenal, sehingga Google
 * tidak bisa menyimpulkan bahwa unit-unit itu berada di dalam kawasan yang sama
 * dengan entitas `Place` di homepage. `OfferCatalog`-nya juga hardcode dan
 * sudah menyimpang dari pricelist resmi; kini dibangun dari `src/data/units.ts`.
 */
const pageSchema = graph([
  breadcrumbNode([{ name: "Cluster Ladera", path: "/cluster-ladera" }], PAGE_URL),
  {
    "@type": "ImageObject",
    "@id": `${PAGE_URL}#primaryimage`,
    url: HERO_IMAGE,
    contentUrl: HERO_IMAGE,
    caption: HERO_ALT,
  },
  {
    "@type": "WebPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: "Cluster Ladera Grand Duta City Parung",
    description:
      "Informasi Cluster Ladera Grand Duta City Parung lengkap: tipe unit, denah, spesifikasi, harga, lokasi cluster, fasilitas, dan update stok terbaru.",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.clusterLadera),
    breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
    primaryImageOfPage: ref(`${PAGE_URL}#primaryimage`),
    inLanguage: "id",
  },
  clusterOfferCatalogNode("ladera", PAGE_URL),
]);

const faqData = [
  {
    question: "Apa saja tipe unit yang tersedia di Cluster Ladera?",
    answer: "Cluster Ladera menawarkan 4 tipe rumah bertema American Classic Modern: Verona 39/60, Malta 47/72, Tuscan 66/72, dan Frontera 89/90."
  },
  {
    question: "Berapa harga rumah di Cluster Ladera?",
    answer: "Harga tunai keras mulai dari Rp 600 jutaan untuk Tipe Verona 39/60, Rp 800 jutaan untuk Malta 47/72, Rp 1,1 Miliar untuk Tuscan 66/72, hingga Rp 1,6 Miliar untuk Frontera 89/90. Harga KPR lebih tinggi dari harga tunai dan dapat berubah sewaktu-waktu, hubungi marketing kami untuk pricelist terbaru."
  },
  {
    question: "Bagaimana cara menuju Grand Duta City Parung?",
    answer: "Grand Duta City Parung berlokasi strategis di Selatan Jakarta, mudah diakses melalui Tol Pamulang (Desari) maupun Tol Kayu Manis (BORR)."
  }
];

// Tipe Ladera diambil dari SUMBER TUNGGAL units.ts, bukan dihardcode. Sebelum
// ini halaman menuliskan Tuscan dan Malta sebagai ~60 baris JSX per tipe —
// salinan keempat dari data unit yang persis dibereskan Fase 3. Menambah Verona
// dan Frontera dengan cara lama berarti menggandakan lagi kesempatan angka
// menyimpang. Urutannya mengikuti units.ts: Verona, Malta, Tuscan, Frontera.
const laderaUnits = getUnitsByCluster("ladera").filter((unit) => unit.showInCatalog);

const waHref = (unit: Unit) => {
  const msg = `Halo, saya tertarik dengan Tipe ${unitDisplayName(unit)} ${unitSizeLabel(unit)} di Cluster Ladera Grand Duta City Parung. Boleh minta info harga, denah, dan ketersediaan unitnya?`;
  return `https://wa.me/628131742034?text=${encodeURIComponent(msg)}`;
};

/** Satu sel spesifikasi dengan ikon dekoratif; makna dibawa teks. */
function SpecPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BedDouble;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#0b120c]/8 bg-white/60 px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F5A524]/15 text-[#b86d0e]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-semibold text-[#0b120c]">{value}</span>
        <span className="block text-[10px] uppercase tracking-wider text-[#0b120c]/50">{label}</span>
      </span>
    </div>
  );
}

/**
 * Blok satu tipe rumah: fasad + spesifikasi + CTA, lalu denah lantai di bawah.
 * Selang-seling kiri/kanan pada desktop (index genap/ganjil) memberi ritme
 * visual; di mobile selalu menumpuk dengan gambar lebih dulu.
 */
function TypeShowcase({ unit, index }: { unit: Unit; index: number }) {
  const name = unitDisplayName(unit);
  const size = unitSizeLabel(unit);
  const detailPath = unitPagePath(unit);
  const facadeReversed = index % 2 === 1;

  return (
    <article className="mb-16 sm:mb-20 last:mb-0">
      <div
        className={`flex flex-col gap-8 lg:items-stretch ${
          facadeReversed ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        {/* Fasad */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
            <Image
              src={unit.facadeImage}
              alt={unitFacadeAlt(unit)}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full bg-[#0b120c]/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F1E8] backdrop-blur-sm">
              Tipe {size}
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="flex w-full flex-col lg:w-1/2">
          <h3 className="font-serif text-3xl font-bold text-[#0b120c] sm:text-4xl">
            Tipe {name}
          </h3>
          <p className="mt-2 text-2xl font-semibold text-[#b86d0e]">Rp {unit.priceLabel}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SpecPill icon={Maximize} value={`${unit.lb} / ${unit.lt} m²`} label="LB / LT" />
            <SpecPill icon={BedDouble} value={`${bedroomLabel(unit)}`} label="Kamar Tidur" />
            <SpecPill icon={Bath} value={`${bathroomLabel(unit)}`} label="Kamar Mandi" />
            {unit.carports !== null && (
              <SpecPill icon={CarFront} value={`${unit.carports}`} label="Carport" />
            )}
            {unit.floors !== null && (
              <SpecPill icon={Layers} value={`${unit.floors}`} label="Lantai" />
            )}
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#0b120c]/60">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5" aria-hidden="true" /> Listrik {PROJECT_ELECTRICAL}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScrollText className="size-3.5" aria-hidden="true" /> Legalitas {PROJECT_LEGALITY}
            </span>
          </p>

          <p className="mt-5 font-sans leading-relaxed text-[#0b120c]/75">{unit.description}</p>

          <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
            <a
              href={waHref(unit)}
              data-wa-placement={`ladera-tipe-${unit.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F5A524] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0b120c] transition-colors hover:bg-[#0b120c] hover:text-[#F5F1E8]"
            >
              Tanya Promo Tipe {name}
            </a>
            <Link
              href={detailPath}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#0b120c]/20 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0b120c] transition-colors hover:border-[#F5A524] hover:text-[#b86d0e]"
            >
              Denah &amp; Detail <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Denah lantai */}
      {unit.floorPlanImage && (
        <div className="mt-8 flex flex-col gap-6 rounded-3xl border border-[#0b120c]/10 bg-white/50 p-6 sm:p-8 xl:flex-row xl:items-center">
          <div className="xl:w-1/3">
            <h4 className="font-serif text-xl font-bold text-[#0b120c] sm:text-2xl">
              Denah Lantai Tipe {name}
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/65">
              Tata ruang {bedroomLabel(unit)} kamar tidur{unit.floors ? ` ${unit.floors} lantai` : ""} yang efisien, dengan sirkulasi udara dan cahaya alami yang maksimal.
            </p>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-white sm:h-96 md:h-[520px] xl:w-2/3">
            <Image
              src={unit.floorPlanImage}
              alt={`Denah lantai Tipe ${name} ${size} Cluster Ladera Grand Duta City Parung`}
              fill
              sizes="(max-width: 1280px) 100vw, 760px"
              className="object-contain p-4"
            />
          </div>
        </div>
      )}
    </article>
  );
}

export default function ClusterLaderaPage() {
  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-brand-light">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />

        {/* Hero Section */}
        <div className="relative w-full h-[70vh] lg:h-[100dvh] min-h-[600px] overflow-hidden bg-[#0b120c] flex items-center justify-center">
          <Image 
            src={HERO_IMAGE}
            alt={HERO_ALT}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b120c]/40 to-[#0b120c]" />
          
          <div className="relative z-10 text-center px-6 max-w-5xl pt-20 flex flex-col items-center">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Cluster Ladera" }
              ]} />
            </div>
            <p className="text-[#F5A524] text-xs md:text-sm tracking-[0.4em] uppercase font-sans font-semibold mb-6 drop-shadow-md">
              Best Living For Generations
            </p>
            {/* H1 sebelumnya "Cluster Ladera Grand Duta City Parung" — persis
                mengulang frasa target homepage. Diganti dengan nama tipe unit
                supaya halaman ini menang di query tipe, bukan query brand.
                Frasa brand tetap hadir di paragraf bawah sebagai anchor ke "/". */}
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#F5F1E8] mb-6 drop-shadow-xl">
              {PAGE_H1}
            </h1>
            <div className="w-16 h-1 bg-[#F5A524] mx-auto rounded-full mb-8" />
            <p className="text-[#F5F1E8]/90 text-lg md:text-xl font-sans max-w-3xl mx-auto leading-relaxed">
              Menghadirkan hunian modern dengan desain fungsional, lingkungan nyaman, dan posisi strategis di dalam kawasan{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              South of Jakarta.
            </p>
          </div>
        </div>

        {/* Video & Keunggulan Section */}
        <section className="py-20 bg-[#0b120c] text-[#F5F1E8]">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-[#F5A524] mb-6">American Classic Modern</h2>
                <p className="text-[#F5F1E8]/80 leading-relaxed font-sans mb-6">
                  Unit rumah LADERA dirancang oleh arsitek terbaik kami dengan tema American Classic yang dipadukan dengan sentuhan Modern Minimalist, menjadikan rumah Anda memiliki penampilan fasad yang sangat mewah dan elegan, serta sekaligus praktis dan fungsional.
                </p>
                <p className="text-[#F5F1E8]/80 leading-relaxed font-sans mb-8">
                  Sebuah hunian dengan konsep hidup dekat dengan alam, dimana Anda menikmati sejuknya udara pegunungan, bersihnya air dan hijaunya kawasan setiap hari.
                </p>
                <Link href="/pricelist-grand-duta-city" className="inline-flex items-center gap-2 bg-[#F5A524] text-[#0b120c] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-brand-light transition-colors">
                  Cek Harga Cluster Ladera <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative aspect-[9/16] w-full max-w-sm rounded-2xl overflow-hidden border border-[#F5A524]/20 shadow-2xl">
                  <AmbientVideo
                    src="https://res.cloudinary.com/dzhvfbuks/video/upload/v1775875427/Video_Cluster_Ladera_Grand_Duta_City_South_of_Jakarta_w9kaq3.mp4"
                    poster="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp"
                    ariaLabel="Video presentasi Cluster Ladera"
                    title="Video presentasi Cluster Ladera"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Konsep Kawasan Section */}
        <section className="py-24 bg-brand-light relative">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#0b120c] mb-6">Konsep Kawasan Ladera</h2>
              <div className="w-16 h-1 bg-[#F5A524] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: TreePine, title: "Menyatu Dengan Alam", desc: "Hunian dalam Modern Township berkualitas yang berdampingan harmoni dengan alam." },
                { icon: Bike, title: "Cycling Friendly", desc: "Bersepeda dengan nyaman dan aman dalam kawasan dengan jalur khusus sepeda." },
                { icon: Footprints, title: "Walkable City", desc: "Seluruh tempat dalam kawasan dapat ditempuh dengan jalan kaki di pedestrian yang lega." },
                { icon: Recycle, title: "Sustainable Management", desc: "Pengelolaan lingkungan hidup dan limbah yang lebih modern dan sehat." },
                { icon: ShieldCheck, title: "Safe & Peaceful", desc: "Seluruh fitur dan fasilitas dirancang memberikan pengalaman hidup yang menenteramkan." },
              ].map((feature, i) => (
                <div key={i} className="bg-brand-light p-8 rounded-2xl shadow-sm border border-[#0b120c]/5 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-[#F5A524]/10 rounded-xl flex items-center justify-center mb-6 text-[#F5A524]">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0b120c] mb-3">{feature.title}</h3>
                  <p className="font-sans text-[#0b120c]/70 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tipe Unit & Denah Section */}
        <section className="py-24 bg-brand-light border-t border-[#0b120c]/10">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14">
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#0b120c] mb-6">Tipe Rumah Cluster Ladera</h2>
              <p className="text-[#0b120c]/70 font-sans max-w-2xl mx-auto">Empat tipe hunian American Classic Modern, dari Verona yang paling terjangkau hingga Frontera untuk keluarga besar. Lengkap dengan denah lantai resmi tiap tipe.</p>
            </div>

            {laderaUnits.map((unit, index) => (
              <TypeShowcase key={unit.id} unit={unit} index={index} />
            ))}

          </div>
        </section>

        {/* Siteplan Section */}
        <section className="py-20 bg-[#0b120c] text-[#F5F1E8]">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="font-serif text-3xl md:text-4xl text-[#F5A524] mb-6">Posisi Strategis Cluster Ladera</h2>
                <p className="text-[#F5F1E8]/80 leading-relaxed font-sans mb-8">
                  Terletak di area premium dalam masterplan Grand Duta City, Cluster Ladera memiliki kemudahan akses menuju pusat komersial dan jalan utama kawasan.
                </p>
                <Link href="/update-stok-siteplan-grand-duta-city-parung" className="inline-flex items-center gap-2 border border-[#F5A524] text-[#F5A524] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-[#F5A524] hover:text-[#0b120c] transition-colors">
                  Lihat Update Stok Ladera <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="mt-4">
                  <Link href="/lokasi-akses-grand-duta-city-parung" className="inline-flex items-center gap-2 text-[#F5F1E8]/70 hover:text-[#F5F1E8] text-sm transition-colors">
                    <MapPin className="w-4 h-4" /> Pelajari lokasi &amp; akses GDC Parung
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#F5F1E8]/20">
                  <Image 
                    src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763617/0047-1-1024x576_z9e3f1.webp" 
                    alt="Siteplan Cluster Ladera" 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 620px"
                    className="object-cover" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <ClusterSpecs />

        {/* Internal Link Suggestions */}
        <section className="py-16 bg-brand-light border-t border-[#0b120c]/10 [content-visibility:auto] [contain-intrinsic-size:1px_260px]">
          <div className="max-w-screen-xl mx-auto px-6 md:px-14 text-center">
            <h3 className="font-serif text-2xl font-semibold mb-8 text-[#0b120c]">Jelajahi Lebih Lanjut</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cluster-cascada" className="px-5 py-2.5 bg-brand-light border border-[#0b120c]/10 rounded-full text-sm font-medium text-[#0b120c] hover:border-[#F5A524] transition-colors">Bandingkan Cluster</Link>
              <Link href="/cara-beli-kpr" className="px-5 py-2.5 bg-brand-light border border-[#0b120c]/10 rounded-full text-sm font-medium text-[#0b120c] hover:border-[#F5A524] transition-colors">Cara Beli & KPR</Link>
              <Link href="/kontak" className="px-5 py-2.5 bg-[#F5A524] text-[#F5F1E8] rounded-full text-sm font-medium hover:bg-[#0b120c] transition-colors">Hubungi Marketing untuk Survey Cluster Ladera</Link>
            </div>
          </div>
        </section>

        <ClusterFaqKprSection
          sectionId="faq-kpr-ladera"
          eyebrow="FAQ & Simulasi KPR"
          title="FAQ Cluster Ladera dan estimasi cicilan KPR"
          faqs={faqData}
          clusterName="Cluster Ladera"
          initialPrice={800000000}
          minPrice={600000000}
          maxPrice={1600000000}
          whatsappText="Halo, saya ingin konsultasi simulasi KPR dan jadwal survey untuk Cluster Ladera Grand Duta City Parung."
        />

      </main>
      <Footer />
    </>
  );
}
