import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  experimental: {
    // `optimizeCss: true` dihapus — ia butuh critters/beasties yang TIDAK
    // terpasang di proyek ini, jadi flag itu tidak pernah melakukan apa pun.
    //
    // `inlineCss: true` sudah diuji sebagai penggantinya lalu ditolak: CSS di
    // sini ~27 KB gzip (globals.css memuat token admin + tema editor Lexical +
    // prose artikel), dan Next menduplikasi CSS inline ke RSC payload. Hasil
    // ukur pada halaman depan: HTML gzip 46.7 KB -> 104.7 KB (+58 KB). Di Slow
    // 4G tambahan itu setara dengan round-trip yang dihemat, jadi netral saja
    // sambil mengorbankan cache stylesheet antar-halaman. Prasyarat agar inline
    // menguntungkan adalah memperkecil globals.css lebih dulu.
    optimizePackageImports: [
      "lucide-react",
    ],
  },
  images: {
    deviceSizes: [340, 480, 640, 750, 828, 1080, 1200, 1920],
    qualities: [75, 90, 100],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Panel admin lama /v2-admin -> /admin (Task 12B-2). Ditaruh PALING ATAS
      // agar menang atas aturan trailing-slash di bawahnya. Tanpa ini, bookmark
      // dan tab yang masih terbuka di /v2-admin/* akan 404 (R2: nol URL mati).
      {
        source: "/v2-admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/v2-admin/:path*",
        destination: "/admin/:path*",
        permanent: true,
      },
      {
        source: "/:path+/",
        destination: "/:path+",
        permanent: true,
      },
      {
        source: "/author",
        destination: "/author/santika-reza",
        permanent: true,
      },
      {
        source: "/wp-admin/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-login.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/xmlrpc.php",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-content/uploads/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/tag/investasi",
        destination: "/category/panduan-properti",
        permanent: true,
      },
      {
        source: "/tag/brand",
        destination: "/artikel",
        permanent: true,
      },
      {
        source: "/tag/desain",
        destination: "/artikel",
        permanent: true,
      },
      {
        source: "/tag/perumahan",
        destination: "/artikel",
        permanent: true,
      },
      {
        source: "/rumah-dengan-sistem-keamanan-tinggi",
        destination: "/desain-rumah-dengan-efisiensi-energi-yang-tinggi",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
