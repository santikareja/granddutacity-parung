/**
 * SUMBER TUNGGAL FAQ HOMEPAGE — Fase 3 spec `seo-cannibalization-and-pseo`.
 *
 * Sebelumnya 6 Q&A yang sama ditulis DUA KALI:
 *   - `faqs` di src/components/sections/faq-kpr.tsx  -> yang dilihat pengunjung
 *   - `FAQ_CONTENT` di src/app/(site)/page.tsx       -> yang dibaca Google
 *
 * Duplikasi itu berbahaya, bukan sekadar tidak rapi: begitu salah satu diedit
 * dan yang lain tidak, structured data tidak lagi mencerminkan konten yang
 * terlihat — dan itu pelanggaran pedoman structured data Google, bukan cuma
 * ketidakcocokan kosmetik.
 *
 * Modul ini SENGAJA tanpa "use client" supaya bisa diimpor baik oleh komponen
 * client (accordion FAQ) maupun server component (generator JSON-LD) tanpa
 * menarik salah satunya ke sisi yang salah.
 *
 * Daftar bank di Q2 sudah DIKONFIRMASI PEMILIK: 7 bank (BTN, BCA, BSN,
 * Danamon, OCBC NISP, Mandiri, BRI) — menggantikan klaim lama "8 bank mitra
 * (BCA, Mandiri, BTN, BRI, BNI, dll)" yang bertentangan dengan slider logo.
 * Sumber tunggalnya ada di `src/data/bank-partners.ts`; nama bank di sini
 * ditulis manual karena kalimat FAQ perlu dibaca natural, jadi bila daftar bank
 * berubah, PERBARUI KEDUANYA.
 */

export type HomepageFaq = {
  q: string;
  a: string;
};

export const homepageFaqs: readonly HomepageFaq[] = [
  {
    q: "Berapa harga rumah di Grand Duta City Parung South of Jakarta?",
    a: "Harga rumah di Grand Duta City Parung mulai dari Rp 700 jutaan untuk Cluster Ladera (Tipe Malta 47/72) hingga Rp 1,6 Milyar-an untuk unit premium di Cluster Cascada (Tipe Alexandra 88/105). Cicilan KPR mulai sekitar Rp 4 jutaan per bulan dengan tenor hingga 25 tahun. Hubungi marketing untuk pricelist terbaru dan ketersediaan unit promo.",
  },
  {
    q: "Apa saja syarat dan keuntungan Promo Tanpa DP bulan ini?",
    a: "Program Promo Tanpa DP berlaku untuk pemesanan unit baru di Cluster Ladera dan Cascada bulan berjalan, dengan proses KPR melalui 7 bank mitra: BTN, BCA, BSN, Danamon, OCBC NISP, Mandiri, dan BRI. Cukup siapkan dokumen pribadi (KTP, KK, slip gaji/SPT), dan tim marketing kami akan bantu pre-approval gratis. Konsultasi via WhatsApp untuk simulasi cicilan & bocoran promo aktif.",
  },
  {
    q: "Di mana lokasi Grand Duta City Parung dan bagaimana akses tolnya?",
    a: "Berlokasi di Jl. Raya Parung No.47, Jabon Mekar, Kec. Parung, Kabupaten Bogor — hanya 20 menit ke TB Simatupang & Antasari Jakarta Selatan, dan kurang dari 15 menit ke 4 exit tol utama: Pamulang, Krukut, Sawangan, dan Bojong Gede. Akses ke Tol Desari, Tol Andara, Tol Pamulang, dan Tol BORR membuat hunian ini sangat strategis untuk komuter Jakarta-Depok-Bogor-BSD.",
  },
  {
    q: "Fasilitas eksklusif apa saja di kawasan Grand Duta City SOJ?",
    a: "Penghuni menikmati fasilitas kelas premium: The Beach (kolam tematik), Cluster Private Pool, Central Park, Ruang Terbuka Hijau 80 Ha, Playground, Pusat Kuliner FnB, Garden Cafe, Boulevard utama, Keamanan 24/7 dengan CCTV, One Gate System, serta jaringan kabel bawah tanah untuk estetika kawasan yang rapi modern.",
  },
  {
    q: "Apakah kawasan Grand Duta City Parung aman dari banjir?",
    a: "Ya. Kawasan dirancang dengan polder system terpadu berskala kota mandiri dan elevasi tanah optimal di dataran tinggi Parung Bogor. Drainase induk dan area resapan dirancang untuk menjamin lingkungan bebas banjir bahkan saat curah hujan tinggi.",
  },
  {
    q: "Bagaimana prospek investasi properti di Grand Duta City Parung?",
    a: "Sangat menjanjikan. Kawasan ini dilewati jalur rencana Tol JORR 3 yang akan mendongkrak capital gain signifikan, menjadikannya sunrise property terbaik di koridor selatan Jakarta. Kombinasi 200 Ha kota mandiri, infrastruktur lengkap, dan posisi strategis 20 menit dari CBD Jakarta Selatan menempatkan GDC SOJ sebagai pilihan investasi properti Bogor dengan potensi apresiasi tinggi 5–10 tahun ke depan.",
  },
] as const;
