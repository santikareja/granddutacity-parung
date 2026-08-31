import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { OG_SITE_NAME } from "@/lib/seo";

const SITE_URL = "https://granddutacitysouthofjakarta.com";
const PAGE_URL = `${SITE_URL}/privacy-policy`;

// Halaman legal tidak punya alasan bisnis untuk membawa frasa kata kunci utama
// di title — ia hanya bersaing dengan homepage tanpa imbalan. Brand dicabut
// dari title; description dibiarkan karena konteksnya faktual dan panjangnya
// sudah di dalam rentang.
export const metadata: Metadata = {
  title: { absolute: "Kebijakan Privasi" },
  description: "Penjelasan tentang pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pada situs Grand Duta City Parung.",
  alternates: { canonical: PAGE_URL },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Kebijakan Privasi",
    description: "Penjelasan tentang pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pada situs Grand Duta City Parung.",
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
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
                  { "@type": "ListItem", position: 2, name: "Kebijakan Privasi", item: PAGE_URL },
                ],
              },
              {
                "@type": "WebPage",
                "@id": `${PAGE_URL}#webpage`,
                url: PAGE_URL,
                name: "Kebijakan Privasi Grand Duta City Parung",
                description: "Penjelasan tentang pengumpulan, penggunaan, penyimpanan, dan perlindungan data pribadi pada situs Grand Duta City Parung.",
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
                { label: "Kebijakan Privasi" }
              ]} />
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F5A524] md:text-5xl lg:text-6xl">
              Kebijakan Privasi
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
                Kebijakan Privasi ini menjelaskan bagaimana situs ini (&ldquo;granddutacitysouthofjakarta.com&rdquo;) mengumpulkan, menggunakan, menyimpan, melindungi, dan membagikan data pribadi pengguna situs granddutacitysouthofjakarta.com yang memuat informasi mengenai Grand Duta City Parung / Grand Duta City South of Jakarta.
              </p>

              <p>
                Dengan menggunakan situs ini, mengisi formulir, menghubungi kami melalui WhatsApp, telepon, email, atau kanal lain yang tersedia, Anda memahami dan menyetujui pemrosesan data pribadi sebagaimana dijelaskan dalam Kebijakan Privasi ini, sepanjang diperbolehkan oleh peraturan perundang-undangan yang berlaku.
              </p>

              <h2 className="mt-10 font-bold">1. Data yang Kami Kumpulkan</h2>
              <p>Kami dapat mengumpulkan data berikut:</p>
              <ul>
                <li>nama lengkap;</li>
                <li>nomor telepon atau WhatsApp;</li>
                <li>alamat email;</li>
                <li>area minat, seperti Cluster Ladera atau Cluster Cascada;</li>
                <li>preferensi pembelian, anggaran, metode pembayaran, atau kebutuhan KPR;</li>
                <li>isi pesan, pertanyaan, atau permintaan yang Anda kirimkan;</li>
                <li>data teknis, seperti alamat IP, jenis perangkat, browser, halaman yang dikunjungi, waktu akses, dan sumber kunjungan;</li>
                <li>data penggunaan situs melalui cookies, analytics, atau teknologi serupa.</li>
              </ul>

              <h2 className="mt-10 font-bold">2. Cara Kami Mengumpulkan Data</h2>
              <p>Data pribadi dapat kami kumpulkan melalui:</p>
              <ul>
                <li>formulir kontak, formulir lead, atau formulir permintaan pricelist;</li>
                <li>percakapan melalui WhatsApp, telepon, email, atau chat;</li>
                <li>permintaan jadwal survey atau kunjungan lokasi;</li>
                <li>penggunaan situs, termasuk cookies, analytics, dan log server;</li>
                <li>dokumen atau informasi tambahan yang Anda berikan secara sukarela dalam proses konsultasi pembelian.</li>
              </ul>

              <h2 className="mt-10 font-bold">3. Tujuan Penggunaan Data</h2>
              <p>Data pribadi Anda dapat kami gunakan untuk:</p>
              <ul>
                <li>menanggapi pertanyaan dan permintaan Anda;</li>
                <li>mengirimkan pricelist, siteplan, brosur, update stok, atau informasi proyek;</li>
                <li>menjadwalkan survey, kunjungan lokasi, atau konsultasi;</li>
                <li>membantu proses awal pembelian rumah dan/atau pengajuan KPR;</li>
                <li>melakukan follow-up pemasaran yang relevan;</li>
                <li>meningkatkan kualitas layanan, konten, dan performa situs;</li>
                <li>menjaga keamanan situs dan mencegah penyalahgunaan;</li>
                <li>memenuhi kewajiban hukum yang berlaku.</li>
              </ul>

              <h2 className="mt-10 font-bold">4. Dasar Pemrosesan Data</h2>
              <p>Pemrosesan data pribadi dilakukan berdasarkan:</p>
              <ul>
                <li>persetujuan Anda;</li>
                <li>permintaan Anda sebelum kemungkinan terjadinya perjanjian atau transaksi;</li>
                <li>pelaksanaan kewajiban hukum;</li>
                <li>kepentingan yang sah, sepanjang diperbolehkan oleh peraturan yang berlaku.</li>
              </ul>

              <h2 className="mt-10 font-bold">5. Cookies, Analytics, dan Teknologi Serupa</h2>
              <p>Situs ini dapat menggunakan cookies dan teknologi serupa untuk:</p>
              <ul>
                <li>memahami cara pengunjung menggunakan situs;</li>
                <li>mengukur performa halaman;</li>
                <li>meningkatkan pengalaman pengguna;</li>
                <li>menilai efektivitas kampanye pemasaran.</li>
              </ul>
              <p>
                Jika kami menggunakan Google Analytics, data penggunaan situs dapat diproses sesuai kebijakan Google. Anda dapat membaca informasi lebih lanjut melalui 
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer"> Kebijakan Privasi dan Syarat Google Analytics</a>. 
              </p>
              <p>
                Anda juga dapat mengatur browser untuk menolak sebagian atau seluruh cookies. Namun, perlu diperhatikan bahwa beberapa fungsi situs mungkin tidak berjalan secara optimal.
              </p>

              <h2 className="mt-10 font-bold">6. Pembagian Data kepada Pihak Ketiga</h2>
              <p>Kami tidak menjual data pribadi Anda.</p>
              <p>Dalam kondisi tertentu, kami dapat membagikan data pribadi Anda secara terbatas kepada:</p>
              <ul>
                <li>tim internal pemasaran dan admin yang berwenang;</li>
                <li>penyedia hosting, email, CRM, atau layanan formulir;</li>
                <li>penyedia analytics seperti Google Analytics, layanan peta, atau layanan teknis lainnya;</li>
                <li>bank atau mitra pembiayaan, apabila Anda secara jelas meminta bantuan proses KPR atau simulasi lanjutan;</li>
                <li>pihak lain yang diwajibkan oleh hukum.</li>
              </ul>
              <p>Setiap pembagian data hanya dilakukan sejauh diperlukan untuk tujuan yang sah dan relevan.</p>

              <h2 className="mt-10 font-bold">7. Penyimpanan dan Retensi Data</h2>
              <p>Kami menyimpan data pribadi hanya selama diperlukan untuk:</p>
              <ul>
                <li>tujuan pengumpulan data;</li>
                <li>tindak lanjut layanan;</li>
                <li>kepatuhan hukum;</li>
                <li>penyelesaian sengketa;</li>
                <li>perlindungan kepentingan yang sah.</li>
              </ul>
              <p>
                Setelah data tidak lagi diperlukan, data akan dihapus, dimusnahkan, atau dianonimkan sesuai kebijakan internal dan ketentuan yang berlaku.
              </p>

              <h2 className="mt-10 font-bold">8. Keamanan Data</h2>
              <p>Kami berupaya melindungi data pribadi Anda dengan langkah-langkah administratif, teknis, dan operasional yang wajar untuk mencegah:</p>
              <ul>
                <li>akses yang tidak sah;</li>
                <li>penggunaan yang tidak sah;</li>
                <li>perubahan tanpa izin;</li>
                <li>pengungkapan yang tidak sah;</li>
                <li>kehilangan data.</li>
              </ul>
              <p>
                Namun, tidak ada sistem elektronik yang sepenuhnya bebas risiko. Karena itu, kami tidak dapat menjamin keamanan secara absolut, meskipun kami tetap berupaya menerapkan perlindungan yang layak.
              </p>

              <h2 className="mt-10 font-bold">9. Transfer Data ke Luar Indonesia</h2>
              <p>
                Apabila kami menggunakan layanan pihak ketiga yang infrastrukturnya berada di luar Indonesia, data pribadi Anda dapat diproses atau disimpan di luar wilayah Indonesia, sepanjang hal tersebut dilakukan sesuai ketentuan hukum yang berlaku dan disertai perlindungan yang memadai.
              </p>

              <h2 className="mt-10 font-bold">10. Hak Anda</h2>
              <p>Sesuai ketentuan yang berlaku, Anda dapat mengajukan permintaan untuk:</p>
              <ul>
                <li>mengetahui data pribadi Anda yang kami proses;</li>
                <li>memperbarui atau memperbaiki data yang tidak akurat;</li>
                <li>memperoleh akses atau salinan data tertentu;</li>
                <li>menarik persetujuan;</li>
                <li>membatasi pemrosesan tertentu;</li>
                <li>meminta penghapusan data, sepanjang dimungkinkan oleh hukum;</li>
                <li>mengajukan pertanyaan atau keluhan terkait pemrosesan data.</li>
              </ul>
              <p>Untuk menggunakan hak-hak tersebut, silakan hubungi kami melalui kontak pada bagian akhir halaman ini.</p>

              <h2 className="mt-10 font-bold">11. Tautan ke Situs atau Layanan Pihak Ketiga</h2>
              <p>Situs ini dapat memuat tautan ke situs pihak ketiga, seperti:</p>
              <ul>
                <li>Google Maps;</li>
                <li>WhatsApp;</li>
                <li>Instagram;</li>
                <li>YouTube;</li>
                <li>situs pihak lain.</li>
              </ul>
              <p>Kami tidak bertanggung jawab atas isi, kebijakan privasi, atau praktik dari situs pihak ketiga tersebut.</p>

              <h2 className="mt-10 font-bold">12. Perubahan Kebijakan Privasi</h2>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan akan berlaku sejak tanggal pembaruan yang tercantum di halaman ini.
              </p>
              <p>
                Kami menyarankan Anda untuk memeriksa halaman ini secara berkala.
              </p>

              <h2 className="mt-10 font-bold">13. Kontak</h2>
              <p>Jika Anda memiliki pertanyaan, permintaan, atau keluhan terkait Kebijakan Privasi ini atau pemrosesan data pribadi Anda, silakan hubungi:</p>
              
              <ul className="list-none !pl-0">
                <li><span className="font-semibold text-[#0b120c]">Melalui Email:</span> <a href="mailto:contact@granddutacitysouthofjakarta.com">contact@granddutacitysouthofjakarta.com</a></li>
                <li><span className="font-semibold text-[#0b120c]">Melalui WhatsApp:</span> <a href="https://wa.me/628131742034" data-wa-placement="legal-contact-list" target="_blank" rel="noopener noreferrer">0813-1742-034</a></li>
                <li><span className="font-semibold text-[#0b120c]">Berkunjung Langsung:</span> Jl. Boulevard GDC, Kec. Parung, Bogor, Jawa Barat 16330</li>
              </ul>

              <address className="not-italic mt-6 p-6 bg-brand-light rounded-2xl border border-[#0b120c]/10 text-sm">
                <strong>Santika Reza</strong><br />
                Jl. Boulevard GDC,<br />
                Kec. Parung, Bogor,<br />
                Jawa Barat 16330<br /><br />
                Email: <a href="mailto:contact@granddutacitysouthofjakarta.com">contact@granddutacitysouthofjakarta.com</a><br />
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
