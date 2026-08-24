import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { buildConfig } from "payload";
import { cloudinaryStorage } from "payload-storage-cloudinary";

import { Artikel } from "./collections/Artikel";
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Tags } from "./collections/Tags";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const databaseUrl = process.env.DATABASE_URI || "";
const payloadAdminEmail = process.env.PAYLOAD_ADMIN_EMAIL;
const payloadAdminPassword = process.env.PAYLOAD_ADMIN_PASSWORD;
// Fail-fast: Payload memakai secret ini untuk signing token sesi/reset password.
// Berjalan dengan string kosong sama dengan mematikan keamanan CMS secara diam-diam.
//
// Fase build (next build / NEXT_PHASE=phase-production-build) dikecualikan agar
// laptop/CI tanpa kredensial tetap bisa build (fallback secret dev-only dipakai,
// query DB ditangani try/catch di pemanggil). Saat RUNTIME produksi tanpa secret,
// config ini tetap melempar error — API & admin CMS mati, halaman statis selamat.
const payloadSecret = process.env.PAYLOAD_SECRET;
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (!payloadSecret && process.env.NODE_ENV === "production" && !isBuildPhase) {
  throw new Error(
    "PAYLOAD_SECRET wajib diset di environment production (Vercel > Settings > Environment Variables).",
  );
}
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);
const shouldUseSSL = Boolean(databaseUrl) && !/(localhost|127\.0\.0\.1)/i.test(databaseUrl);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      icons: {
        icon: "/logo.svg",
        shortcut: "/logo.svg",
        apple: "/logo.svg",
      },
      titleSuffix: " - Grand Duta CMS",
    },
    ...(payloadAdminEmail && payloadAdminPassword
      ? {
          autoLogin: {
            email: payloadAdminEmail,
            password: payloadAdminPassword,
            prefillOnly: true,
          },
        }
      : {}),
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      graphics: {
        Icon: "@/payload/admin/components/AdminAuthLogo",
        Logo: "@/payload/admin/components/AdminAuthLogo",
      },
      views: {
        createFirstUser: {
          Component: "@/payload/admin/views/CreateFirstUserView",
        },
        dashboard: {
          Component: "@/payload/admin/views/DashboardView",
        },
        login: {
          Component: "@/payload/admin/views/LoginView",
        },
      },
    },
  },
  collections: [Artikel, Categories, Media, Tags, Users],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      // SSL aktif untuk DB non-lokal. Jika penyedia DB menyediakan CA certificate
      // (mis. Neon/Supabase/RDS), set DATABASE_SSL_CA agar sertifikat tervalidasi
      // (menutup risiko MITM dari rejectUnauthorized: false).
      ...(shouldUseSSL
        ? process.env.DATABASE_SSL_CA
          ? { ssl: { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true } }
          : { ssl: { rejectUnauthorized: false } }
        : {}),
    },
  }),
  secret: payloadSecret || "insecure-dev-only-secret",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "",
  cors: [
    "https://granddutacitysouthofjakarta.com",
    "http://localhost:3000",
  ],
  csrf: [
    "https://granddutacitysouthofjakarta.com",
    "http://localhost:3000",
  ],
  plugins: [
    ...(hasCloudinaryConfig
      ? [
          cloudinaryStorage({
            cloudConfig: {
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
              api_key: process.env.CLOUDINARY_API_KEY || "",
              api_secret: process.env.CLOUDINARY_API_SECRET || "",
            },
            collections: {
              media: {
                folder: "grand-duta-city",
              },
            },
          }),
        ]
      : []),
    seoPlugin({
      uploadsCollection: "media",
      generateTitle: ({ doc }) => `${doc.title} | Grand Duta City Parung`,
      generateDescription: ({ doc }) => doc.excerpt || "",
      generateURL: ({ doc }) => `https://granddutacitysouthofjakarta.com/${doc.slug}`,
    }),
  ],
});
