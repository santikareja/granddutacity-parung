import { Metadata } from "next";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, Download, Clock, Info } from "lucide-react";
import { BankSlider } from "@/components/ui/bank-slider";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ClickableSiteplanImage } from "@/components/ui/clickable-siteplan-image";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const hasParams = Object.keys(resolvedSearchParams).length > 0;

  return {
    title: "Update Stok & Siteplan Grand Duta City",
    description: "Halaman ini menampilkan siteplan kawasan dan update stok unit Grand Duta City Parung untuk Cluster Ladera dan Cascada.",
    alternates: {
      canonical: "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung"
    },
    robots: {
      index: !hasParams,
      follow: true,
      googleBot: {
        index: !hasParams,
        follow: true,
        "max-image-preview": "large",
      }
    }
  }
}

const LAST_UPDATED_VISUAL = "17 Agustus 2026";
const LAST_UPDATED_ISO = "2026-08-17T00:00:00+07:00";
const AUTHOR_ID = "https://granddutacitysouthofjakarta.com/author/santika-reza#person";
const AUTHOR_URL = "https://granddutacitysouthofjakarta.com/author/santika-reza";

export default function UpdateStokSiteplanPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung#webpage",
        "url": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung",
        "name": "Update Stok & Siteplan Grand Duta City Parung",
        "description": "Halaman ini menampilkan siteplan kawasan dan update stok unit Grand Duta City Parung untuk Cluster Ladera dan Cascada.",
        "datePublished": LAST_UPDATED_ISO,
        "dateModified": LAST_UPDATED_ISO,
        "author": {
          "@id": AUTHOR_ID,
          "@type": "Person",
          "name": "Santika Reza",
          "url": AUTHOR_URL
        },
        "primaryImageOfPage": {
          "@id": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung#primaryimage"
        }
      },
      {
        "@type": "ImageObject",
        "@id": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung#primaryimage",
        "inLanguage": "id-ID",
        "url": "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp",
        "contentUrl": "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp",
        "caption": "Siteplan Grand Duta City Parung dengan update stok Cluster Ladera dan Cascada."
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Beranda",
            "item": "https://granddutacitysouthofjakarta.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Update Stok",
            "item": "https://granddutacitysouthofjakarta.com/update-stok-siteplan-grand-duta-city-parung"
          }
        ]
      }
    ]
  };

  return (
    <>
      <Header />
      <main className="relative w-full overflow-hidden bg-[#0b120c] font-sans pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Update Stok & Siteplan" }
              ]} />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5A524]/30 bg-[#F5A524]/10 text-[#F5A524] text-sm font-medium mb-6">
              <Clock className="w-4 h-4" />
              Terakhir diperbarui: {LAST_UPDATED_VISUAL}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-[#F5F1E8] mb-6 uppercase tracking-wider font-serif">
              Update Stok & <span className="text-[#F5A524] italic">Siteplan</span>
            </h1>

            <p className="text-lg md:text-xl text-[#F5F1E8]/70 leading-relaxed mb-8">
              Halaman ini menampilkan siteplan kawasan dan update stok unit{" "}
              <Link href="/" className="text-[#F5A524] hover:underline">Grand Duta City Parung</Link>{" "}
              untuk Cluster Ladera dan Cascada. Lihat posisi unit, status ketersediaan, dan hubungi marketing untuk konfirmasi unit terbaru.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center w-full md:w-auto mb-12">
              <a href="#cluster-ladera" className="px-8 py-3 rounded-full bg-brand-light/5 hover:bg-brand-light/10 text-[#F5F1E8] font-medium transition-colors border border-[#F5F1E8]/20 text-center tracking-widest text-xs uppercase">
                Stok Ladera
              </a>
              <a href="#cluster-cascada" className="px-8 py-3 rounded-full bg-brand-light/5 hover:bg-brand-light/10 text-[#F5F1E8] font-medium transition-colors border border-[#F5F1E8]/20 text-center tracking-widest text-xs uppercase">
                Stok Cascada
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5A524]/5 border border-[#F5A524]/20 text-left w-full flex items-start gap-4">
              <Info className="w-6 h-6 text-[#F5A524] shrink-0 mt-0.5" />
              <div className="text-sm text-[#F5F1E8]/80 leading-relaxed">
                <strong className="text-[#F5A524] block mb-1">Catatan Penting:</strong>
                Ini adalah halaman update stok unit resmi. Data ketersediaan dapat berubah sewaktu-waktu tanpa pemberitahuan. Booking fee dan pembayaran menjadi acuan akhir ketersediaan unit. Anda sangat disarankan untuk mengonfirmasi ketersediaan blok/unit pilihan langsung kepada tim marketing kami.
              </div>
            </div>
          </div>

          <div className="relative justify-center flex flex-col w-full max-w-5xl mx-auto">
            <h2 className="text-2xl font-serif text-[#F5F1E8] mb-4 pl-4 border-l-2 border-[#F5A524]">Siteplan Kawasan Terpadu</h2>
            <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden border border-[#F5F1E8]/10 shadow-2xl bg-black/50 group">
              <ClickableSiteplanImage
                src="https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp"
                alt="Siteplan Grand Duta City Parung dengan update stok Cluster Ladera dan Cascada."
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
                title="Siteplan Kawasan Terpadu Grand Duta City Parung"
              />
              <div className="absolute top-4 right-4 bg-[#0b120c]/90 backdrop-blur-md border border-[#F5F1E8]/10 p-4 rounded-xl text-xs md:text-sm text-[#F5F1E8] shadow-xl">
                <div className="font-semibold mb-3 border-b border-[#F5F1E8]/10 pb-2 tracking-wider uppercase text-[10px] text-[#F5A524]">Legenda Status Unit</div>
                <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Tersedia / vailable</div>
                <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> Reservasi</div>
                <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> Terjual / Sold</div>
                <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span> Rumah Progress</div>
              </div>
            </div>
          </div>
        </section>

        {/* Ringkasan & Shortcuts */}
        <section className="py-16 bg-brand-light/[0.02] border-y border-[#F5F1E8]/5 relative z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
              <div className="p-8 rounded-2xl bg-[#0b120c] border border-[#F5F1E8]/10 flex flex-col">
                <h3 className="text-2xl font-serif text-[#F5F1E8] mb-2">Cluster Ladera</h3>
                <div className="inline-flex max-w-fit items-center gap-1.5 px-3 py-1 bg-[#10b981]/20 text-[#10b981] text-xs font-semibold uppercase tracking-wider rounded border border-[#10b981]/30 mb-4">
                  Tersedia Terbatas
                </div>
                <p className="text-[#F5F1E8]/60 mb-6 grow leading-relaxed">
                  Stok didominasi unit sold. Sisa unit available dan reservasi tersebar di beberapa blok bagian dalam dan sisi kanan siteplan.
                </p>
                <a href="#cluster-ladera" className="inline-flex items-center gap-2 text-[#F5A524] hover:text-[#F5F1E8] transition-colors text-sm uppercase tracking-widest font-medium">
                  Lihat Stok Ladera <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="p-8 rounded-2xl bg-[#0b120c] border border-[#F5F1E8]/10 flex flex-col">
                <h3 className="text-2xl font-serif text-[#F5F1E8] mb-2">Cluster Cascada</h3>
                <div className="inline-flex max-w-fit items-center gap-1.5 px-3 py-1 bg-[#10b981]/20 text-[#10b981] text-xs font-semibold uppercase tracking-wider rounded border border-[#10b981]/30 mb-4">
                  Tersedia Terbatas
                </div>
                <p className="text-[#F5F1E8]/60 mb-6 grow leading-relaxed">
                  Stok mayoritas sold. Beberapa unit tersedia tersebar di area kiri-bawah, koridor kanan, dan jalur depan dekat boulevard utama.
                </p>
                <a href="#cluster-cascada" className="inline-flex items-center gap-2 text-[#F5A524] hover:text-[#F5F1E8] transition-colors text-sm uppercase tracking-widest font-medium">
                  Lihat Stok Cascada <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Detail Cluster Ladera */}
        <section id="cluster-ladera" className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto scroll-m-20">
          <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-[#F5F1E8]/10 pb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-3">Stok Cluster Ladera</h2>
              <p className="text-[#F5F1E8]/60">Tipe Verona (39/60), Malta (47/72), Tuscan (66/72) & Frontera (90/89)</p>
            </div>
            <div className="flex gap-4">
              <Link href="/cluster-ladera" className="px-6 py-2.5 rounded-full bg-brand-light/5 border border-[#F5F1E8]/10 text-[#F5F1E8] text-xs uppercase tracking-widest hover:bg-brand-light/10 transition-colors">
                Info Cluster
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Image Column */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#F5F1E8]/10 shadow-2xl bg-black/50 group">
                <ClickableSiteplanImage
                  src="https://ik.imagekit.io/granddutacityparung/Cluster%20Ladera%20Grand%20Duta%20City%20Bogor%20Update%20Stok%2017%20Agustus.webp"
                  alt="Siteplan Update Stok Cluster Ladera 17 Agustus 2026"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  title="Update Stok Cluster Ladera - 17 Agustus 2026"
                />
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 rounded-2xl p-6">
                <h3 className="text-[#F5A524] tracking-wider uppercase text-xs font-semibold mb-4">Tipe Unit Ladera</h3>
                <div className="space-y-4">
                  <div className="border-b border-[#F5F1E8]/5 pb-4">
                    <div className="text-[#F5F1E8] font-medium text-lg mb-1">Tipe Verona</div>
                    <div className="text-[#F5F1E8]/50 text-sm mb-2">Luas Bangunan: 39 m² | Luas Tanah: 60 m²</div>
                    <div className="text-[#F5F1E8]/80 text-sm leading-relaxed">
                      Unit minimalis modern yang efisien untuk keluarga baru.
                    </div>
                  </div>
                  <div className="border-b border-[#F5F1E8]/5 pb-4">
                    <div className="text-[#F5F1E8] font-medium text-lg mb-1">Tipe Malta</div>
                    <div className="text-[#F5F1E8]/50 text-sm mb-2">Luas Bangunan: 47 m² | Luas Tanah: 72 m²</div>
                    <div className="text-[#F5F1E8]/80 text-sm leading-relaxed">
                      Tersebar di area Blok J.11, J.17, J.18, J.19, J.20, dan J.21.
                    </div>
                  </div>
                  <div className="border-b border-[#F5F1E8]/5 pb-4">
                    <div className="text-[#F5F1E8] font-medium text-lg mb-1">Tipe Tuscan</div>
                    <div className="text-[#F5F1E8]/50 text-sm mb-2">Luas Bangunan: 66 m² | Luas Tanah: 72 m²</div>
                    <div className="text-[#F5F1E8]/80 text-sm leading-relaxed">
                      Tersebar di area Blok J.6, J.7, J.8, J.10, J.13, J.14, dan J.15.
                    </div>
                  </div>
                  <div className="">
                    <div className="text-[#F5F1E8] font-medium text-lg mb-1">Tipe Frontera</div>
                    <div className="text-[#F5F1E8]/50 text-sm mb-2">Luas Bangunan: 90 m² | Luas Tanah: 89 m²</div>
                    <div className="text-[#F5F1E8]/80 text-sm leading-relaxed">
                      Unit dengan tata ruang premium yang lega dan maksimal.
                    </div>
                  </div>
                </div>
              </div>

              <a href="https://wa.me/628131742034" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#F5A524] text-[#0b120c] font-semibold tracking-wider text-sm hover:bg-brand-light transition-all shadow-[0_0_20px_rgba(245,165,36,0.3)]">
                <Phone className="w-4 h-4" />
                Cek Ketersediaan Ladera
              </a>
            </div>
          </div>
        </section>

        {/* Detail Cluster Cascada */}
        <section id="cluster-cascada" className="pt-12 pb-24 px-4 md:px-8 max-w-7xl mx-auto scroll-m-20">
          <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-[#F5F1E8]/10 pb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-[#F5F1E8] mb-3">Stok Cluster Cascada</h2>
              <p className="text-[#F5F1E8]/60">Tipe Aira, Kea, Manoa, Victoria, Madeira, hingga Alexandra</p>
            </div>
            <div className="flex gap-4">
              <Link href="/cluster-cascada" className="px-6 py-2.5 rounded-full bg-brand-light/5 border border-[#F5F1E8]/10 text-[#F5F1E8] text-xs uppercase tracking-widest hover:bg-brand-light/10 transition-colors">
                Info Cluster
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Image Column */}
            <div className="lg:col-span-7 xl:col-span-8 lg:order-2">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#F5F1E8]/10 shadow-2xl bg-black/50 group">
                <ClickableSiteplanImage
                  src="https://ik.imagekit.io/granddutacityparung/Cluster%20Cascada%20Update%20Stok%2017%20Agustus%202026.webp"
                  alt="Siteplan Update Stok Cluster Cascada 17 Agustus 2026"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  title="Update Stok Cluster Cascada - 17 Agustus 2026"
                />
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-5 xl:col-span-4 lg:order-1 flex flex-col gap-6">
              <div className="bg-brand-light/5 border border-[#F5F1E8]/10 rounded-2xl p-6">
                <h3 className="text-[#F5A524] tracking-wider uppercase text-xs font-semibold mb-4">Sebaran Tipe & Blok</h3>
                <ul className="space-y-3">
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-39</span> <span className="text-[#F5F1E8]/70">Blok H.11 & H.13</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-42</span> <span className="text-[#F5F1E8]/70">Blok H.18 & H.19</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-47</span> <span className="text-[#F5F1E8]/70">Blok H.10 & H.11</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-58</span> <span className="text-[#F5F1E8]/70">Blok H.15, H.16, H.18</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-62</span> <span className="text-[#F5F1E8]/70">Blok H.18 (Hook)</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-69</span> <span className="text-[#F5F1E8]/70">Blok H.14</span></li>
                  <li className="flex items-start text-sm"><span className="text-[#F5F1E8] font-medium w-16">T-88</span> <span className="text-[#F5F1E8]/70">Blok H.1 & H.3</span></li>
                </ul>
              </div>

              <a href="https://wa.me/628131742034" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#F5A524] text-[#0b120c] font-semibold tracking-wider text-sm hover:bg-brand-light transition-all shadow-[0_0_20px_rgba(245,165,36,0.3)]">
                <Phone className="w-4 h-4" />
                Cek Ketersediaan Cascada
              </a>
            </div>
          </div>
        </section>

        {/* Navigasi / Internal Links */}
        <section className="py-16 border-t border-[#F5F1E8]/10 bg-[#060a07]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
            <h3 className="text-2xl font-serif text-[#F5F1E8] mb-8">Eksplorasi Grand Duta City</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/cluster-ladera" className="px-6 py-3 rounded-xl border border-[#F5F1E8]/10 bg-brand-light/5 hover:bg-[#F5A524]/10 hover:border-[#F5A524]/50 hover:text-[#F5A524] text-[#F5F1E8]/80 transition-all text-sm font-medium">Cluster Ladera</Link>
              <Link href="/cluster-cascada" className="px-6 py-3 rounded-xl border border-[#F5F1E8]/10 bg-brand-light/5 hover:bg-[#F5A524]/10 hover:border-[#F5A524]/50 hover:text-[#F5A524] text-[#F5F1E8]/80 transition-all text-sm font-medium">Cluster Cascada</Link>
              <Link href="/pricelist-grand-duta-city" className="px-6 py-3 rounded-xl border border-[#F5F1E8]/10 bg-brand-light/5 hover:bg-[#F5A524]/10 hover:border-[#F5A524]/50 hover:text-[#F5A524] text-[#F5F1E8]/80 transition-all text-sm font-medium">Informasi Harga</Link>
              <Link href="/#lokasi" className="px-6 py-3 rounded-xl border border-[#F5F1E8]/10 bg-brand-light/5 hover:bg-[#F5A524]/10 hover:border-[#F5A524]/50 hover:text-[#F5A524] text-[#F5F1E8]/80 transition-all text-sm font-medium">Lokasi Strategis</Link>
              <Link href="/#faq" className="px-6 py-3 rounded-xl border border-[#F5F1E8]/10 bg-brand-light/5 hover:bg-[#F5A524]/10 hover:border-[#F5A524]/50 hover:text-[#F5A524] text-[#F5F1E8]/80 transition-all text-sm font-medium">Cara Beli / KPR</Link>
            </div>
          </div>
        </section>

        {/* Bank Slider */}
        <section className="py-16 bg-[#F2F2F0] border-y border-[#0b120c]/10">
          <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
            <BankSlider gradientColorFrom="from-[#F2F2F0]" textColor="text-[#090D0A]/60 text-center" />
          </div>
        </section>

        {/* Global CTA */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto p-12 rounded-3xl bg-[#F5A524] relative overflow-hidden text-center isolate">
            <div className="absolute inset-0 opacity-10 bg-[url('https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b120c]/80 to-transparent"></div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-serif text-[#F5F1E8] mb-6">Konsultasi dengan<br />Marketing Kami</h3>
              <p className="text-[#F5F1E8]/80 text-lg mb-10 max-w-2xl mx-auto">
                Ketersediaan stok unit berubah dengan cepat. Hubungi kami sekarang untuk mendapatkan file siteplan resolusi tinggi, pricelist terbaru, maupun simulasi KPR.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="https://wa.me/628131742034" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#25D366] text-[#F5F1E8] px-8 py-4 rounded-full font-bold hover:bg-[#1ebd5b] transition-colors w-full sm:w-auto justify-center">
                  <Phone className="w-5 h-5" /> Hubungi via WhatsApp
                </a>
                <a href="https://wa.me/628131742034?text=Halo%2C%20saya%20tertarik%20dengan%20Grand%20Duta%20City%20dan%20ingin%20meminta%20Siteplan%20HD%20serta%20Pricelist%20terbaru." target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-transparent text-[#F5F1E8] border-2 border-[#F5F1E8]/30 px-8 py-4 rounded-full font-bold hover:bg-brand-light hover:text-[#0b120c] transition-colors w-full sm:w-auto justify-center">
                  <Download className="w-5 h-5" /> Minta Siteplan HD & Harga
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
