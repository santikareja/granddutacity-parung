import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Navigation, Car, Train, Clock, Building2, Hospital, ArrowRight, Map, ShoppingBag, GraduationCap, Flag, Ticket } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";
import { LOCATION_PAGE_PATH } from "@/lib/redirects";
import { OG_SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Slug diubah 3 September 2026 dari `lokasi-akses-grand-duta-city-parung`
 * menjadi `lokasi-akses-gdc-parung`: URL adalah sinyal on-page, dan slug lama
 * memuat frasa target homepage secara utuh. URL lama 301 ke sini
 * (lihat `next.config.ts` dan `src/lib/redirects.ts`).
 *
 * `LOCATION_PAGE_PATH` diimpor alih-alih ditulis ulang supaya path ini punya
 * SATU sumber: redirect, sitemap, breadcrumb, dan canonical tidak bisa lagi
 * bergeser satu sama lain.
 */
const PAGE_URL = `${SITE_URL}${LOCATION_PAGE_PATH}`;
const MAP_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763613/Grand-Duta-City-Parung-Map-scaled_mth9ir.webp";

/**
 * H1 dipecah jadi dua bagian karena bagian kedua diberi warna aksen (span
 * italic). `PAGE_H1` menggabungnya untuk guard G19 (seo-invariants.test.ts).
 */
const PAGE_H1_LEAD = "Lokasi & Akses GDC Parung ke";
const PAGE_H1_TAIL = "Jakarta, Depok, Bogor";
export const PAGE_H1 = `${PAGE_H1_LEAD} ${PAGE_H1_TAIL}`;

const PAGE_TITLE = "Lokasi GDC Parung: 4 Exit Tol ke Jakarta & Depok";
const PAGE_DESCRIPTION =
  "Lokasi GDC Parung di Jl. Raya Parung No.47, Bogor: 15 menit ke 4 exit tol Pamulang, Krukut, Sawangan, Bojong Gede, dan 20 menit ke CBD TB Simatupang.";

/**
 * SATU `@graph` menggantikan empat blok lepas (Fase 5).
 *
 * Halaman ini adalah kasus pemecahan entitas yang paling parah di situs:
 *
 *  - `RealEstateAgent` di sini diberi `@id` = URL HALAMAN ini
 *    (".../lokasi-akses-gdc-parung"), bukan fragment entitas. Jadi Google
 *    diberi tahu bahwa HALAMAN itu sendiri adalah sebuah agen properti,
 *    terpisah dari `#salesoffice` di homepage. Dua bisnis, satu kantor.
 *  - `Place` anonim di sini mengulang alamat proyek tanpa `@id`, jadi ia
 *    entitas lokasi KETIGA yang bersaing dengan `#project`.
 *  - Koordinatnya (-6.450274, 106.719312) juga berbeda dari homepage
 *    (-6.462459, 106.729392) di bawah alamat jalan yang sama.
 *
 * Sekarang halaman ini tidak mendefinisikan entitas lokasi apa pun; ia hanya
 * MERUJUK `#project` dan `#salesoffice`. Google melihat satu tempat, dengan
 * satu titik peta, yang dibahas oleh beberapa halaman.
 *
 * `name`/`description` node `WebPage` memakai `PAGE_TITLE`/`PAGE_DESCRIPTION`
 * yang SAMA dengan `<title>` dan meta description (3 September 2026).
 * Sebelumnya keduanya ditulis terpisah dan masih membawa versi lama
 * "Lokasi Grand Duta City Parung | Akses ke Bogor, Depok & Jakarta" — jadi
 * halaman ini mengumumkan judul yang berbeda dari judul aslinya DAN judul itu
 * memuat frasa target homepage. Satu sumber menutup kedua masalah sekaligus.
 */
const pageSchema = graph([
  breadcrumbNode(
    [{ name: "Lokasi & Akses", path: LOCATION_PAGE_PATH }],
    PAGE_URL,
  ),
  {
    "@type": "ImageObject",
    "@id": `${PAGE_URL}#primaryimage`,
    url: MAP_IMAGE,
    contentUrl: MAP_IMAGE,
    caption: "Peta lokasi GDC Parung dan akses ke Bogor, Depok, Jakarta",
    width: 1200,
    height: 630,
  },
  {
    "@type": "WebPage",
    "@id": `${PAGE_URL}#webpage`,
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    inLanguage: "id",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.project),
    mentions: ref(SCHEMA_ID.salesOffice),
    breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
    primaryImageOfPage: ref(`${PAGE_URL}#primaryimage`),
    author: ref(SCHEMA_ID.author),
    publisher: ref(SCHEMA_ID.organization),
  },
]);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const hasParams = Object.keys(resolvedSearchParams).length > 0;
  
  return {
    // Title dipendekkan dari 88 -> 48 karakter; brand sebelumnya muncul 2x.
    // Keyword "akses grand duta city south of jakarta" dicabut karena memuat
    // frasa target homepage.
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    keywords: [
      "lokasi gdc parung",
      "akses tol gdc parung",
      "perumahan dekat exit tol desari",
      "perumahan dekat exit tol sawangan",
      "lokasi perumahan parung bogor",
      "rumah dekat tb simatupang",
      "fasilitas sekitar parung bogor"
    ],
    alternates: {
      canonical: PAGE_URL
    },
    robots: {
      index: !hasParams,
      follow: true,
      googleBot: {
        index: !hasParams,
        follow: true,
        "max-image-preview": "large",
      }
    },
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: PAGE_URL,
      siteName: OG_SITE_NAME,
      locale: "id_ID",
      type: "website",
      images: [{ url: MAP_IMAGE, width: 1200, height: 630, alt: "Peta lokasi GDC Parung dan akses ke Bogor, Depok, Jakarta" }],
    },
    twitter: {
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [MAP_IMAGE],
    },
  }
}

export default function LokasiAksesPage() {
  const sliderImages = [
    // `alt` juga sinyal on-page dan dipakai Google sebagai anchor text untuk
    // tautan bergambar, jadi ia mengikuti aturan yang sama dengan title/H1
    // halaman ini: pakai "GDC Parung", jangan frasa target homepage.
    { src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776541441/Masterplan_svnc3y.webp", alt: "Akses utama lokasi GDC Parung" },
    { src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879212/Akses_Tol_Grand_Duta_City_South_of_Jakarta_1_ozzhny.webp", alt: "Akses tol terdekat dari GDC Parung" },
    { src: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879212/Akses_Tol_Grand_Duta_City_South_of_Jakarta_2_kmrerc.webp", alt: "Akses tol Bojong Gede dari GDC Parung" }
  ];

  const lokasiSekitar = [
    {
      title: "Shopping & Lifestyle",
      icon: ShoppingBag,
      items: [
        { name: "The Park Sawangan", time: "20 Menit" },
        { name: "Bintaro Xchange", time: "40 Menit" },
        { name: "Lotte Mart Bintaro", time: "40 Menit" },
        { name: "Pd. Indah Mall", time: "45 Menit" },
      ],
    },
    {
      title: "Health Center & Hospital",
      icon: Hospital,
      items: [
        { name: "RS Terpadu Dompet Dhuafa", time: "5 Menit" },
        { name: "Brawijaya Hospital Depok", time: "20 Menit" },
        { name: "Depok City Hospital", time: "20 Menit" },
        { name: "RSIA Cinta Kasih", time: "40 Menit" },
        { name: "Siloam Hospital", time: "40 Menit" },
        { name: "Mayapada Hospital", time: "45 Menit" },
      ],
    },
    {
      title: "Education Center",
      icon: GraduationCap,
      items: [
        { name: "Dwiwarna High School", time: "5 Menit" },
        { name: "Pamulang University", time: "30 Menit" },
        { name: "Jakarta Intercultural School", time: "40 Menit" },
        { name: "Universitas Prasetiya Mulya (Cilandak)", time: "40 Menit" },
        { name: "Universitas Prasetiya Mulya (BSD)", time: "45 Menit" },
      ],
    },
    {
      title: "Golf Course",
      icon: Flag,
      items: [
        { name: "Pd. Cabe Golf Course", time: "30 Menit" },
        { name: "Matoa National Golf Course", time: "45 Menit" },
        { name: "Pd. Indah Golf Course", time: "45 Menit" },
      ],
    },
    {
      title: "Attraction",
      icon: Ticket,
      items: [{ name: "Ragunan Zoo", time: "45 Menit" }],
    },
    {
      title: "Office Building",
      icon: Building2,
      items: [{ name: "Talavera Office Tower", time: "40 Menit" }],
    },
  ];

  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c] font-sans pb-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#F5F1E8]/5">
          <div className="absolute inset-0 opacity-20">
            <Image 
              src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763648/PK-SGDC-apr-22_page-0018_bjhro5.webp" 
              alt="Lokasi GDC Parung dan akses ke Bogor, Depok, Jakarta"
              fill
              className="object-contain md:object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b120c]/65 via-[#0b120c]/45 to-[#0b120c]/70" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Lokasi & Akses" }
              ]} />
            </div>
            {/* H1 diarahkan ke query lokasi/akses (menyebut 3 wilayah tujuan)
                alih-alih mengulang frasa brand target homepage. */}
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium text-[#F5F1E8] mb-6 tracking-wider font-serif leading-tight">
              {PAGE_H1_LEAD} <span className="text-[#F5A524] italic">{PAGE_H1_TAIL}</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#F5F1E8]/70 leading-relaxed mb-8 max-w-3xl">
              {/* Anchor ke homepage SENGAJA memakai frasa brand utuh. Ini satu
                  pengecualian yang justru mendukung konsolidasi: tautan ini
                  MENGIRIM sinyal "frasa itu milik homepage", bukan mengklaimnya
                  untuk halaman ini. Yang dilarang adalah frasa brand di
                  title/description/H1/slug/alt halaman ini sendiri. */}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              berada di kawasan Parung, Bogor, dengan akses yang menjangkau Bogor, Depok, dan Jakarta serta didukung fasilitas publik di sekitarnya.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <a href="#peta-lokasi" className="px-8 py-4 rounded-full bg-[#F5A524] text-[#0b120c] font-bold transition-colors hover:bg-brand-light text-center tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                 Lihat Peta <ArrowRight className="w-4 h-4" />
              </a>
              <a href="https://maps.app.goo.gl/68zzL5Yg64ZtfdGUA" target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full bg-brand-light/5 hover:bg-brand-light/10 text-[#F5F1E8] font-bold transition-colors border border-[#F5F1E8]/20 text-center tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                 <Map className="w-4 h-4" /> Buka Google Maps
              </a>
            </div>
          </div>
        </section>

        {/* Ringkasan Lokasi */}
        <section className="py-16 md:py-24 relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
               <div className="order-2 lg:order-1">
                  <h2 className="text-3xl font-serif text-[#F5F1E8] mb-6">Penghubung Strategis 3 Wilayah</h2>
                  {/* Subjek kalimat sengaja "Kawasan GDC Parung", bukan frasa
                      brand utuh. Halaman ini hanya boleh menjelaskan LOKASI
                      entitas; klaim atas nama entitasnya sendiri milik homepage
                      (lihat src/lib/keyword-ownership.ts). Sebelum perubahan ini
                      halaman ini menyebut KEDUA frasa target homepage —
                      "Grand Duta City Parung" di paragraf hero DAN "Grand Duta
                      City South of Jakarta" di sini — pola yang sama dengan
                      halaman-halaman yang sudah di-redirect karena alasan itu. */}
                  <p className="text-[#F5F1E8]/70 text-lg leading-relaxed mb-6">
                    Kawasan GDC Parung berlokasi di wilayah strategis koridor Parung, Bogor, yang menghubungkan wilayah Tangerang Selatan, Depok, dan Jakarta Selatan. Kawasan hunian seluas 200 hektar ini dikembangkan sebagai kota mandiri dengan konsep Modern Sanctuary Living.
                  </p>
                  
                  <div className="bg-brand-light/5 border border-[#F5F1E8]/10 p-6 rounded-2xl mb-8">
                     <h3 className="text-[#F5A524] font-semibold tracking-wider text-sm uppercase mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Lokasi Utama
                     </h3>
                     <p className="text-[#F5F1E8]/80 leading-relaxed mb-3">
                        <strong className="text-[#F5F1E8]">Alamat:</strong> Jl. Raya Parung No. 47, Jabon Mekar, Kec. Parung, Kabupaten Bogor, Jawa Barat 16330.
                     </p>
                     <p className="text-[#F5F1E8]/80 leading-relaxed">
                        <strong className="text-[#F5F1E8]">Kantor Pemasaran:</strong> Terletak di area yang sama, tepatnya di Jl. Boulevard GDC.
                     </p>
                  </div>
               </div>

               <div className="order-1 lg:order-2 bg-[#111] p-2 rounded-2xl border border-[#F5F1E8]/10 relative overflow-hidden shadow-2xl">
                 <Carousel className="w-full">
                    <CarouselContent>
                       {sliderImages.map((img, i) => (
                         <CarouselItem key={i}>
                            <div className="relative aspect-[4/3] sm:aspect-video w-full rounded-xl overflow-hidden">
                              <Image 
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-contain md:object-cover"
                                sizes="(max-width: 1024px) 100vw, 800px"
                              />
                            </div>
                         </CarouselItem>
                       ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4 bg-[#0b120c]/50 text-[#F5F1E8] border-[#F5F1E8]/20 hover:bg-[#F5A524] hover:text-[#0b120c]" />
                    <CarouselNext className="right-4 bg-[#0b120c]/50 text-[#F5F1E8] border-[#F5F1E8]/20 hover:bg-[#F5A524] hover:text-[#0b120c]" />
                 </Carousel>
               </div>
            </div>
        </section>

        {/* Peta Lokasi Utama */}
        <section id="peta-lokasi" className="py-16 md:py-24 bg-[#060a07] border-y border-[#F5F1E8]/5 scroll-m-20">
           <div className="max-w-7xl mx-auto px-4 md:px-8">
             <div className="text-center mb-12">
               <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-4">Peta Lokasi & <span className="text-[#F5A524]">Infrastruktur</span></h2>
               <p className="text-[#F5F1E8]/60">Posisi strategis yang didukung pengembangan infrastruktur transportasi masif di area Selatan Jakarta.</p>
             </div>
             
             <div className="relative w-full aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] rounded-2xl overflow-hidden border border-[#F5F1E8]/10 shadow-2xl bg-brand-light/5">
                <Image 
                   src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1776804065/map_lokasi_gdc_parung_bogor_anhrcm.webp"
                   alt="Peta lokasi GDC Parung"
                   fill
                   className="object-contain"
                   quality={90}
                   sizes="(max-width: 1280px) 100vw, 1200px"
                />
             </div>

             <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
               {lokasiSekitar.map((group) => {
                 const Icon = group.icon;
                 return (
                   <div
                     key={group.title}
                     className="bg-brand-light/5 border border-[#F5F1E8]/10 rounded-2xl p-5 hover:border-[#F5A524]/35 transition-colors"
                   >
                     <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F5F1E8]/10">
                       <div className="w-9 h-9 rounded-full bg-[#0b120c] border border-[#F5F1E8]/10 flex items-center justify-center">
                         <Icon className="w-4 h-4 text-[#F5A524]" />
                       </div>
                       <h3 className="text-[#F5F1E8] text-base font-medium">{group.title}</h3>
                     </div>

                     <ul className="space-y-3">
                       {group.items.map((item) => (
                         <li key={item.name} className="flex items-center justify-between gap-4 text-sm">
                           <span className="text-[#F5F1E8]/70">{item.name}</span>
                           <span className="text-[#F5A524] text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                             {item.time}
                           </span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 );
               })}
             </div>
           </div>
        </section>

        {/* Aksesibilitas */}
        <section className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-4">Aksesibilitas & Waktu Tempuh</h2>
              <p className="text-[#F5F1E8]/60">Berbagai moda transportasi dan jalan untuk menunjang mobilitas Anda.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 p-8 rounded-2xl hover:border-[#F5A524]/30 transition-colors">
                 <div className="bg-[#0b120c] w-12 h-12 rounded-full flex items-center justify-center border border-[#F5F1E8]/5 mb-6">
                    <Navigation className="w-5 h-5 text-[#F5A524]" />
                 </div>
                 <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">Akses Tol</h3>
                 <p className="text-[#F5F1E8]/60 text-sm leading-relaxed mb-4">
                    Dijangkau kurang dari 15 menit dari 4 gerbang tol utama:
                 </p>
                 <ul className="space-y-2 text-sm text-[#F5F1E8]/80">
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F5A524] mt-1.5 shrink-0" /> Exit Tol Pamulang (JORR 2)</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F5A524] mt-1.5 shrink-0" /> Exit Tol Krukut (Desari)</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F5A524] mt-1.5 shrink-0" /> Exit Tol Sawangan (Desari)</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#F5A524] mt-1.5 shrink-0" /> Exit Tol Bojong Gede (JORR 2 / Rencana Tol Bomang)</li>
                 </ul>
              </div>

              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 p-8 rounded-2xl hover:border-[#F5A524]/30 transition-colors">
                 <div className="bg-[#0b120c] w-12 h-12 rounded-full flex items-center justify-center border border-[#F5F1E8]/5 mb-6">
                    <Car className="w-5 h-5 text-[#F5A524]" />
                 </div>
                 <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">Jalur Utama</h3>
                 <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">
                    Berada tepat di sisi Jalan Raya Parung, yang merupakan jalur utama (jalan arteri nasional) penghubung dari arah Ciputat/Pamulang menuju Kota Bogor. Titik sentral antara Tangerang Selatan dan Bogor.
                 </p>
              </div>

              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 p-8 rounded-2xl hover:border-[#F5A524]/30 transition-colors">
                 <div className="bg-[#0b120c] w-12 h-12 rounded-full flex items-center justify-center border border-[#F5F1E8]/5 mb-6">
                    <Train className="w-5 h-5 text-[#F5A524]" />
                 </div>
                 <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">Transportasi Umum</h3>
                 <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">
                    Lokasinya sangat terjangkau bagi komuter pengguna moda transportasi rel darat, karena relatif dekat dengan <strong>Stasiun KRL Bojong Gede</strong> dan <strong>Stasiun KRL Citayam</strong>.
                 </p>
              </div>
              
              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 p-8 rounded-2xl hover:border-[#F5A524]/30 transition-colors">
                 <div className="bg-[#0b120c] w-12 h-12 rounded-full flex items-center justify-center border border-[#F5F1E8]/5 mb-6">
                    <Clock className="w-5 h-5 text-[#F5A524]" />
                 </div>
                 <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">Waktu Tempuh</h3>
                 <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">
                    Hanya berjarak sekitar <strong>20 menit</strong> dari kawasan bisnis Antasari dan TB Simatupang di Jakarta Selatan melalui akses Tol Desari. Menjadikan GDC hunian ideal bagi profesional di CBD Jakarta Selatan.
                 </p>
              </div>
           </div>
        </section>

        {/* Fasilitas Sekitar Lokasi */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10 bg-[#060a07] border border-[#F5F1E8]/5 rounded-3xl mb-16">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                 <h2 className="text-3xl md:text-3xl font-serif text-[#F5F1E8] mb-6">Fasilitas Kehidupan di Sekitar Lokasi</h2>
                 <p className="text-[#F5F1E8]/70 mb-8">Sebagai kota mandiri skala besar, kawasan ini juga menyediakan berbagai fasilitas internal dan dikelilingi infrastruktur publik yang sudah mapan:</p>
                 
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <MapPin className="w-6 h-6 text-[#F5A524] shrink-0" />
                       <div>
                          <h4 className="text-lg font-medium text-[#F5F1E8] mb-1">The Beach & Area Rekreasi</h4>
                          <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">Fasilitas internal mencakup taman bermain keluarga, swimming pool bernuansa resort, kolam renang anak, dan coworking space.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <Building2 className="w-6 h-6 text-[#F5A524] shrink-0" />
                       <div>
                          <h4 className="text-lg font-medium text-[#F5F1E8] mb-1">Area Komersial & FnB</h4>
                          <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">Tersedia Garden Cafe dan lifestyle area makan terbuka di sepanjang jalan utama (boulevard), serta shophouse premium.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <Hospital className="w-6 h-6 text-[#F5A524] shrink-0" />
                       <div>
                          <h4 className="text-lg font-medium text-[#F5F1E8] mb-1">Fasilitas Kesehatan & Pendidikan</h4>
                          <p className="text-[#F5F1E8]/60 text-sm leading-relaxed">Direncanakan akan segera hadir fasilitas rumah sakit bertaraf nasional dan opsi sekolah swasta di dalam area perumahan seluas 200 Hektar ini.</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="aspect-square relative rounded-xl overflow-hidden border border-[#F5F1E8]/10">
                    <Image src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763648/PK-SGDC-apr-22_page-0018_bjhro5.webp" alt="Fasilitas rekreasi kawasan GDC Parung" fill className="object-contain md:object-cover" />
                 </div>
                  <div className="aspect-square relative rounded-xl overflow-hidden border border-[#F5F1E8]/10 mt-8">
                    <Image src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1776541441/Masterplan_svnc3y.webp" alt="Boulevard utama GDC Parung" fill className="object-contain md:object-cover" />
                 </div>
              </div>
           </div>
        </section>

        {/* Global CTA */}
        <section className="pb-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="p-10 md:p-16 rounded-3xl bg-[#F5A524] relative overflow-hidden text-center isolate border border-[#F5F1E8]/10">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c]/90 to-[#0b120c]/60"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-5xl font-serif text-[#F5F1E8] mb-6">Berkunjung ke Lokasi Kami</h3>
                <p className="text-[#F5F1E8]/80 text-lg mb-10">
                    Datang dan buktikan sendiri kemudahan akses menuju GDC Parung. Hubungi kami untuk jadwal booking atau bantuan arahan jalan.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="https://maps.app.goo.gl/68zzL5Yg64ZtfdGUA" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#F5A524] text-[#0b120c] px-8 py-4 rounded-full font-bold hover:bg-brand-light transition-colors w-full sm:w-auto justify-center">
                       <Map className="w-5 h-5" /> Buka Google Maps
                    </a>
                    <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20mendapatkan%20info%20shareloc%20Grand%20Duta%20City%20Parung." target="_blank" rel="noreferrer" data-wa-placement="lokasi-shareloc-cta" className="flex items-center gap-2 bg-transparent text-[#F5F1E8] border border-[#F5F1E8]/20 hover:bg-brand-light/10 px-8 py-4 rounded-full font-bold transition-colors w-full sm:w-auto justify-center">
                       Minta Shareloc WhatsApp
                    </a>
                </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
