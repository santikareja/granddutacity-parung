import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { ClusterFaqKprSection } from "@/components/sections/cluster-faq-kpr-section";
import { ClusterSpecs } from "@/components/sections/cluster-specs";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AmbientVideo } from "@/components/ui/ambient-video";
import { ArrowRight, ShieldCheck, TreePine, Bike, Footprints, Recycle, MapPin, Maximize, BedDouble, Bath, CarFront } from "lucide-react";
import {
  SCHEMA_ID,
  breadcrumbNode,
  clusterOfferCatalogNode,
  graph,
  ref,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

const PAGE_URL = `${SITE_URL}/cluster-ladera`;

// Title dipendekkan dari 88 -> 50 karakter dan brand tag menggantung dicabut.
// Description sebelumnya BYTE-IDENTICAL dengan /cluster-cascada; sekarang
// dibedakan lewat tema arsitektur dan nama tipe unit yang khas Ladera.
export const metadata: Metadata = {
  title: "Cluster Ladera GDC Parung: Tipe, Harga & Stok Unit",
  description:
    "Cluster Ladera bertema American Classic Modern di GDC Parung. Tipe Verona 39/60, Malta 47/72, dan Tuscan 66/72 — lengkap denah, harga KPR, dan blok tersedia.",
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
    answer: "Cluster Ladera menawarkan 2 tipe unit utama: Tipe Tuscan 66/72 dan Tipe Malta 47/72, dengan desain American Classic Modern."
  },
  {
    question: "Berapa harga rumah di Cluster Ladera?",
    answer: "Harga tunai keras mulai dari Rp 800 jutaan untuk Tipe Malta 47/72 dan Rp 1,1 Miliar untuk Tipe Tuscan 66/72. Harga KPR lebih tinggi dari harga tunai. Harga dapat berubah sewaktu-waktu, hubungi marketing kami untuk pricelist terbaru."
  },
  {
    question: "Bagaimana cara menuju Grand Duta City Parung?",
    answer: "Grand Duta City Parung berlokasi strategis di Selatan Jakarta, mudah diakses melalui Tol Pamulang (Desari) maupun Tol Kayu Manis (BORR)."
  }
];

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
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F5F1E8] mb-6 drop-shadow-xl">
              Cluster Ladera — Verona, Malta &amp; Tuscan
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
            <div className="text-center mb-20">
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#0b120c] mb-6">Tipe Rumah Cluster Ladera</h2>
              <p className="text-[#0b120c]/70 font-sans max-w-2xl mx-auto">Pilih tipe hunian yang paling sesuai dengan kebutuhan gaya hidup dan ukuran keluarga Anda.</p>
            </div>

            {/* Tipe Tuscan */}
            <div className="mb-24">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="w-full lg:w-1/2 max-w-md mx-auto">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
                    <Image 
                      src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884121/tipe-tuscan-66-gdc-parung-bogor_p6zgu8.webp" 
                      alt="Tipe Tuscan 66 Cluster Ladera" 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                      className="object-cover" 
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div className="inline-block px-4 py-1.5 bg-[#0b120c]/10 text-[#0b120c] font-bold tracking-widest text-xs uppercase rounded-full mb-4">Tipe 66/72</div>
                  <h3 className="font-serif text-4xl font-bold text-[#0b120c] mb-4">Tuscan</h3>
                  <p className="text-2xl text-[#0b120c] font-medium mb-6">Rp 1,1 Miliar-an</p>
                  
                  <div className="flex flex-wrap gap-6 mb-8 border-y border-[#0b120c]/10 py-6">
                    <div className="flex items-center gap-2"><BedDouble className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">3 K.Tidur</span></div>
                    <div className="flex items-center gap-2"><Bath className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">2 K.Mandi</span></div>
                    <div className="flex items-center gap-2"><CarFront className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">2 Carport</span></div>
                    <div className="flex items-center gap-2"><Maximize className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">LB 66 / LT 72</span></div>
                  </div>

                  <p className="text-[#0b120c]/70 font-sans mb-8">
                    Hunian American Classic 2 lantai yang elegan, memberikan ruang fleksibel untuk anggota keluarga. Tampilan mewah namun mengedepankan fungsi ruang yang optimal.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="https://wa.me/628131742034?text=Halo%20saya%20tertarik%20dengan%20Tipe%20Tuscan%20di%20Cluster%20Ladera" data-wa-placement="ladera-tipe-tuscan" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center gap-2 bg-[#F5A524] text-[#F5F1E8] px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-[#0b120c] transition-colors">
                      Tanya Marketing
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-12 bg-brand-light p-8 rounded-2xl flex flex-col xl:flex-row gap-8 items-center">
                <div className="w-full xl:w-1/3">
                  <h4 className="font-serif text-2xl font-bold text-[#0b120c] mb-4">Denah Lantai Tipe Tuscan</h4>
                  <p className="text-[#0b120c]/70 text-sm">Desain tata ruang maksimal dengan sirkulasi udara yang baik.</p>
                </div>
                <div className="w-full xl:w-2/3 relative h-96 md:h-[600px] rounded-xl overflow-hidden border border-[#0b120c]/10 bg-brand-light">
                  <Image 
                    src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775883012/denah-lantai-tipe-tuscan-cluster-ladera-grand-duta-city-south-of-jakarta_muqubx.webp" 
                    alt="Denah Lantai Tipe Tuscan Ladera" 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                    className="object-contain p-4" 
                  />
                </div>
              </div>
            </div>

            {/* Tipe Malta */}
            <div className="mb-10">
              <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
                <div className="w-full lg:w-1/2 max-w-md mx-auto">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
                    <Image 
                      src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884121/tipe-malta-47-gdc-parung-bogor_fgttjy.webp" 
                      alt="Tipe Malta 47 Cluster Ladera" 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
                      className="object-cover" 
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div className="inline-block px-4 py-1.5 bg-[#0b120c]/10 text-[#0b120c] font-bold tracking-widest text-xs uppercase rounded-full mb-4">Tipe 47/72</div>
                  <h3 className="font-serif text-4xl font-bold text-[#0b120c] mb-4">Malta</h3>
                  {/* DIKOREKSI (Fase 3): sebelumnya "Rp 900 Juta-an". Angka itu
                      menyesatkan karena justru mendekati harga KPR
                      (Rp 971.403.600 - Rp 1.021.929.900), bukan harga tunai.
                      Tunai keras terendah Malta 47/72 adalah Rp 845.550.000. */}
                  <p className="text-2xl text-[#0b120c] font-medium mb-6">Rp 800 Juta-an</p>
                  
                  <div className="flex flex-wrap gap-6 mb-8 border-y border-[#0b120c]/10 py-6">
                    <div className="flex items-center gap-2"><BedDouble className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">2+1 K.Tidur</span></div>
                    <div className="flex items-center gap-2"><Bath className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">1 K.Mandi</span></div>
                    <div className="flex items-center gap-2"><CarFront className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">2 Carport</span></div>
                    <div className="flex items-center gap-2"><Maximize className="w-5 h-5 text-[#0b120c]"/> <span className="font-medium text-[#0b120c]">LB 47 / LT 72</span></div>
                  </div>

                  <p className="text-[#0b120c]/70 font-sans mb-8">
                    Solusi pintar untuk keluarga muda. Tipe 1 lantai yang mengusung compact living tanpa mengorbankan kenyamanan, dilengkapi ekstra ruang fleksibel.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="https://wa.me/628131742034?text=Halo%20saya%20tertarik%20dengan%20Tipe%20Malta%20di%20Cluster%20Ladera" data-wa-placement="ladera-tipe-malta" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center gap-2 bg-[#F5A524] text-[#F5F1E8] px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-[#0b120c] transition-colors">
                      Tanya Marketing
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-12 bg-brand-light p-8 rounded-2xl flex flex-col xl:flex-row gap-8 items-center">
                <div className="w-full xl:w-1/3">
                  <h4 className="font-serif text-2xl font-bold text-[#0b120c] mb-4">Denah Lantai Tipe Malta</h4>
                  <p className="text-[#0b120c]/70 text-sm">Tata ruang cerdas yang memaksimalkan sirkulasi cahaya alami.</p>
                </div>
                <div className="w-full xl:w-2/3 relative h-96 md:h-[600px] rounded-xl overflow-hidden border border-[#0b120c]/10 bg-brand-light">
                  <Image 
                    src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775883012/denah-lantai-tipe-malta-cluster-ladera-grand-duta-city-south-of-jakarta_ru5oze.webp" 
                    alt="Denah Lantai Tipe Malta Ladera" 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 760px"
                    loading="eager"
                    className="object-contain p-4" 
                  />
                </div>
              </div>
            </div>

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
                    <MapPin className="w-4 h-4" /> Pelajari lokasi Grand Duta City Parung
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
          initialPrice={900000000}
          minPrice={900000000}
          maxPrice={1600000000}
          whatsappText="Halo, saya ingin konsultasi simulasi KPR dan jadwal survey untuk Cluster Ladera Grand Duta City Parung."
        />

      </main>
      <Footer />
    </>
  );
}
