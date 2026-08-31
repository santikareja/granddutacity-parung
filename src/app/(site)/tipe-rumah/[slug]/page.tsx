import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bath, BedDouble, CarFront, Layers, Maximize, Ruler } from "lucide-react";

import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Header } from "@/components/ui/header-2";
import {
  CLUSTER_LABEL,
  bedroomLabel,
  getSiblingUnits,
  getUnitById,
  unitDisplayName,
  unitPagePath,
  unitSizeLabel,
  unitSpecSentence,
  units,
  type Unit,
} from "@/data/units";
import {
  SCHEMA_ID,
  breadcrumbNode,
  graph,
  ref,
  residenceNode,
  unitAvailability,
} from "@/lib/schema";
import { OG_SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * HALAMAN TIPE UNIT — Fase 7 spec `seo-cannibalization-and-pseo`.
 *
 * ALASAN UTAMA HALAMAN INI ADA, dan ini penting dicatat jujur:
 * bukan volume pencarian. Riset Semrush menunjukkan keyword tipe unit
 * volumenya kecil (`rumah tipe 42` 260/bln, sisanya 0-30/bln). Yang mendesak
 * adalah CACAT yang lahir di Fase 5: `residenceNode()` menyetel
 * `@id` = `/tipe-rumah/<id>#residence` dan `unitOfferNode()` menyetel
 * `Offer.url` = `/tipe-rumah/<id>`, keduanya sudah tayang di produksi pada
 * /cluster-ladera, /cluster-cascada, dan /pricelist — sementara kesepuluh URL
 * itu MENGEMBALIKAN 404 (diverifikasi 10 dari 10).
 *
 * `Offer.url` yang menunjuk 404 melanggar pedoman structured data Google:
 * URL itu seharusnya tempat penawaran benar-benar bisa dilihat. Halaman ini
 * membuat referensi tersebut resolve.
 *
 * NILAI SEKUNDER yang nyata:
 *   - Niat pencarian dalam. Orang yang mencari "tipe manoa 58" sudah memilih
 *     unit, bukan sedang cari inspirasi. Volume kecil, konversi tinggi.
 *   - Hub-spoke: setiap halaman menaut homepage dengan anchor brand dan
 *     `about` -> `#project`, memperkuat entitas yang diperebutkan homepage.
 *
 * ANTIKANIBALISASI: setiap slug punya `primary` eksklusif di
 * `src/lib/keyword-ownership.ts`, dijaga guard G14-G17. Tidak ada satu pun
 * yang mengklaim frasa brand homepage.
 *
 * BUKAN DOORWAY PAGE: keunikan tiap halaman berasal dari data nyata yang
 * berbeda (spesifikasi, harga, denah, dan tabel banding terhadap tetangga
 * cluster yang berbeda), bukan nama tipe yang ditukar pada template yang sama.
 * Spesifikasi bangunan yang berlaku project-wide SENGAJA hanya DITAUT ke
 * /cluster-*, tidak diduplikasi di 10 halaman.
 */

const SLASH = "\u2014";

/** Slug yang di-prerender. `unit.id` DIPAKAI APA ADANYA karena schema sudah memakainya. */
export function generateStaticParams() {
  return units.map((unit) => ({ slug: unit.id }));
}

type Props = { params: Promise<{ slug: string }> };

/**
 * Unit yang TIDAK diindeks.
 *
 * Frontera 89 berstatus "Segera Hadir": pricelist resminya belum dirilis dan
 * jumlah kamarnya belum dikonfirmasi pemilik. Halaman tanpa harga dan tanpa
 * spesifikasi tidak punya apa pun untuk dimenangkan di pencarian, dan
 * mengindeksnya hanya menambah halaman tipis. Ia tetap dibangun supaya
 * `Offer.url` dan `@id` miliknya resolve, lalu dibuka kembali begitu datanya ada.
 */
const NOINDEX_UNITS = new Set(["frontera-89"]);

const isIndexable = (unit: Unit) => !NOINDEX_UNITS.has(unit.id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const unit = getUnitById(slug);
  if (!unit) return { title: "Tipe Tidak Ditemukan" };

  const name = unitDisplayName(unit);
  const size = unitSizeLabel(unit);
  const pageUrl = `${SITE_URL}${unitPagePath(unit)}`;

  // Title memakai "GDC Parung", BUKAN "Grand Duta City Parung": frasa penuh itu
  // milik homepage (RESERVED_HOMEPAGE_KEYWORDS). Dikunci guard G4/G5/G16.
  //
  // Penanda "Hook" ikut masuk untuk unit hook karena itu karakteristik produk
  // yang nyata (luas tanah jauh di atas tipe lain, dua sisi terbuka) sekaligus
  // istilah yang dipakai pembeli. Guard G17 yang menangkap ketidakcocokan
  // antara klaim keyword dan title-lah yang memaksa ini dibereskan dengan benar.
  const hookBit = unit.isHook ? " Hook" : "";
  const title = `Tipe ${name}${hookBit} ${size} GDC Parung: Harga & Denah`;

  // Description dibangun dari spesifikasi NYATA per unit, jadi otomatis unik
  // antar halaman tanpa perlu menulis 10 variasi manual. Field yang belum
  // dikonfirmasi pemilik tidak ikut muncul.
  //
  // PANJANGNYA HARUS 120-160 karakter (guard G7), dan itu tidak bisa dicapai
  // dengan satu template tetap: unit berspesifikasi lengkap seperti Alexandra
  // menghasilkan 184 karakter, sementara Verona yang datanya belum lengkap hanya
  // 102. Karena itu penutupnya dipilih ADAPTIF — varian terpanjang yang masih
  // masuk batas. Guard G7 yang menangkap masalah ini, bukan tebakan.
  const specBits: string[] = [];
  if (unit.bedrooms !== null) specBits.push(`${bedroomLabel(unit)} KT`);
  if (unit.bathrooms !== null) specBits.push(`${unit.bathrooms} KM`);
  if (unit.carports !== null) specBits.push(`${unit.carports} carport`);
  if (unit.floors !== null) specBits.push(`${unit.floors} lantai`);
  const spec = specBits.length > 0 ? `${specBits.join(", ")}. ` : "";

  const hookBit2 = unit.isHook ? "Kavling hook dua sisi terbuka. " : "";
  const priceBit =
    unit.status === "coming-soon"
      ? "Pricelist resmi segera dirilis. "
      : `Harga mulai Rp ${unit.priceLabel}. `;

  const head = `Tipe ${name} ${size} ${CLUSTER_LABEL[unit.cluster]}, Parung Bogor. `;
  const base = `${head}${spec}${hookBit2}${priceBit}`;

  // Diurut dari terpanjang ke terpendek; yang dipakai adalah yang pertama muat.
  const TAILS = [
    "Lihat denah, spesifikasi, dan simulasi cicilan KPR di halaman ini.",
    "Lihat denah, spesifikasi, dan simulasi KPR-nya.",
    "Lihat denah & simulasi KPR.",
  ];
  const description =
    base + (TAILS.find((tail) => (base + tail).length <= 160) ?? TAILS[TAILS.length - 1]);

  return {
    title,
    description,
    keywords: [
      `tipe ${name.toLowerCase()} ${unit.lb}`,
      `rumah tipe ${unit.lb}`,
      `denah tipe ${name.toLowerCase()}`,
      `harga tipe ${name.toLowerCase()}`,
      `${CLUSTER_LABEL[unit.cluster].toLowerCase()}`,
    ],
    alternates: { canonical: pageUrl },
    robots: isIndexable(unit)
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: OG_SITE_NAME,
      locale: "id_ID",
      type: "website",
      images: [{ url: unit.facadeImage, width: 1200, height: 630, alt: `Fasad tipe ${name} ${size} GDC Parung` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [unit.facadeImage] },
  };
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#0b120c]/10 bg-brand-light p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#F5A524]" aria-hidden="true" />
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0b120c]/50">
          {label}
        </div>
        <div className="mt-1 font-medium text-[#0b120c]">{value}</div>
      </div>
    </div>
  );
}

export default async function TipeRumahDetailPage({ params }: Props) {
  const { slug } = await params;
  const unit = getUnitById(slug);
  if (!unit) notFound();

  const name = unitDisplayName(unit);
  const size = unitSizeLabel(unit);
  const clusterLabel = CLUSTER_LABEL[unit.cluster];
  const clusterPath = `/cluster-${unit.cluster}`;
  const pageUrl = `${SITE_URL}${unitPagePath(unit)}`;
  const siblings = getSiblingUnits(unit);

  const waText = encodeURIComponent(
    `Halo, saya tertarik dengan Tipe ${name} ${size} di ${clusterLabel} Grand Duta City Parung. Boleh minta pricelist dan ketersediaan unitnya?`,
  );

  // Node hunian dipakai ULANG dari builder bersama, jadi @id di halaman ini
  // IDENTIK dengan yang dirujuk /cluster-* dan /pricelist. Inilah yang membuat
  // referensi silang menyatu jadi satu entitas, bukan tiga deskripsi berbeda.
  const pageSchema = graph([
    breadcrumbNode(
      [
        { name: "Tipe Rumah", path: "/tipe-rumah" },
        { name: `Tipe ${name} ${size}`, path: unitPagePath(unit) },
      ],
      pageUrl,
    ),
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: `Tipe ${name} ${size} ${clusterLabel} Grand Duta City Parung`,
      description: unitSpecSentence(unit),
      inLanguage: "id",
      isPartOf: ref(SCHEMA_ID.website),
      about: ref(SCHEMA_ID.project),
      breadcrumb: ref(`${pageUrl}#breadcrumb`),
      primaryImageOfPage: {
        "@type": "ImageObject",
        "@id": `${pageUrl}#primaryimage`,
        url: unit.facadeImage,
        contentUrl: unit.facadeImage,
        caption: `Fasad tipe ${name} ${size} di ${clusterLabel} Grand Duta City Parung`,
      },
      mainEntity: ref(`${pageUrl}#residence`),
    },
    residenceNode(unit),
    {
      "@type": "Offer",
      "@id": `${pageUrl}#offer`,
      name: `Tipe ${name} ${size} ${clusterLabel}`,
      description: unitSpecSentence(unit),
      availability: unitAvailability(unit),
      priceCurrency: "IDR",
      url: pageUrl,
      itemOffered: ref(`${pageUrl}#residence`),
      seller: { "@type": "RealEstateAgent", ...ref(SCHEMA_ID.salesOffice) },
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <Header />

      <main className="relative w-full overflow-hidden bg-brand-light">
        <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-[#0b120c]">
          <Image
            src={unit.facadeImage}
            alt={`Fasad tipe ${name} ${size} GDC Parung`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,12,0.3)_0%,rgba(11,18,12,0.5)_45%,rgba(11,18,12,0.94)_100%)]" />

          <div className="relative z-10 mx-auto w-full max-w-screen-xl px-6 pb-16 pt-28 md:px-14">
            <div className="mb-6">
              <Breadcrumb
                items={[{ label: "Tipe Rumah", href: "/tipe-rumah" }, { label: `Tipe ${name} ${size}` }]}
              />
            </div>

            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#F5A524]">
              {clusterLabel}
            </p>

            {/* H1 menyebut tipe + ukuran, TIDAK frasa brand penuh — itu milik
                homepage. Frasa penuhnya hadir di paragraf bawah sebagai anchor
                internal ke "/". */}
            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-[1.02] text-[#F5F1E8] md:text-6xl">
              Tipe {name} {size}
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-[#F5F1E8]/82 md:text-lg">
              {unit.description} Bagian dari kawasan{" "}
              <Link href="/" className="font-medium text-[#F5A524] hover:underline">
                Grand Duta City Parung
              </Link>{" "}
              di Parung, Bogor.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <a
                href={`https://wa.me/628131742034?text=${waText}`}
                data-wa-placement="tipe-rumah-hero"
                data-wa-unit={`${name} ${size}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c] transition-colors hover:bg-brand-light"
              >
                Tanya ketersediaan unit <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/pricelist-grand-duta-city"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F5F1E8]/25 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#F5F1E8] transition-colors hover:bg-[#F5F1E8]/10"
              >
                Simulasi KPR &amp; pricelist
              </Link>
            </div>
          </div>
        </section>

        {/* Spesifikasi — sumber keunikan utama tiap halaman */}
        <section className="border-b border-[#0b120c]/10 py-16 md:py-20">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <h2 className="mb-2 font-serif text-3xl font-semibold text-[#0b120c] md:text-4xl">
              Spesifikasi Tipe {name}
            </h2>
            <p className="mb-9 max-w-2xl text-[#0b120c]/65">
              Angka di bawah mengikuti pricelist dan denah resmi. Ketersediaan unit per blok
              berubah cepat {SLASH} konfirmasi ke marketing sebelum memutuskan.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SpecItem icon={Maximize} label="Luas bangunan" value={`${unit.lb} m²`} />
              <SpecItem icon={Ruler} label="Luas tanah" value={`${unit.lt} m²`} />
              {unit.bedrooms !== null ? (
                <SpecItem icon={BedDouble} label="Kamar tidur" value={`${bedroomLabel(unit)} kamar`} />
              ) : null}
              {unit.bathrooms !== null ? (
                <SpecItem icon={Bath} label="Kamar mandi" value={`${unit.bathrooms} kamar`} />
              ) : null}
              {unit.carports !== null ? (
                <SpecItem icon={CarFront} label="Carport" value={`${unit.carports} mobil`} />
              ) : null}
              {unit.floors !== null ? (
                <SpecItem icon={Layers} label="Jumlah lantai" value={`${unit.floors} lantai`} />
              ) : null}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#0b120c]/10 bg-white/60 p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0b120c]/50">
                  Harga mulai
                </div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#0b120c]">
                  {unit.status === "coming-soon" ? unit.priceLabel : `Rp ${unit.priceLabel}`}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/62">
                  Mewakili harga tunai keras terendah untuk tipe ini. Harga KPR berbeda dan
                  bervariasi per kavling {SLASH} lihat{" "}
                  <Link href="/pricelist-grand-duta-city" className="font-medium text-[#A85D16] hover:underline">
                    pricelist resmi
                  </Link>
                  .
                </p>
              </div>

              <div className="rounded-2xl border border-[#0b120c]/10 bg-white/60 p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0b120c]/50">
                  Ketersediaan
                </div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#0b120c]">
                  {unit.status === "sold-out"
                    ? "Sold out"
                    : unit.status === "coming-soon"
                      ? "Segera hadir"
                      : "Cek siteplan terbaru"}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#0b120c]/62">
                  {unit.status === "sold-out"
                    ? "Tipe ini sudah terjual habis. Marketing dapat menunjukkan tipe lain dengan ukuran dan harga terdekat."
                    : "Stok berubah cepat dan wajib merujuk siteplan terbaru, bukan angka statis di halaman ini."}{" "}
                  <Link
                    href="/update-stok-siteplan-grand-duta-city-parung"
                    className="font-medium text-[#A85D16] hover:underline"
                  >
                    Lihat update stok &amp; siteplan
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Denah — hanya bila asetnya benar-benar ada */}
        {unit.floorPlanImage ? (
          <section className="border-b border-[#0b120c]/10 py-16 md:py-20">
            <div className="mx-auto max-w-screen-xl px-6 md:px-14">
              <h2 className="mb-6 font-serif text-3xl font-semibold text-[#0b120c] md:text-4xl">
                Denah Tipe {name}
              </h2>
              <div className="relative h-96 overflow-hidden rounded-2xl border border-[#0b120c]/10 bg-white md:h-[620px]">
                <Image
                  src={unit.floorPlanImage}
                  alt={`Denah tipe ${name} ${size} ${clusterLabel} GDC Parung`}
                  fill
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Tabel banding terhadap tetangga cluster — berbeda di setiap halaman */}
        {siblings.length > 0 ? (
          <section className="border-b border-[#0b120c]/10 py-16 md:py-20">
            <div className="mx-auto max-w-screen-xl px-6 md:px-14">
              <h2 className="mb-3 font-serif text-3xl font-semibold text-[#0b120c] md:text-4xl">
                Banding dengan Tipe Lain di {clusterLabel}
              </h2>
              <p className="mb-8 max-w-2xl text-[#0b120c]/65">
                Kalau ukuran atau harga tipe {name} belum pas, tipe di bawah berada di cluster
                yang sama dengan fasilitas dan akses yang identik.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-[#0b120c]/10">
                <table className="w-full min-w-[620px] border-collapse bg-white/60 text-left text-sm">
                  <caption className="sr-only">
                    Perbandingan spesifikasi tipe {name} dengan tipe lain di {clusterLabel}
                  </caption>
                  <thead>
                    <tr className="border-b border-[#0b120c]/10 text-[10px] uppercase tracking-[0.18em] text-[#0b120c]/55">
                      <th scope="col" className="px-5 py-4 font-semibold">Tipe</th>
                      <th scope="col" className="px-5 py-4 font-semibold">LB / LT</th>
                      <th scope="col" className="px-5 py-4 font-semibold">KT / KM</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Lantai</th>
                      <th scope="col" className="px-5 py-4 font-semibold">Harga mulai</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#0b120c]/8 bg-[#F5A524]/10">
                      <th scope="row" className="px-5 py-4 font-semibold text-[#0b120c]">
                        {name} {SLASH} halaman ini
                      </th>
                      <td className="px-5 py-4">{unit.lb} / {unit.lt} m²</td>
                      <td className="px-5 py-4">
                        {unit.bedrooms !== null ? bedroomLabel(unit) : "-"} /{" "}
                        {unit.bathrooms !== null ? unit.bathrooms : "-"}
                      </td>
                      <td className="px-5 py-4">{unit.floors !== null ? unit.floors : "-"}</td>
                      <td className="px-5 py-4">
                        {unit.status === "coming-soon" ? unit.priceLabel : `Rp ${unit.priceLabel}`}
                      </td>
                    </tr>
                    {siblings.map((sibling) => {
                      const sName = unitDisplayName(sibling);
                      return (
                        <tr key={sibling.id} className="border-b border-[#0b120c]/8 last:border-0">
                          <th scope="row" className="px-5 py-4 font-medium">
                            <Link
                              href={unitPagePath(sibling)}
                              className="text-[#A85D16] hover:underline"
                            >
                              {sName} {unitSizeLabel(sibling)}
                            </Link>
                            {sibling.status === "sold-out" ? (
                              <span className="ml-2 text-[10px] uppercase tracking-widest text-[#0b120c]/45">
                                sold out
                              </span>
                            ) : null}
                          </th>
                          <td className="px-5 py-4">{sibling.lb} / {sibling.lt} m²</td>
                          <td className="px-5 py-4">
                            {sibling.bedrooms !== null ? bedroomLabel(sibling) : "-"} /{" "}
                            {sibling.bathrooms !== null ? sibling.bathrooms : "-"}
                          </td>
                          <td className="px-5 py-4">
                            {sibling.floors !== null ? sibling.floors : "-"}
                          </td>
                          <td className="px-5 py-4">
                            {sibling.status === "coming-soon"
                              ? sibling.priceLabel
                              : `Rp ${sibling.priceLabel}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-6 text-sm text-[#0b120c]/62">
                Spesifikasi bangunan yang berlaku untuk seluruh kawasan (pondasi, struktur,
                dinding, sanitair, daya listrik) tidak diulang di sini {SLASH} lihat lengkapnya di{" "}
                <Link href={clusterPath} className="font-medium text-[#A85D16] hover:underline">
                  halaman {clusterLabel}
                </Link>
                . Daftar seluruh tipe ada di{" "}
                <Link href="/tipe-rumah" className="font-medium text-[#A85D16] hover:underline">
                  hub tipe rumah
                </Link>
                .
              </p>
            </div>
          </section>
        ) : null}

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-screen-xl px-6 md:px-14">
            <div className="rounded-3xl bg-[#0b120c] px-8 py-12 text-center md:px-14">
              <h2 className="font-serif text-3xl font-semibold text-[#F5F1E8] md:text-4xl">
                Minat dengan Tipe {name}?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-[#F5F1E8]/72">
                Marketing dapat mengirim pricelist terbaru, denah resolusi tinggi, dan
                simulasi KPR sesuai kemampuan cicilan Anda.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href={`https://wa.me/628131742034?text=${waText}`}
                  data-wa-placement="tipe-rumah-bottom-cta"
                  data-wa-unit={`${name} ${size}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5A524] px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-[#0b120c] transition-colors hover:bg-brand-light"
                >
                  Chat marketing sekarang <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href="/tipe-rumah"
                  className="inline-flex items-center justify-center rounded-full border border-[#F5F1E8]/25 px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-[#F5F1E8] transition-colors hover:bg-[#F5F1E8]/10"
                >
                  Lihat semua tipe
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
