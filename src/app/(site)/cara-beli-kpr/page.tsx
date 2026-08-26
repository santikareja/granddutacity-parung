import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle2, FileText, Calculator, HelpCircle, Building2, Banknote, ShieldCheck, Home } from "lucide-react";
import { BankSlider } from "@/components/ui/bank-slider";
import { Breadcrumb } from "@/components/ui/breadcrumb";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const PAGE_URL = "https://granddutacitysouthofjakarta.com/cara-beli-kpr";
const OG_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp";
const AUTHOR_ID = "https://granddutacitysouthofjakarta.com/author/santika-reza#person";
const AUTHOR_URL = "https://granddutacitysouthofjakarta.com/author/santika-reza";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const hasParams = Object.keys(resolvedSearchParams).length > 0;
  
  return {
    title: "Cara Beli Rumah di Grand Duta City Parung | KPR & Tahapan",
    description: "Panduan cara beli rumah di Grand Duta City Parung, mulai dari booking, DP, proses KPR, dokumen yang dibutuhkan, hingga tahapan akad.",
    keywords: [
      "cara beli rumah grand duta city parung",
      "kpr grand duta city parung",
      "proses pembelian rumah grand duta city",
      "simulasi kpr grand duta city",
      "booking fee grand duta city",
      "syarat kpr rumah parung",
      "tahapan akad rumah"
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
      title: "Cara Beli Rumah di Grand Duta City Parung | KPR & Tahapan",
      description: "Panduan cara beli rumah di Grand Duta City Parung, mulai dari booking, DP, proses KPR, dokumen yang dibutuhkan, hingga tahapan akad.",
      url: PAGE_URL,
      siteName: "Grand Duta City Parung South of Jakarta",
      locale: "id_ID",
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Cara Beli dan Proses KPR di Grand Duta City Parung" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cara Beli Rumah di Grand Duta City Parung | KPR & Tahapan",
      description: "Panduan cara beli rumah di Grand Duta City Parung, mulai dari booking, DP, proses KPR, dokumen yang dibutuhkan, hingga tahapan akad.",
      images: [OG_IMAGE],
    },
  }
}

export default function CaraBeliKPRPage() {
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://granddutacitysouthofjakarta.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Cara Beli & KPR",
        "item": PAGE_URL
      }
    ]
  };

  const jsonLdWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cara Beli Rumah di Grand Duta City Parung | KPR & Tahapan",
    "description": "Panduan cara beli rumah di Grand Duta City Parung, mulai dari booking, DP, proses KPR, dokumen yang dibutuhkan, hingga tahapan akad.",
    "url": PAGE_URL,
    "inLanguage": "id",
    "author": {
      "@id": AUTHOR_ID,
      "@type": "Person",
      "name": "Santika Reza",
      "url": AUTHOR_URL
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": OG_IMAGE
    }
  };

  const jsonLdHowTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cara Membeli Rumah di Grand Duta City Parung Menggunakan KPR",
    "description": "Panduan langkah demi langkah cara membeli rumah dan proses pengajuan KPR di Grand Duta City Parung.",
    "image": OG_IMAGE,
    "author": {
      "@id": AUTHOR_ID,
      "@type": "Person",
      "name": "Santika Reza",
      "url": AUTHOR_URL
    },
    "totalTime": "P30D",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Pilih Unit dan Cluster",
        "text": "Langkah pertama adalah memilih unit dan cluster yang sesuai dengan kebutuhan Anda, apakah itu Cluster Ladera atau Cascada.",
        "url": `${PAGE_URL}#pilih-unit`
      },
      {
        "@type": "HowToStep",
        "name": "Bayar Booking Fee",
        "text": "Setelah memilih unit, lakukan pembayaran Booking Fee (tanda jadi) untuk mengamankan unit pilihan Anda.",
        "url": `${PAGE_URL}#booking-fee`
      },
      {
        "@type": "HowToStep",
        "name": "Pembayaran DP (Down Payment)",
        "text": "Anda perlu membayarkan DP atau Uang Muka yang besarannya disesuaikan dengan program promosi yang berlaku.",
        "url": `${PAGE_URL}#dp`
      },
      {
        "@type": "HowToStep",
        "name": "Pengajuan KPR",
        "text": "Pihak developer akan membantu mengurus berkas dan pengajuan KPR ke bank-bank rekanan.",
        "url": `${PAGE_URL}#pengajuan-kpr`
      },
      {
        "@type": "HowToStep",
        "name": "Verifikasi dan Persetujuan",
        "text": "Pihak Bank melakukan wawancara dan verifikasi dokumen, lalu mengeluarkan SPK (Surat Persetujuan Kredit).",
        "url": `${PAGE_URL}#verifikasi`
      },
      {
        "@type": "HowToStep",
        "name": "Akad Kredit dan Serah Terima",
        "text": "Setelah SPK keluar, Anda akan melakukan Akad Kredit bersama Notaris dan pihak Bank. Selanjutnya, tinggal menunggu proses serah terima rumah.",
        "url": `${PAGE_URL}#akad`
      }
    ]
  };

  const steps = [
    {
      id: "pilih-unit",
      title: "Pilih Unit / Cluster",
      icon: <Building2 className="w-6 h-6 text-[#F5A524]" />,
      desc: "Eksplorasi pilihan hunian di Grand Duta City Parung. Kami memiliki Cluster Ladera untuk konsep minimalis modern dan Cluster Cascada untuk rumah bergaya resort. Pastikan Anda melakukan survey lokasi dan menyesuaikan pilihan unit dengan kebutuhan keluarga Anda."
    },
    {
      id: "booking-fee",
      title: "Pembayaran Booking Fee",
      icon: <Banknote className="w-6 h-6 text-[#F5A524]" />,
      desc: "Setelah unit impian Anda ditemukan, Anda perlu membayar Booking Fee (Uang Tanda Jadi) untuk mengamankan blok pilihan. Ini memastikan unit tidak dijual ke orang lain selama proses Anda berjalan."
    },
    {
      id: "dp",
      title: "Pembayaran DP (Down Payment)",
      icon: <Banknote className="w-6 h-6 text-[#F5A524]" />,
      desc: "DP bervariasi bergantung pada kualifikasi KPR dan promo yang sedang berjalan. Kami sering menawarkan promo DP 0% atau subsidi DP yang sangat meringankan langkah awal Anda memiliki rumah."
    },
    {
      id: "pengajuan-kpr",
      title: "Pengajuan KPR (Kredit Pemilikan Rumah)",
      icon: <FileText className="w-6 h-6 text-[#F5A524]" />,
      desc: "Tim KPR kami akan memandu Anda sepenuhnya. Anda cukup melengkapi berkas, dan kami akan menyalurkannya ke bank rekanan kami. Proses ini sangat praktis karena terhubung dengan berbagai perbankan besar."
    },
    {
      id: "verifikasi",
      title: "Verifikasi Dokumen & Wawancara Bank",
      icon: <ShieldCheck className="w-6 h-6 text-[#F5A524]" />,
      desc: "Pihak bank akan menghubungi Anda untuk tahap verifikasi data dan wawancara singkat. Setelah analisis kredit selesai dan disetujui, bank akan menerbitkan Surat Persetujuan Kredit (SPK)."
    },
    {
      id: "akad",
      title: "Akad Kredit & Proses Serah Terima",
      icon: <Home className="w-6 h-6 text-[#F5A524]" />,
      desc: "Selamat! Tahap akhir adalah penandatanganan Akad Kredit di hadapan Notaris dan pihak bank. Setelah itu, Anda otomatis terdaftar sebagai pemilik, dan segera menjadwalkan proses serah terima kunci (Handover)."
    }
  ];

  const documents = [
    { name: "KTP Suami dan Istri (Jika sudah menikah)" },
    { name: "Kartu Keluarga (KK)" },
    { name: "NPWP Pribadi" },
    { name: "Akta Nikah / Akta Cerai (Jika ada)" },
    { name: "Surat Keterangan Kerja & Slip Gaji (3 bulan terakhir)" },
    { name: "Rekening Koran / Buku Tabungan (3 bulan terakhir)" },
    { name: "Surat Keterangan Belum Memiliki Rumah (Untuk program subsidi/tertentu)" },
  ];

  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c] font-sans pb-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }} />

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto border-b border-[#F5F1E8]/5">
          <div className="absolute inset-0 opacity-20">
            <Image 
              src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/proses-kpr-grand-duta-city-parung_hjjddp.webp" 
              alt="Background Proses KPR"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b120c] via-[#0b120c]/80 to-[#0b120c]" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Cara Beli & KPR" }
              ]} />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium text-[#F5F1E8] mb-6 uppercase tracking-wider font-serif leading-tight">
              Cara Beli Rumah dan <span className="text-[#F5A524] italic">Proses KPR</span> di Grand Duta City Parung
            </h1>
            
            <p className="text-lg md:text-xl text-[#F5F1E8]/70 leading-relaxed mb-8 max-w-3xl">
              Halaman ini menjelaskan cara beli rumah di{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>, mulai dari pemilihan unit, booking, pembayaran DP, proses pengajuan KPR, hingga tahapan akad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <a href="#tahapan" className="px-8 py-4 rounded-full bg-[#F5A524] text-[#0b120c] font-bold transition-colors hover:bg-brand-light text-center tracking-widest text-xs uppercase flex items-center justify-center gap-2">
                 Lihat Tahapan <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#hubungi-kami" className="px-8 py-4 rounded-full bg-brand-light/5 hover:bg-brand-light/10 text-[#F5F1E8] font-bold transition-colors border border-[#F5F1E8]/20 text-center tracking-widest text-xs uppercase">
                 Konsultasi Gratis
              </a>
            </div>
          </div>
        </section>

        {/* Ringkasan Proses */}
        <section className="py-16 md:py-24 relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
               <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[#F5F1E8]/10 shadow-2xl">
                 <Image 
                   src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp"
                   alt="Langkah Cara Beli Rumah dan Konsultasi KPR di Grand Duta City Parung"
                   fill
                   className="object-cover"
                   sizes="(max-width: 1024px) 100vw, 800px"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c] via-transparent to-transparent"></div>
               </div>
               
               <div>
                  <h2 className="text-3xl font-serif text-[#F5F1E8] mb-6">Ringkasan Pembelian</h2>
                  <p className="text-[#F5F1E8]/70 text-lg leading-relaxed mb-6">
                    Banyak orang mengira membeli rumah itu rumit. Di Grand Duta City Parung, kami membuat setiap proses menjadi lebih mudah, transparan, dan tanpa tekanan.
                  </p>
                  <p className="text-[#F5F1E8]/70 text-lg leading-relaxed mb-8">
                    Dengan dukungan lebih dari 10 bank besar, pengajuan KPR Anda akan dibantu sepenuhnya oleh tim in-house kami. Anda cukup melengkapi dokumen, dan kami yang akan mengurus sisanya hingga disetujui.
                  </p>
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-4 bg-brand-light/5 p-4 rounded-xl border border-[#F5F1E8]/10">
                        <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
                        <span className="text-[#F5F1E8] font-medium">Bebas Biaya KPR* & Bebas BPHTB*</span>
                     </div>
                     <div className="flex items-center gap-4 bg-brand-light/5 p-4 rounded-xl border border-[#F5F1E8]/10">
                        <CheckCircle2 className="w-6 h-6 text-[#10b981]" />
                        <span className="text-[#F5F1E8] font-medium">Proses Cepat, 14 Hari Kerja*</span>
                     </div>
                  </div>
               </div>
            </div>
        </section>

        {/* Tahapan Pembelian */}
        <section id="tahapan" className="py-20 px-4 md:px-8 bg-[#060a07] border-y border-[#F5F1E8]/5 scroll-m-20">
           <div className="max-w-7xl mx-auto">
             <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-16 text-center">6 Langkah Mudah<br/><span className="text-[#F5A524]">Memiliki Rumah</span></h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {steps.map((step, index) => (
                  <div key={step.id} id={step.id} className="bg-brand-light/5 border border-[#F5F1E8]/10 p-8 rounded-2xl hover:bg-brand-light/10 transition-colors group relative scroll-m-24">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5A524]/10 rounded-bl-3xl rounded-tr-2xl flex items-center justify-center text-2xl font-serif text-[#F5A524]/30 font-bold">
                        {index + 1}
                     </div>
                     <div className="bg-[#0b120c] p-4 rounded-xl inline-block mb-6 border border-[#F5F1E8]/5 group-hover:border-[#F5A524]/30 transition-colors">
                        {step.icon}
                     </div>
                     <h3 className="text-xl font-medium text-[#F5F1E8] mb-4">{step.title}</h3>
                     <p className="text-[#F5F1E8]/60 leading-relaxed text-sm">
                        {step.desc}
                     </p>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* Dokumen & Simulasi KPR */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Syarat Dokumen */}
              <div className="bg-[#0b120c] border border-[#F5F1E8]/10 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FileText className="w-48 h-48 text-[#F5F1E8]" />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-serif text-[#F5F1E8] mb-4 relative z-10">Daftar Dokumen<br/><span className="text-[#F5A524]">Yang Dibutuhkan</span></h3>
                 <p className="text-[#F5F1E8]/60 mb-8 relative z-10">Siapkan dokumen-dokumen utama ini untuk mempercepat proses persetujuan kredit Anda.</p>
                 
                 <ul className="space-y-4 relative z-10">
                    {documents.map((doc, idx) => (
                       <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#F5A524] shrink-0 mt-0.5" />
                          <span className="text-[#F5F1E8]/80">{doc.name}</span>
                       </li>
                    ))}
                 </ul>
              </div>

              {/* Simulasi KPR Singkat */}
              <div className="flex flex-col gap-8">
                 <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-[#F5F1E8]/10">
                   <Image 
                      src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775878358/Promo_KPR_Rumah_Tanpa_DP_GDC_Parung_Bogor_ao1pmv.webp"
                      alt="Promo KPR Rumah Tanpa DP Grand Duta City Parung"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 600px"
                   />
                 </div>
                 
                 <div className="bg-[#111] border border-[#F5F1E8]/10 p-8 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                       <Calculator className="w-8 h-8 text-[#F5A524]" />
                       <h3 className="text-2xl font-serif text-[#F5F1E8]">Simulasi KPR Singkat</h3>
                    </div>
                    <p className="text-[#F5F1E8]/70 mb-6">Sebagai ilustrasi, untuk harga rumah <strong>Rp 800 Jutaan</strong>, dengan subsidi DP hingga 0% dan bunga fixed rate 3 tahun, estimasi cicilan per bulan adalah sekitar:</p>
                    <div className="bg-[#060a07] py-6 px-4 rounded-xl border border-[#F5A524]/20 text-center mb-6">
                       <div className="text-[#F5A524] text-sm uppercase tracking-widest font-semibold mb-2">Mulai Dari</div>
                       <div className="text-3xl md:text-4xl text-[#F5F1E8] font-medium">Rp 4.5 Jutaan <span className="text-lg text-[#F5F1E8]/50">/bln</span></div>
                    </div>
                    <p className="text-xs text-[#F5F1E8]/40 leading-relaxed text-center">
                       *Simulasi tidak mengikat dan dapat berubah tergantung suku bunga bank dan durasi tenor (15, 20, 25 tahun). Hubungi kami untuk meminta simulasi akurat <Link href="/pricelist-grand-duta-city" className="text-[#F5A524] hover:underline">lihat harga Grand Duta City Parung</Link>.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Bank Slider */}
        <section className="py-16 bg-[#F2F2F0] border-y border-[#0b120c]/10">
           <div className="max-w-5xl mx-auto px-4 md:px-8 text-center mb-10">
              <h3 className="text-2xl font-serif text-[#0b120c]">Bank Rekanan Kami</h3>
              <p className="text-[#0b120c]/70 mt-2 text-sm">Didukung oleh bank-bank terkemuka untuk keamanan KPR Anda</p>
           </div>
           <BankSlider gradientColorFrom="from-[#F2F2F0]" textColor="text-[#090D0A]/60 text-center" />
        </section>

        {/* FAQ Praktis */}
        <section className="py-24 px-4 md:px-8 max-w-4xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-4">FAQ / Tanya Jawab Tertentu</h2>
              <p className="text-[#F5F1E8]/60">Pertanyaan umum seputar cara beli dan proses KPR</p>
           </div>

           <div className="space-y-6">
              {[
                {
                  q: "Apakah sertifikat rumah sudah pecah?",
                  a: "Ya, di Grand Duta City Parung, status legalitas kepemilikan sangat aman. Sertifikat, IMB / PBG sudah dipecah per kavling."
                },
                {
                  q: "Bagaimana jika KPR ditolak oleh bank?",
                  a: "Tim kami akan mengajukan terlebih dahulu ke 3-4 bank rekanan sekaligus untuk mengurangi risiko penolakan. Jika tetap gagal, uang Booking Fee dapat di-refund dengan syarat dan ketentuan yang berlaku sesuai kebijakan developer."
                },
                {
                  q: "Berapa lama proses persetujuan KPR?",
                  a: "Jika dokumen Anda lengkap sejak awal pengajuan, proses persetujuan atau SPK dapat keluar dalam waktu sekitar 7 sampai 14 hari kerja."
                },
              ].map((faq, i) => (
                <div key={i} className="bg-brand-light/5 border border-[#F5F1E8]/10 hover:border-[#F5A524]/30 p-6 md:p-8 rounded-2xl transition-colors">
                   <div className="flex gap-4">
                      <HelpCircle className="w-6 h-6 text-[#F5A524] shrink-0" />
                      <div>
                         <h4 className="text-lg font-medium text-[#F5F1E8] mb-2">{faq.q}</h4>
                         <p className="text-[#F5F1E8]/70 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Internal Link Interlinking */}
        <section className="pt-8 pb-16 px-4">
           <div className="max-w-4xl mx-auto text-center flex flex-wrap justify-center gap-4">
              <Link href="/cluster-ladera" className="text-[#F5A524] text-sm hover:underline hover:text-[#F5F1E8] transition-colors uppercase tracking-widest font-semibold border border-[#F5F1E8]/10 px-6 py-3 rounded-full bg-brand-light/5">Info Cluster Ladera</Link>
              <Link href="/cluster-cascada" className="text-[#F5A524] text-sm hover:underline hover:text-[#F5F1E8] transition-colors uppercase tracking-widest font-semibold border border-[#F5F1E8]/10 px-6 py-3 rounded-full bg-brand-light/5">Info Cluster Cascada</Link>
              <Link href="/update-stok-siteplan-grand-duta-city-parung" className="text-[#F5A524] text-sm hover:underline hover:text-[#F5F1E8] transition-colors uppercase tracking-widest font-semibold border border-[#F5F1E8]/10 px-6 py-3 rounded-full bg-brand-light/5">Cek Stok Unit Terbaru</Link>
           </div>
        </section>

        {/* Global CTA */}
        <section id="hubungi-kami" className="pb-24 px-4 md:px-8 max-w-7xl mx-auto scroll-m-20">
          <div className="p-10 md:p-16 rounded-3xl bg-[#F5A524] relative overflow-hidden text-center isolate border border-[#F5F1E8]/10">
            <div className="absolute inset-0 opacity-20">
               <Image 
                 src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Marketing_Galeri_n0hwsx.webp"
                 alt="Marketing Galeri Grand Duta City Parung"
                 fill
                 className="object-cover"
               />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c]/90 to-[#0b120c]/60"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
                <h3 className="text-3xl md:text-5xl font-serif text-[#F5F1E8] mb-6">Siap Memiliki Rumah Impian?</h3>
                <p className="text-[#F5F1E8]/80 text-lg mb-10">
                    Hubungi marketing kami untuk simulasi KPR gratis, dan jadwalkan kunjungan Anda ke Grand Duta City Parung hari ini!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20pilih%20rumah%20di%20Grand%20Duta%20City%20dan%20ingin%20dibantu%20simulasi%20KPR." target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#25D366] text-[#F5F1E8] px-8 py-4 rounded-full font-bold hover:bg-[#1ebd5b] transition-colors w-full sm:w-auto justify-center">
                       <Phone className="w-5 h-5" /> Hubungi Marketing
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
