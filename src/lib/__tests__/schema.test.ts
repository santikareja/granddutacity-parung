/**
 * Guard invarian structured data — Fase 5 spec `seo-cannibalization-and-pseo`.
 *
 * `scripts/verify-schema.cjs` memeriksa HTML yang sudah dirender, tapi ia butuh
 * server berjalan. Test ini mengunci invarian yang sama pada level builder,
 * sehingga pelanggaran tertangkap di `npm run test` sebelum deploy — dan juga
 * mencakup halaman artikel yang tidak bisa diverifikasi lokal karena butuh DB.
 */

import { describe, expect, it } from "vitest";
import { homepageFaqs } from "@/data/faq-homepage";
import { facilities } from "@/data/facilities";
import { getUnitById, getUnitsByCluster, units } from "@/data/units";
import {
  PROJECT_ALTERNATE_NAMES,
  PROJECT_NAME,
  SCHEMA_ID,
  breadcrumbNode,
  clusterNodes,
  clusterOfferCatalogNode,
  faqNode,
  graph,
  primaryImageNode,
  projectPlaceNode,
  ref,
  residenceNode,
  salesOfficeNode,
  unitAvailability,
  unitOfferNode,
  websiteNode,
} from "@/lib/schema";
import { SITE_URL } from "@/lib/seo";

/** Kumpulkan @id yang mendefinisikan node vs yang hanya merujuk. */
function analyse(node: unknown, defined = new Set<string>(), referenced: string[] = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => analyse(item, defined, referenced));
    return { defined, referenced };
  }
  if (!node || typeof node !== "object") return { defined, referenced };

  const record = node as Record<string, unknown>;
  const keys = Object.keys(record);
  const id = typeof record["@id"] === "string" ? record["@id"] : null;

  if (id) {
    if (record["@type"]) defined.add(id);
    else if (keys.length === 1) referenced.push(id);
  }

  for (const key of keys) {
    if (key === "@id" || key === "@type" || key === "@context") continue;
    analyse(record[key], defined, referenced);
  }

  return { defined, referenced };
}

function collectTypes(node: unknown, out = new Set<string>()) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectTypes(item, out));
    return out;
  }
  if (!node || typeof node !== "object") return out;
  const record = node as Record<string, unknown>;
  if (typeof record["@type"] === "string") out.add(record["@type"]);
  Object.values(record).forEach((value) => collectTypes(value, out));
  return out;
}

const homepageGraph = () =>
  graph([
    websiteNode(),
    projectPlaceNode(),
    ...clusterNodes(),
    salesOfficeNode(),
    primaryImageNode(`${SITE_URL}/x.jpg`, "contoh"),
    {
      "@type": "WebPage",
      "@id": SCHEMA_ID.homepage,
      url: SITE_URL,
      isPartOf: ref(SCHEMA_ID.website),
      about: ref(SCHEMA_ID.project),
      mainEntity: ref(SCHEMA_ID.project),
      primaryImageOfPage: ref(SCHEMA_ID.primaryImage),
    },
    faqNode(),
  ]);

/**
 * `@id` yang berakar di homepage. `SCHEMA_ID.author` DIKECUALIKAN dengan sadar:
 * node `Person` kanonik memang tinggal di /author/santika-reza, jadi `@id`-nya
 * harus mengikuti halaman itu. Yang tetap dijaga untuknya adalah bentuk
 * absolut + fragment.
 */
const HOMEPAGE_ROOTED_IDS = Object.entries(SCHEMA_ID).filter(
  ([name]) => name !== "author",
);

describe("konvensi @id", () => {
  it("semua @id berakar homepage memakai garis miring sebelum pagar", () => {
    // Cacat nyata yang pernah terjadi: `${SITE_URL}#website` (tanpa garis
    // miring) di /artikel dan /category membuat node WebSite KEDUA yang
    // terpisah dari milik homepage. Asersi ini mencegahnya terulang.
    for (const [name, id] of HOMEPAGE_ROOTED_IDS) {
      expect(id, `SCHEMA_ID.${name}`).toMatch(/^https:\/\/[^/]+\/#[a-z-]+$/);
    }
  });

  it("setiap @id absolut dan punya fragment entitas", () => {
    // Cacat nyata: /lokasi-akses-* memberi `RealEstateAgent` sebuah `@id` yang
    // PERSIS URL halaman, tanpa fragment. Akibatnya halaman itu sendiri dibaca
    // sebagai entitas bisnis, terpisah dari #salesoffice.
    for (const [name, id] of Object.entries(SCHEMA_ID)) {
      expect(id, `SCHEMA_ID.${name}`).toMatch(
        /^https:\/\/[^/]+\/[^#]*#[a-z-]+$/,
      );
    }
  });

  it("tidak ada dua @id yang hanya berbeda garis miring", () => {
    const ids = Object.values(SCHEMA_ID);
    const normalized = ids.map((id) => id.replace("/#", "#"));
    expect(new Set(normalized).size).toBe(ids.length);
  });
});

describe("entitas utama", () => {
  it("bertipe Place, bukan Product", () => {
    // `Product` untuk rumah tapak membawa ekspektasi merchant listing yang
    // tidak berlaku, dan itulah sumber ketidakcocokan harga sebelum Fase 5.
    const place = projectPlaceNode() as Record<string, unknown>;
    expect(place["@type"]).toBe("Place");
  });

  it("alternateName memuat KEDUA kata kunci target pemilik", () => {
    // Inilah mekanisme yang memberi tahu Google bahwa kedua frasa menunjuk
    // entitas yang sama, dan homepage adalah halamannya.
    const lower = PROJECT_ALTERNATE_NAMES.map((name) => name.toLowerCase());
    expect(lower).toContain("grand duta city parung");
    expect(lower).toContain("grand duta city south of jakarta");
  });

  it("nama entitas menggabungkan kedua frasa", () => {
    expect(PROJECT_NAME).toBe("Grand Duta City Parung South of Jakarta");
  });

  it("amenityFeature diturunkan dari sumber fasilitas yang sama dengan tampilan", () => {
    const place = projectPlaceNode() as { amenityFeature: { name: string }[] };
    expect(place.amenityFeature).toHaveLength(facilities.length);
    expect(place.amenityFeature.map((item) => item.name)).toEqual(
      facilities.map((facility) => facility.title),
    );
  });
});

describe("graf homepage", () => {
  it("setiap referensi @id menunjuk node yang didefinisikan di graf yang sama", () => {
    const { defined, referenced } = analyse(homepageGraph());
    // `#organization` sengaja didefinisikan di layout (global di semua halaman),
    // jadi ia referensi lintas-dokumen yang sah.
    const dangling = referenced.filter(
      (id) => !defined.has(id) && id !== SCHEMA_ID.organization,
    );
    expect(dangling).toEqual([]);
  });

  it("tidak memuat tipe yang sudah dipensiunkan Google atau tidak eligible", () => {
    const types = collectTypes(homepageGraph());
    for (const forbidden of [
      "Product",
      "SearchAction",
      "SiteNavigationElement",
      "OfferShippingDetails",
      "MerchantReturnPolicy",
      "CollectionPage",
    ]) {
      expect([...types], `tipe ${forbidden} masih ada`).not.toContain(forbidden);
    }
  });

  it("graph() membuang node null sehingga VideoObject tanpa uploadDate tidak ikut", () => {
    // `uploadDate` wajib untuk video rich result. Menebak tanggal berarti
    // mengarang data, jadi node video harus absen sampai tanggalnya diisi.
    const result = graph([{ "@type": "WebPage" }, null, undefined, false]);
    expect(result["@graph"]).toHaveLength(1);
  });
});

describe("FAQPage", () => {
  it("memakai sumber yang sama dengan FAQ yang dilihat pengunjung", () => {
    // Schema yang tidak cocok dengan konten terlihat adalah pelanggaran
    // pedoman, bukan sekadar ketidakrapian.
    const node = faqNode() as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(node.mainEntity).toHaveLength(homepageFaqs.length);
    node.mainEntity.forEach((question, index) => {
      expect(question.name).toBe(homepageFaqs[index].q);
      expect(question.acceptedAnswer.text).toBe(homepageFaqs[index].a);
    });
  });
});

describe("breadcrumbNode", () => {
  const pageUrl = `${SITE_URL}/contoh-artikel`;

  it("selalu diawali Beranda pada posisi 1", () => {
    const node = breadcrumbNode([{ name: "Artikel", path: "/artikel" }], pageUrl);
    const items = node.itemListElement;
    expect(items[0]).toMatchObject({ position: 1, name: "Beranda", item: SITE_URL });
  });

  it("posisi berurutan dan URL absolut", () => {
    const node = breadcrumbNode(
      [
        { name: "Artikel", path: "/artikel" },
        { name: "Judul", path: "/contoh-artikel" },
      ],
      pageUrl,
    );
    expect(node.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(node.itemListElement[2].item).toBe(`${SITE_URL}/contoh-artikel`);
  });

  it("@id terikat ke URL halaman agar tidak bentrok antar halaman", () => {
    const node = breadcrumbNode([{ name: "Galeri", path: "/galeri" }], `${SITE_URL}/galeri`);
    expect(node["@id"]).toBe(`${SITE_URL}/galeri#breadcrumb`);
  });
});

describe("node unit rumah", () => {
  it("tidak pernah mengaku InStock untuk unit berstatus check-siteplan", () => {
    // Pemilik menegaskan stok aktual WAJIB merujuk siteplan terbaru dan
    // mayoritas jalur utama Cascada sudah SOLD. Menyatakan InStock di
    // structured data adalah klaim yang tidak bisa dipertanggungjawabkan.
    for (const unit of units) {
      const availability = unitAvailability(unit);
      if (unit.status === "check-siteplan") {
        expect(availability, unit.id).toBe(
          "https://schema.org/LimitedAvailability",
        );
      }
      expect(availability, unit.id).not.toBe("https://schema.org/InStock");
    }
  });

  it("memetakan sold-out dan coming-soon ke ketersediaan yang benar", () => {
    expect(unitAvailability(getUnitById("keila-47")!)).toBe(
      "https://schema.org/SoldOut",
    );
    expect(unitAvailability(getUnitById("frontera-89")!)).toBe(
      "https://schema.org/PreOrder",
    );
  });

  it("tidak mengemit jumlah kamar yang belum dikonfirmasi pemilik", () => {
    // Verona 39, Frontera 89, dan T-62 sengaja `null` di units.ts. Structured
    // data dibaca mesin sebagai fakta, jadi angka tebakan = spesifikasi palsu.
    for (const id of ["verona-39", "frontera-89", "t-62"]) {
      const node = JSON.parse(JSON.stringify(residenceNode(getUnitById(id)!)));
      expect(node, id).not.toHaveProperty("numberOfRooms");
      expect(node, id).not.toHaveProperty("numberOfBedrooms");
      expect(node, id).not.toHaveProperty("numberOfBathroomsTotal");
    }
  });

  it("memakai data Manoa T-58 yang sudah dikoreksi pemilik (2 KT, 2 KM)", () => {
    // Regresi nyata: tipe-rumah.tsx dan schema homepage sempat menulis
    // "1 kamar tidur" untuk Manoa, bertentangan dengan denah resmi.
    const node = residenceNode(getUnitById("manoa-58")!);
    expect(node.numberOfBedrooms).toBe(2);
    expect(node.numberOfBathroomsTotal).toBe(2);
  });

  it("tidak mengemit harga numerik pada Offer unit", () => {
    // Harga di pricelist resmi adalah rentang per kavling (tunai keras vs KPR
    // berbeda jauh). Satu angka tunggal pasti salah untuk sebagian kavling,
    // dan itulah yang sempat terjadi di /cluster-ladera (Malta diberi
    // "900000000" padahal tunai keras terendahnya Rp 845.550.000).
    for (const unit of units) {
      const offer = JSON.parse(JSON.stringify(unitOfferNode(unit)));
      expect(offer, unit.id).not.toHaveProperty("price");
      expect(offer, unit.id).not.toHaveProperty("priceSpecification");
    }
  });

  it("mengikat setiap unit ke cluster lewat @id, bukan salinan Place", () => {
    for (const unit of units) {
      const expected =
        unit.cluster === "ladera"
          ? SCHEMA_ID.clusterLadera
          : SCHEMA_ID.clusterCascada;
      expect(residenceNode(unit).containedInPlace, unit.id).toEqual(
        ref(expected),
      );
    }
  });

  it("katalog cluster memuat seluruh unit cluster tersebut dan hanya itu", () => {
    for (const cluster of ["ladera", "cascada"] as const) {
      const pageUrl = `${SITE_URL}/cluster-${cluster}`;
      const catalog = clusterOfferCatalogNode(cluster, pageUrl);
      expect(catalog["@id"]).toBe(`${pageUrl}#offercatalog`);
      expect(catalog.itemListElement).toHaveLength(
        getUnitsByCluster(cluster).length,
      );
    }
  });

  it("katalog cluster tidak melahirkan referensi menggantung", () => {
    const { referenced } = analyse(
      clusterOfferCatalogNode("ladera", `${SITE_URL}/cluster-ladera`),
    );
    // Semua referensi harus menunjuk node yang didefinisikan homepage.
    const homepageIds = new Set<string>(Object.values(SCHEMA_ID));
    for (const id of referenced) {
      expect(homepageIds.has(id), id).toBe(true);
    }
  });
});

describe("VideoObject homepage", () => {
  it("uploadDate cocok dengan yang diterbitkan YouTube, bukan tanggal karangan", async () => {
    // `uploadDate` WAJIB untuk video rich result, dan menebaknya berarti
    // mengarang data yang dibaca Google. Nilai di kode diambil dari structured
    // data halaman tontonan YouTube sendiri. Asersi ini mengunci nilai itu
    // supaya tidak ada yang "merapikan" jadi tanggal bulat yang salah.
    const { default: fs } = await import("node:fs");
    const source = fs.readFileSync("src/app/(site)/page.tsx", "utf8");

    const uploadDate = source.match(
      /TOUR_VIDEO_UPLOAD_DATE\s*=\s*"([^"]+)"/,
    )?.[1];
    expect(uploadDate, "TOUR_VIDEO_UPLOAD_DATE harus terisi").toBe(
      "2026-07-20T19:28:37-07:00",
    );

    const duration = source.match(/TOUR_VIDEO_DURATION\s*=\s*"([^"]+)"/)?.[1];
    expect(duration).toBe("PT3M41S");

    // ISO 8601 lengkap dengan offset, bukan sekadar "2026-07-20".
    expect(uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    expect(Number.isNaN(Date.parse(uploadDate!))).toBe(false);
  });
});
