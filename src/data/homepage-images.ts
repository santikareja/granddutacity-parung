/**
 * Gambar yang dirender carousel Better Living di homepage DAN dicerminkan ke
 * JSON-LD (`WebPage.image`, `Place.image`).
 *
 * KEEMPATNYA ADALAH KANDIDAT PRATINJAU HASIL PENELUSURAN, bukan sekadar dekorasi.
 * Dokumentasi Image SEO Google (diperbarui 2 Maret 2026) menyebut tiga sumber
 * untuk memilih gambar pratinjau: `primaryImageOfPage`, properti `image` pada
 * entitas utama, dan `og:image`. Google juga menyatakan "the presentation of the
 * images also influences whether an image is indexed at all" — jadi gambar yang
 * hanya hidup di metadata, tanpa pernah dirender sebagai `<img>`, adalah
 * kandidat lemah.
 *
 * Karena itu daftar ini punya SATU sumber untuk dua peran sekaligus: setiap URL
 * di sini dijamin benar-benar dirender di halaman (oleh carousel) sekaligus
 * dideklarasikan di structured data. Menambah entri di sini otomatis melakukan
 * keduanya; menambah gambar HANYA ke JSON-LD tidak boleh dilakukan.
 *
 * Syarat sebuah gambar boleh masuk daftar ini:
 *   - 1:1 (1024x1024) — Google melarang "extreme aspect ratio", dan 1:1 adalah
 *     bentuk yang bertahan paling baik saat dipotong ke slot thumbnail SERP
 *     mobile yang persegi.
 *   - TANPA teks promo dan TANPA logo yang di-burn ke gambar. Google eksplisit:
 *     "Avoid using a generic image (for example, your site logo) or an image
 *     with text". Ini sebabnya `og-grand-duta-city-parung.jpg` dan
 *     `perumahan-grand-duta-city-parung.jpg` TIDAK dipakai di sini — keduanya
 *     materi promo bertulisan "DP Rp. 0" plus logo, cocok untuk kartu sosial
 *     (di mana teks memang membantu), tapi justru dihindari Google untuk
 *     thumbnail penelusuran.
 *   - `alt` deskriptif dan spesifik, karena Google memakai alt untuk memahami
 *     subjek gambar.
 */
export const betterLivingImages = [
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Malta_qnowfx.webp",
    alt: "Tampilan Depan Fasad Rumah Modern Tipe Malta Cluster Ladera di Grand Duta City Parung",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800277/Tipe_Aira_ah9nsa.webp",
    alt: "Desain Fasad Rumah Minimalis Estetik Tipe Aira Cluster Cascada di Grand Duta City Parung",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Victoria_-_Tuscan_gj1kcd.webp",
    alt: "Fasad Hunian Eksklusif Tipe Victoria Bergaya Tuscan di Grand Duta City Parung",
  },
  {
    url: "https://res.cloudinary.com/dzhvfbuks/image/upload/v1776800276/Tipe_Alexandra_mtw8xh.webp",
    alt: "Tampilan Fasad Rumah Mewah 2 Lantai Tipe Alexandra di Grand Duta City Parung",
  },
] as const;

/**
 * Dimensi keempat gambar di atas, diverifikasi dengan mengunduh dan membaca
 * header file (3 September 2026): semuanya 1024x1024 WebP, 83–137 KB.
 *
 * Disematkan sebagai konstanta karena `ImageObject.width`/`height` sebaiknya
 * dinyatakan eksplisit: tanpa keduanya, resolusi hanya bisa diketahui Google
 * setelah mengunduh berkasnya, padahal resolusi adalah salah satu kriteria
 * pemilihan ("Use a high resolution, if possible").
 */
export const BETTER_LIVING_IMAGE_SIZE = { width: 1024, height: 1024 } as const;

/**
 * GAMBAR PRATINJAU PILIHAN untuk homepage (`primaryImageOfPage`).
 *
 * Sengaja diambil dari `betterLivingImages`, bukan aset terpisah, supaya
 * gambar yang kita tunjuk sebagai preferred SELALU merupakan gambar yang
 * benar-benar dirender di halaman. Sebelum 3 September 2026 slot ini diisi
 * `/perumahan-grand-duta-city-parung.jpg` yang tidak pernah muncul sebagai
 * `<img>` di halaman mana pun — sehingga sinyal terkuat yang tersisa untuk
 * Google adalah thumbnail YouTube, dan itulah yang tampil di hasil penelusuran.
 *
 * Tipe Malta dipilih di antara keempatnya karena fasadnya paling representatif
 * untuk kawasan (rumah + carport + halaman hijau dalam satu bidang) dan
 * resolusi efektifnya paling tinggi (137 KB, detail paling kaya).
 */
export const HOMEPAGE_PREFERRED_IMAGE = betterLivingImages[0];
