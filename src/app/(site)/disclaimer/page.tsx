import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { OG_SITE_NAME } from "@/lib/seo";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/disclaimer`;

/**
 * Diekspor untuk guard G19 (seo-invariants.test.ts): memastikan H1 halaman
 * ini tidak pernah dibuka dengan frasa brand milik homepage. Ini SATU-SATUNYA
 * sumber teks H1 — JSX di bawah merender konstanta ini, bukan literal
 * terpisah, jadi tidak ada risiko keduanya menyimpang.
 */
export const PAGE_H1 = "Disclaimer";

export const metadata: Metadata = {
  title: { absolute: "Disclaimer | Informasi Penting Situs" },
  description: "Penjelasan batasan informasi, harga, stok, visual, spesifikasi, dan penggunaan konten pada situs Grand Duta City Parung.",
  alternates: { canonical: PAGE_URL },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Disclaimer | Informasi Penting Situs",
    description: "Penjelasan batasan informasi, harga, stok, visual, spesifikasi, dan penggunaan konten pada situs Grand Duta City Parung.",
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
  },
};

export default function DisclaimerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "@id": `${PAGE_URL}#breadcrumb`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Beranda", item: `${SITE_URL}/` },
                  { "@type": "ListItem", position: 2, name: "Disclaimer", item: PAGE_URL },
                ],
              },
              {
                "@type": "WebPage",
                "@id": `${PAGE_URL}#webpage`,
                url: PAGE_URL,
                name: "Disclaimer | Informasi Penting Situs",
                description: "Penjelasan batasan informasi, harga, stok, visual, spesifikasi, dan penggunaan konten pada situs Grand Duta City Parung.",
                breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
                inLanguage: "id",
              },
            ],
          }),
        }}
      />
      <Header />
      <main className="relative w-full overflow-hidden bg-brand-light">
        <section className="bg-[#0b120c] pb-16 pt-32 text-[#F5F1E8] md:pb-20 md:pt-40">
          <div className="mx-auto max-w-screen-md px-6 text-center md:px-14 flex flex-col items-center">
            <div className="mb-6">
              <Breadcrumb items={[
                { label: "Disclaimer" }
              ]} />
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F5A524] md:text-5xl lg:text-6xl">
              {PAGE_H1}
            </h1>
            <p className="mt-6 text-base text-[#F5F1E8]/80">
              Terakhir diperbarui: 12 April 2026
            </p>
          </div>
        </section>

        <section className="bg-brand-light py-16 md:py-24">
          <div className="mx-auto max-w-screen-md px-6 md:px-14">
            <article className="prose-legal">
              <p>
                Seluruh informasi yang tersedia pada situs granddutacitysouthofjakarta.com mengenai Grand Duta City Parung / Grand Duta City South of Jakarta disediakan untuk tujuan informasi umum dan pemasaran awal.
              </p>

              <p>
                Kami berupaya menjaga agar informasi pada situs ini akurat dan relevan. Namun, kami tidak menjamin bahwa seluruh informasi akan selalu lengkap, final, mutakhir, atau bebas dari perubahan sewaktu-waktu.
              </p>

              <h2 className="mt-10 font-bold">1. Informasi Umum</h2>
              <p>
                Konten pada situs ini disediakan sebagai informasi awal bagi calon pembeli atau pihak yang membutuhkan informasi mengenai:
              </p>
              <ul className="list-[lower-alpha]">
                <li>proyek;</li>
                <li>cluster;</li>
                <li>harga;</li>
                <li>lokasi;</li>
                <li>siteplan;</li>
                <li>fasilitas;</li>
                <li>proses pembelian.</li>
              </ul>
              <p>
                Informasi pada situs ini tidak boleh dianggap sebagai jaminan mutlak, pernyataan final, atau pengganti konfirmasi resmi dari tim marketing, developer, maupun dokumen transaksi yang sah.
              </p>

              <h2 className="mt-10 font-bold">2. Harga, Promo, dan Stok</h2>
              <p>
                Dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu, termasuk namun tidak terbatas pada:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Harga;</li>
                <li>promo;</li>
                <li>metode pembayaran;</li>
                <li>simulasi cicilan;</li>
                <li>booking fee;</li>
                <li>ketersediaan unit.</li>
              </ul>
              <p>
                Ketersediaan unit, nomor unit, posisi unit, dan status sold / booking / available pada halaman siteplan atau halaman stok bersifat informatif dan wajib dikonfirmasi kembali kepada tim marketing sebelum Anda mengambil keputusan.
              </p>

              <h2 className="mt-10 font-bold">3. Siteplan, Layout, dan Spesifikasi</h2>
              <p>
                Informasi yang ditampilkan pada situs ini dapat berubah atau disesuaikan mengikuti kebijakan developer, kondisi lapangan, tahapan pembangunan, dan/atau ketentuan yang berlaku, termasuk:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Siteplan;</li>
                <li>denah;</li>
                <li>visual;</li>
                <li>layout;</li>
                <li>spesifikasi;</li>
                <li>ukuran;</li>
                <li>fasilitas;</li>
                <li>informasi teknis lainnya.</li>
              </ul>
              <p>
                Jika terdapat perbedaan antara informasi di situs ini dan dokumen resmi yang dikeluarkan dalam proses transaksi, maka dokumen resmi tersebut yang berlaku.
              </p>

              <h2 className="mt-10 font-bold">4. Gambar dan Visualisasi</h2>
              <p>
                Materi visual pada situs ini dapat digunakan untuk tujuan presentasi dan pemasaran. Sebagian visual mungkin bersifat ilustratif dan tidak selalu merepresentasikan kondisi akhir secara identik, meliputi:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Foto;</li>
                <li>ilustrasi;</li>
                <li>artist impression;</li>
                <li>render 3D;</li>
                <li>materi visual lainnya.</li>
              </ul>

              <h2 className="mt-10 font-bold">5. Lokasi, Akses, dan Fasilitas Sekitar</h2>
              <p>
                Informasi disusun berdasarkan data yang tersedia pada saat publikasi, meliputi:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Lokasi;</li>
                <li>waktu tempuh;</li>
                <li>akses jalan;</li>
                <li>fasilitas umum;</li>
                <li>landmark;</li>
                <li>sarana pendukung sekitar.</li>
              </ul>
              <p>Kondisi aktual dapat berubah sesuai situasi lapangan, kebijakan pemerintah, perkembangan wilayah, dan faktor lain di luar kendali kami.</p>

              <h2 className="mt-10 font-bold">6. KPR dan Pembiayaan</h2>
              <p>
                Informasi mengenai pembiayaan bersifat perkiraan awal. Persetujuan akhir sepenuhnya mengikuti kebijakan bank atau lembaga pembiayaan terkait serta profil calon pembeli, yang mencakup informasi tentang:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Simulasi KPR;</li>
                <li>cicilan;</li>
                <li>suku bunga;</li>
                <li>tenor;</li>
                <li>approval;</li>
                <li>skema pembiayaan.</li>
              </ul>

              <h2 className="mt-10 font-bold">7. Tautan Pihak Ketiga</h2>
              <p>
                Situs ini dapat memuat tautan ke situs atau layanan pihak ketiga, termasuk:
              </p>
              <ul className="list-[lower-alpha]">
                <li>Google Maps;</li>
                <li>WhatsApp;</li>
                <li>media sosial;</li>
                <li>situs pihak lain.</li>
              </ul>
              <p>
                Kami tidak bertanggung jawab atas isi, akurasi, keamanan, atau kebijakan dari situs pihak ketiga tersebut.
              </p>

              <h2 className="mt-10 font-bold">8. Bukan Nasihat Hukum, Keuangan, atau Investasi</h2>
              <p>
                Informasi pada situs ini bukan merupakan:
              </p>
              <ul className="list-[lower-alpha]">
                <li>nasihat hukum;</li>
                <li>nasihat keuangan;</li>
                <li>nasihat perpajakan;</li>
                <li>rekomendasi investasi.</li>
              </ul>
              <p>
                Untuk keputusan yang bersifat hukum, pembiayaan, atau investasi, Anda disarankan berkonsultasi dengan pihak profesional yang berwenang.
              </p>

              <h2 className="mt-10 font-bold">9. Hak Kekayaan Intelektual</h2>
              <p>
                Seluruh konten pada situs ini dilindungi oleh ketentuan hak cipta dan/atau hak lain yang berlaku, termasuk namun tidak terbatas pada:
              </p>
              <ul className="list-[lower-alpha]">
                <li>teks;</li>
                <li>gambar;</li>
                <li>desain;</li>
                <li>layout;</li>
                <li>logo;</li>
                <li>materi pemasaran lainnya.</li>
              </ul>
              <p>
                Dilarang menyalin, menggunakan, memodifikasi, atau mendistribusikan konten tanpa izin tertulis dari pihak yang berwenang.
              </p>

              <h2 className="mt-10 font-bold">10. Perubahan Isi Situs dan Disclaimer</h2>
              <p>
                Kami berhak untuk:
              </p>
              <ul className="list-[lower-alpha]">
                <li>mengubah isi situs;</li>
                <li>menambah informasi;</li>
                <li>memperbarui konten;</li>
                <li>menghapus isi situs dan isi Disclaimer ini kapan saja tanpa pemberitahuan terlebih dahulu.</li>
              </ul>

              <h2 className="mt-10 font-bold">11. Kontak</h2>
              <p>Apabila Anda menemukan informasi yang perlu dikoreksi atau ingin mendapatkan konfirmasi resmi mengenai harga, stok, spesifikasi, atau detail lain, silakan hubungi:</p>
              
              <ul className="list-none !pl-0">
                <li><span className="font-semibold text-[#0b120c]">Melalui Email:</span> <a href="mailto:contact@granddutacitysouthofjakarta.com">contact@granddutacitysouthofjakarta.com</a></li>
                <li><span className="font-semibold text-[#0b120c]">Melalui WhatsApp:</span> <a href="https://wa.me/628131742034" data-wa-placement="legal-contact-list" target="_blank" rel="noopener noreferrer">0813-1742-034</a></li>
                <li><span className="font-semibold text-[#0b120c]">Berkunjung Langsung:</span> Jl. Boulevard GDC, Kec. Parung, Bogor, Jawa Barat 16330</li>
              </ul>
              
              <address className="not-italic mt-6 p-6 bg-brand-light rounded-2xl border border-[#0b120c]/10 text-sm">
                <strong>Santika Reza</strong> <br />
                Jl. Boulevard GDC, <br />
                Kec. Parung, Bogor, <br />
                Jawa Barat 16330 <br /><br />
                Email: <a href="mailto:contact@granddutacitysouthofjakarta.com">contact@granddutacitysouthofjakarta.com</a> <br />
                WhatsApp: <a href="https://wa.me/628131742034" data-wa-placement="legal-contact-address" target="_blank" rel="noopener noreferrer">0813-1742-034</a>
              </address>
              
            </article>

            <div className="mt-16 flex justify-center border-t border-[#0b120c]/10 pt-10">
              <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-[#0b120c]/20 px-8 py-3 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c] hover:border-[#F5A524] hover:text-[#F5A524] transition-colors">
                <ArrowLeft className="h-4 w-4" /> Kembali ke Grand Duta City Parung
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
