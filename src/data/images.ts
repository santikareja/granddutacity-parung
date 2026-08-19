/**
 * ============================================================
 * IMAGE REGISTRY — SINGLE SOURCE OF TRUTH
 * ============================================================
 * HOW TO ADD A NEW IMAGE:
 *   1. Upload to Cloudinary
 *   2. Add one entry to the relevant page seed array below
 *   3. Done — sitemap auto-updates on next deploy
 *
 * RULES:
 *   - Every image displayed on the site MUST be registered here
 *   - Use original Cloudinary URL (no transformation params)
 *   - title and caption must be in Bahasa Indonesia
 *   - title must contain target SEO keyword
 * ============================================================
 */

export type SiteImage = {
  url: string;
  title: string;
  caption: string;
  page: string;
  priority?: boolean;
};

type ImageSeed = readonly [url: string, label: string, priority?: boolean];

function toSeoTitle(label: string) {
  return label.includes("Grand Duta City Parung")
    ? label
    : `${label} Grand Duta City Parung`;
}

function createPageImages(
  page: string,
  context: string,
  seeds: readonly ImageSeed[]
): SiteImage[] {
  return seeds.map(([url, label, priority]) => ({
    url,
    title: toSeoTitle(label),
    caption: `${label} di ${context} Grand Duta City Parung South of Jakarta.`,
    page,
    ...(priority ? { priority: true } : {}),
  }));
}

const bankPartnerSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665175/logo_bank_mandiri_qgjt3s.webp",
    "Logo Bank Mandiri rekanan KPR",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665177/logo_bank_bsi_wkyt1u.webp",
    "Logo Bank BSI rekanan KPR",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665175/logo_bank_bri_mflp14.webp",
    "Logo Bank BRI rekanan KPR",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665063/logo_bank_btn_1_pmehp1.webp",
    "Logo Bank BTN rekanan KPR",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775665107/logo_bank_ocbp_nisp_bquiz4.webp",
    "Logo Bank OCBC NISP rekanan KPR",
  ],
];

const homeSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763541/Grand_Duta_City_Parung_South_of_Jakarta_-_Promo_KPR_Rumah_Tanpa_DP_Bogor_qhnsec.webp",
    "Promo KPR rumah tanpa DP",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/video/upload/v1775447530/GDC_Parung_Video_nsvvg6.jpg",
    "Poster video hero mobile",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/video/upload/v1775449335/Grand_Duta_City_Parung_South_of_Jakarta_lsds7k.jpg",
    "Poster video hero desktop",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Harga_Promo_Grand_Duta_City_South_of_Jakarta_pbj2gv.webp",
    "Harga promo Grand Duta City South of Jakarta",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Kawasan_Grand_Duta_City_Parung_vusyk3.webp",
    "Kawasan Grand Duta City Parung",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Lingkungan_Perumahan_Grand_Duta_City_South_of_Jakarta_uyfgbi.webp",
    "Lingkungan perumahan Grand Duta City South of Jakarta",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Fasad_GDC_ptpex3.webp",
    "Fasad rumah Grand Duta City",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/Lingkungan_GDC_Parung_aw7ljq.webp",
    "Lingkungan GDC Parung",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775479369/GDC_Parung_lbfaw3.webp",
    "Fasilitas Grand Duta City",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Tuscan_drllpk.webp",
    "Rumah Tipe Tuscan",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Malta_tkq7di.webp",
    "Rumah Tipe Malta",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    "Rumah Tipe Alexandra",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    "Rumah Tipe Aira Plus",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    "Rumah Tipe Manoa",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp",
    "Rumah Tipe Victoria",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775495564/The_Beach_GDC_Parung_g47puk.webp",
    "The Beach",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775495561/Central_Park_GDC_cfpyrb.webp",
    "Central Park",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775546113/Area_CBD_GDC_Parung_smdlbw.webp",
    "Area CBD",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775546113/Garden_Cafe_h3bnyc.webp",
    "Garden Cafe",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_sdap2y.webp",
    "Main Gate",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Suasana_The_Beach_gftttj.webp",
    "Suasana The Beach",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Ruang_Terbuka_Hijau_ukddtl.webp",
    "Ruang terbuka hijau",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Garden_Cafe_frlfck.webp",
    "Garden Cafe meeting point",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Cluster_Private_Pool_cyvher.webp",
    "Cluster private pool",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Utama_ledb1e.webp",
    "Interior kamar utama",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Boulevard_znvd7b.webp",
    "Boulevard",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Co_Working_Space_uykj46.webp",
    "Co-working space",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/The_Beach_Malam_bfnhas.webp",
    "The Beach malam hari",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Lingkungan_Cluster_iwnukl.webp",
    "Lingkungan cluster",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775663927/Promo_Grand_Duta_City_SOuth_of_Jakarta_Harga_sbgtyx.webp",
    "Promo KPR Grand Duta City",
  ],
  ...bankPartnerSeeds,
];

const pricelistSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp",
    "Gerbang Cluster Ladera untuk hero pricelist",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp",
    "Gerbang Cluster Ladera untuk ringkasan pricelist",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671246/cluster_cascada_gate_ecyykh.webp",
    "Gerbang Cluster Cascada untuk ringkasan pricelist",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    "Tipe Aira untuk tabel harga T-39",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    "Tipe Aira untuk tabel harga T-42",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Malta_tkq7di.webp",
    "Tipe Malta untuk tabel harga T-47",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    "Tipe Manoa untuk tabel harga T-58",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    "Tipe Manoa untuk tabel harga T-62",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp",
    "Tipe Victoria untuk tabel harga T-69",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    "Tipe Alexandra untuk tabel harga T-88",
  ],
  ...bankPartnerSeeds,
];

const articleSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp",
    "Cover artikel update stok siteplan",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp",
    "Cover artikel cara beli rumah dan proses KPR",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763613/Grand-Duta-City-Parung-Map-scaled_mth9ir.webp",
    "Cover artikel lokasi dan akses",
  ],
];

const aboutSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669435/Developer_Grand_Duta_City_South_of_Jakarta_Parung_kbfjms.webp",
    "Developer Duta Putra Land",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669124/Logo_Duta_Putra_Land_rq0kzk.webp",
    "Logo Duta Putra Land",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775669252/Penghargaan_Duta_Putra_Land_zq8mzq.webp",
    "Penghargaan Duta Putra Land",
  ],
];

const gallerySeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Ruang_Terbuka_Hijau_ukddtl.webp",
    "Ruang terbuka hijau",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Kamar_agtj4a.webp",
    "Interior kamar",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Dapur_hv8vfm.webp",
    "Interior dapur",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630459/Interior_Kamar_Anak_p2p4j6.webp",
    "Interior kamar anak",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Utama_ledb1e.webp",
    "Interior kamar utama",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Ruang_Keluarga_2_u3yltc.webp",
    "Interior ruang keluarga",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Ruang_Tengah_d1o1jl.webp",
    "Interior ruang tengah",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Area_Terbuka_xnhqef.webp",
    "Area terbuka",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Co_Working_Space_uykj46.webp",
    "Co-working space",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Gerbang_Cluster_atyzxs.webp",
    "Gerbang cluster",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Cluster_Private_Pool_cyvher.webp",
    "Cluster private pool",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630458/Interior_Kamar_Tamu_omsnqw.webp",
    "Interior kamar tamu",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Interior_Rumah_Type_72_laavtn.webp",
    "Interior rumah tipe 72",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Playground_bwlxwp.webp",
    "Playground",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/The_Beach_Malam_bfnhas.webp",
    "The Beach malam hari",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/FnB_Area_omncw4.webp",
    "Area F&B",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Cluster_Private_Pool_2_rq49ve.webp",
    "Poolside lounge",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_sdap2y.webp",
    "Main Gate",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Roti_Bakar_88_ngajcz.webp",
    "Roti Bakar 88",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_Malam_d75u3t.webp",
    "Main Gate malam hari",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Rumah_Type_42_ibh5qn.webp",
    "Interior rumah tipe 42",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Dapur_Utama_iujkih.webp",
    "Interior dapur utama",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Rumah_Victoria_vi49lm.webp",
    "Interior rumah Victoria",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Boulevard_znvd7b.webp",
    "Boulevard",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Marketing_Galeri_n0hwsx.webp",
    "Marketing Gallery",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Garden_Cafe_frlfck.webp",
    "Garden Cafe",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Kamar_Anak_2_k2eqqk.webp",
    "Interior kamar anak kedua",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Suasana_The_Beach_gftttj.webp",
    "Suasana The Beach",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Interior_Ruang_Keluarga_jolh5c.webp",
    "Area ruang keluarga",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Lingkungan_Cluster_iwnukl.webp",
    "Lingkungan cluster",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Marketing_Galeri_GDC_tfvw3v.webp",
    "Marketing Gallery GDC",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Rumah_Type_60_hciqbx.webp",
    "Interior rumah tipe 60",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Ruang_Tamu_gchkdg.webp",
    "Interior ruang tamu",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/The_Beach_Siang_ykxjoz.webp",
    "The Beach siang hari",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Suasana_Sore_Hari_nbrr6z.webp",
    "Suasana sore hari",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630455/Interior_Taman_Belakang_xpuoew.webp",
    "Taman belakang",
  ],
];

const caraBeliSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/cara-beli-kpr-grand-duta-city-parung_cf7tep.webp",
    "Panduan cara beli rumah dan proses KPR",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775877869/proses-kpr-grand-duta-city-parung_hjjddp.webp",
    "Background proses KPR",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775878358/Promo_KPR_Rumah_Tanpa_DP_GDC_Parung_Bogor_ao1pmv.webp",
    "Promo KPR rumah tanpa DP",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630456/Marketing_Galeri_n0hwsx.webp",
    "Marketing Gallery",
  ],
  ...bankPartnerSeeds,
];

const updateStokSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818474/cluster-cascada-grand-duta-city-south-of-jakarta_vhdxvm.webp",
    "Siteplan kawasan terpadu Grand Duta City",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818729/Ladera_Update_Stok_9_Maret_2026_hn0lxg.webp",
    "Siteplan update stok Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818893/Cascada_Update_Stock_9_Maret_2026-1_vcrnzw.webp",
    "Siteplan update stok Cluster Cascada",
  ],
  ...bankPartnerSeeds,
];

const lokasiSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763613/Grand-Duta-City-Parung-Map-scaled_mth9ir.webp",
    "Peta lokasi Grand Duta City Parung",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763648/PK-SGDC-apr-22_page-0018_bjhro5.webp",
    "Hero akses Grand Duta City Parung",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879213/Akses_Lokasi_Grand_Duta_City_Parung_oa5rrp.webp",
    "Akses lokasi utama Grand Duta City Parung",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879212/Akses_Tol_Grand_Duta_City_South_of_Jakarta_1_ozzhny.webp",
    "Akses tol Grand Duta City pertama",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879212/Akses_Tol_Grand_Duta_City_South_of_Jakarta_2_kmrerc.webp",
    "Akses tol Grand Duta City kedua",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763648/PK-SGDC-apr-22_page-0018_bjhro5.webp",
    "Visual fasilitas sekitar Grand Duta City",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775879213/Akses_Lokasi_Grand_Duta_City_Parung_oa5rrp.webp",
    "Visual boulevard Grand Duta City",
  ],
];

const kontakSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884994/kontak-marketing-grand-duta-city-south-of-jakarta-parung_m4csyj.webp",
    "Kontak marketing Grand Duta City Parung",
    true,
  ],
];

const clusterLaderaSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671249/Cluster_Ladera_Gate_t1vylp.webp",
    "Gerbang Cluster Ladera",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884121/tipe-tuscan-66-gdc-parung-bogor_p6zgu8.webp",
    "Rumah Tipe Tuscan Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775884121/tipe-malta-47-gdc-parung-bogor_fgttjy.webp",
    "Rumah Tipe Malta Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775883012/denah-lantai-tipe-tuscan-cluster-ladera-grand-duta-city-south-of-jakarta_muqubx.webp",
    "Denah Tipe Tuscan Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775883012/denah-lantai-tipe-malta-cluster-ladera-grand-duta-city-south-of-jakarta_ru5oze.webp",
    "Denah Tipe Malta Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775763617/0047-1-1024x576_z9e3f1.webp",
    "Siteplan Cluster Ladera",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775663927/Promo_Grand_Duta_City_SOuth_of_Jakarta_Harga_sbgtyx.webp",
    "Promo KPR Grand Duta City",
  ],
  ...bankPartnerSeeds,
];

const clusterCascadaSeeds: readonly ImageSeed[] = [
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775922661/cluster-cascada-gdc-parung_qgy4jc.webp",
    "Featured Cluster Cascada",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775671246/cluster_cascada_gate_ecyykh.webp",
    "Gerbang Cluster Cascada",
    true,
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917573/Cluster-Cascada-grand-duta-city-parung_bsre5n.jpg",
    "Fasad Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775818893/Cascada_Update_Stock_9_Maret_2026-1_vcrnzw.webp",
    "Siteplan Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917838/cluster-cascada-tipe-alexandra_urmnh4.webp",
    "Denah Alexandra Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917834/cluster-cascada-tipe-victoria_xntjns.webp",
    "Denah Victoria Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917835/cluster-cascada-tipe-manoa_xdmt5m.webp",
    "Denah Manoa Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775917837/cluster-cascada-tipe-aira_q7et6h.webp",
    "Denah Aira Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Alexandra_hhvq3f.webp",
    "Unit Alexandra Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Victoria_scolcc.webp",
    "Unit Victoria Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577152/Type_Manoa_j8uvcr.webp",
    "Unit Manoa Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    "Unit Keila Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775577163/Type_Aira_no2g1u.webp",
    "Unit Aira Plus Cluster Cascada",
  ],
  [
    "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775663927/Promo_Grand_Duta_City_SOuth_of_Jakarta_Harga_sbgtyx.webp",
    "Promo KPR Grand Duta City",
  ],
  ...bankPartnerSeeds,
];

export const siteImages: SiteImage[] = [
  // ── BERANDA (/) ──────────────────────────────────────────────────────────
  ...createPageImages("/", "halaman beranda", homeSeeds),

  // ── PRICELIST (/pricelist-grand-duta-city) ──────────────────────────────
  ...createPageImages(
    "/pricelist-grand-duta-city",
    "halaman pricelist Grand Duta City",
    pricelistSeeds
  ),

  // ── ARTIKEL (/artikel) ──────────────────────────────────────────────────
  ...createPageImages("/artikel", "halaman arsip artikel", articleSeeds),

  // ── CLUSTER LADERA (/cluster-ladera) ────────────────────────────────────
  ...createPageImages(
    "/cluster-ladera",
    "halaman Cluster Ladera",
    clusterLaderaSeeds
  ),

  // ── CLUSTER CASCADA (/cluster-cascada) ──────────────────────────────────
  ...createPageImages(
    "/cluster-cascada",
    "halaman Cluster Cascada",
    clusterCascadaSeeds
  ),

  // ── GALERI (/galeri) ────────────────────────────────────────────────────
  ...createPageImages("/galeri", "halaman galeri resmi", gallerySeeds),

  // ── ABOUT (/about) ──────────────────────────────────────────────────────
  ...createPageImages("/about", "halaman tentang developer", aboutSeeds),

  // ── CARA BELI KPR (/cara-beli-kpr) ──────────────────────────────────────
  ...createPageImages(
    "/cara-beli-kpr",
    "halaman cara beli rumah dan proses KPR",
    caraBeliSeeds
  ),

  // ── UPDATE STOK SITEPLAN (/update-stok-siteplan-grand-duta-city-parung) ─
  ...createPageImages(
    "/update-stok-siteplan-grand-duta-city-parung",
    "halaman update stok dan siteplan",
    updateStokSeeds
  ),

  // ── LOKASI & AKSES (/lokasi-akses-grand-duta-city-parung) ───────────────
  ...createPageImages(
    "/lokasi-akses-grand-duta-city-parung",
    "halaman lokasi dan akses",
    lokasiSeeds
  ),

  // ── KONTAK (/kontak) ────────────────────────────────────────────────────
  ...createPageImages("/kontak", "halaman kontak marketing", kontakSeeds),
];
