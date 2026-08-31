import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Header } from "@/components/ui/header-2";
import {
  CLUSTER_LABEL,
  bedroomLabel,
  getUnitsByCluster,
  unitDisplayName,
  unitPagePath,
  unitSizeLabel,
  units,
  type ClusterKey,
} from "@/data/units";
import { SCHEMA_ID, breadcrumbNode, graph, ref } from "@/lib/schema";
import { OG_SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * HUB TIPE RUMAH — Fase 7 spec `seo-cannibalization-and-pseo`.
 *
 * Fungsinya struktural, bukan sekadar daftar: tanpa hub, kesepuluh halaman tipe
 * hanya bisa dijangkau dari tabel banding antar-tipe dan halaman cluster,
 * sehingga sebagian jadi orphan dan crawl depth-nya dalam. Hub ini membuat
 * setiap halaman tipe berjarak dua klik dari homepage.
 *
 * `primary` = "tipe rumah gdc parung" (lihat keyword-ownership.ts). Sengaja
 * memakai "GDC Parung", bukan frasa brand penuh, supaya tidak berhadapan
 * dengan homepage. Juga TIDAK menargetkan "cluster ladera"/"cluster cascada" —
 * keduanya sudah dimiliki halaman cluster masing-masing.
 */

const PAGE_URL = `${SITE_URL}/tipe-rumah`;
const DASH = "\u2014";

const PAGE_TITLE = "Tipe Rumah GDC Parung: 10 Pilihan, Harga & Denah";
const PAGE_DESCRIPTION =
  "Daftar lengkap 10 tipe rumah di GDC Parung, Bogor: luas bangunan 39-89 m², 1-2 lantai, harga mulai Rp 700 juta-an. Bandingkan spesifikasi dan denah per tipe.";

const HERO_IMAGE =
  "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775922661/cluster-cascada-gdc-parung_qgy4jc.webp";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "tipe rumah gdc parung",
    "pilihan tipe rumah parung",
    "harga tipe rumah gdc",
    "denah tipe rumah gdc parung",
  ],
  alternates: { canonical: PAGE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: OG_SITE_NAME,
    locale: "id_ID",
    type: "website",
    images: [{ url: HERO_IMAGE, width: 1200, height: 630, alt: "Tipe rumah GDC Parung" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [HERO_IMAGE],
  },
};

const pageSchema = graph([
  breadcrumbNode([{ name: "Tipe Rumah", path: "/tipe-rumah" }], PAGE_URL),
  {
    "@type": "CollectionPage",
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: "Tipe Rumah Grand Duta City Parung",
    description: PAGE_DESCRIPTION,
    inLanguage: "id",
    isPartOf: ref(SCHEMA_ID.website),
    about: ref(SCHEMA_ID.project),
    breadcrumb: ref(`${PAGE_URL}#breadcrumb`),
    mainEntity: ref(`${PAGE_URL}#itemlist`),
  },
  {
    "@type": "ItemList",
    "@id": `${PAGE_URL}#itemlist`,
    name: "Daftar tipe rumah Grand Duta City Parung",
    numberOfItems: units.length,
    itemListElement: units.map((unit, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Tipe ${unitDisplayName(unit)} ${unitSizeLabel(unit)}`,
      url: `${SITE_URL}${unitPagePath(unit)}`,
      // Merujuk node hunian yang @id-nya sama dengan yang dipakai halaman
      // tipe, halaman cluster, dan pricelist — satu entitas, bukan empat.
      item: ref(`${SITE_URL}${unitPagePath(unit)}#residence`),
    })),
  },
]);

function ClusterGroup({ cluster }: { cluster: ClusterKey }) {
  const list = getUnitsByCluster(cluster);

  return (
    <section className="border-b border-[#0b120c]/10 py-14 md:py-18">
      <div className="mx-auto max-w-screen-xl px-6 md:px-14">
        <div className="mb-9 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="font-serif text-3xl font-semibold text-[#0b120c] md:text-4xl">
            {CLUSTER_LABEL[cluster]}
          </h2>
          <Link
            href={`/cluster-${cluster}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A85D16] hover:underline"
          >
            Fasilitas &amp; spesifikasi cluster <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((unit) => {
            const name = unitDisplayName(unit);
            const size = unitSizeLabel(unit);
            return (
              <Link
                key={unit.id}
                href={unitPagePath(unit)}
                className="group overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-white/60 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0b120c]/5">
                  <Image
                    src={unit.facadeImage}
                    alt={`Fasad tipe ${name} ${size} GDC Parung`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {unit.status === "sold-out" ? (
                    <span className="absolute left-4 top-4 rounded-full bg-[#0b120c]/85 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#F5F1E8]">
                      Sold out
                    </span>
                  ) : null}
                  {unit.status === "coming-soon" ? (
                    <span className="absolute left-4 top-4 rounded-full bg-[#F5A524] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#0b120c]">
                      Segera hadir
                    </span>
                  ) : null}
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-2xl font-semibold text-[#0b120c]">
                    Tipe {name}
                  </h3>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">
                    LB {unit.lb} m² {DASH} LT {unit.lt} m²
                  </div>

                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#0b120c]/70">
                    {unit.bedrooms !== null ? (
                      <div className="flex gap-1.5">
                        <dt>KT</dt>
                        <dd className="font-medium text-[#0b120c]">{bedroomLabel(unit)}</dd>
                      </div>
                    ) : null}
                    {unit.bathrooms !== null ? (
                      <div className="flex gap-1.5">
                        <dt>KM</dt>
                        <dd className="font-medium text-[#0b120c]">{unit.bathrooms}</dd>
                      </div>
                    ) : null}
                    {unit.floors !== null ? (
                      <div className="flex gap-1.5">
                        <dt>Lantai</dt>
                        <dd className="font-medium text-[#0b120c]">{unit.floors}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-5 border-t border-[#0b120c]/10 pt-4 font-serif text-lg font-semibold text-[#0b120c]">
                    {unit.status === "coming-soon" ? unit.priceLabel : `Rp ${unit.priceLabel}`}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function TipeRumahHubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <Header />

      <main className="relative w-full overflow-hidden bg-brand-light">
        <section className="relative flex min-h-[56vh] items-end overflow-hidden bg-[#0b120c]">
          <Image
            src={HERO_IMAGE}
            alt="Kawasan hunian GDC Parung"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,12,0.3)_0%,rgba(11,18,12,0.55)_45%,rgba(11,18,12,0.94)_100%)]" />

          <div className="relative z-10 mx-auto w-full max-w-screen-xl px-6 pb-14 pt-28 md:px-14">
            <div className="mb-6">
              <Breadcrumb items={[{ label: "Tipe Rumah" }]} />
            </div>
            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-[1.02] text-[#F5F1E8] md:text-6xl">
              Tipe Rumah GDC Parung
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-relaxed text-[#F5F1E8]/82 md:text-lg">
              Sepuluh tipe hunian di dua cluster{" "}
              <Link href="/" className="font-medium text-[#F5A524] hover:underline">
                Grand Duta City Parung
              </Link>
              , dari tipe kompak satu lantai sampai hunian dua lantai dengan kavling terluas.
              Setiap tipe punya halaman berisi spesifikasi, denah, dan perbandingan dengan
              tipe tetangganya.
            </p>
          </div>
        </section>

        <ClusterGroup cluster="ladera" />
        <ClusterGroup cluster="cascada" />

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="rounded-3xl border border-[#0b120c]/10 bg-white/60 px-8 py-12 md:px-14">
              <h2 className="font-serif text-3xl font-semibold text-[#0b120c] md:text-4xl">
                Belum yakin tipe mana yang cocok?
              </h2>
              <p className="mt-5 max-w-2xl text-[#0b120c]/68">
                Harga tunai keras dan skema KPR setiap tipe berbeda per kavling. Lihat{" "}
                <Link
                  href="/pricelist-grand-duta-city"
                  className="font-medium text-[#A85D16] hover:underline"
                >
                  pricelist resmi
                </Link>{" "}
                untuk angka lengkapnya, atau{" "}
                <Link
                  href="/update-stok-siteplan-grand-duta-city-parung"
                  className="font-medium text-[#A85D16] hover:underline"
                >
                  cek update stok &amp; siteplan
                </Link>{" "}
                untuk tahu blok mana yang masih tersedia.
              </p>
              <div className="mt-9">
                <a
                  href="https://wa.me/628131742034?text=Halo%2C%20saya%20ingin%20dibantu%20memilih%20tipe%20rumah%20di%20Grand%20Duta%20City%20Parung%20sesuai%20kebutuhan%20keluarga%20saya."
                  data-wa-placement="tipe-rumah-hub-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c] transition-colors hover:bg-[#0b120c] hover:text-[#F5F1E8]"
                >
                  Konsultasi pilihan tipe <ArrowRight className="h-4 w-4" />
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
