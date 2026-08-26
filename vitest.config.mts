import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Konfigurasi Vitest untuk proyek Next.js 16 (App Router) + TypeScript/ESM.
// - `tsconfigPaths()` menyelaraskan alias path "@/..." dari tsconfig.json.
// - Environment default `node` karena target utama pengujian adalah handler
//   API route (server-side). Test komponen klien dapat menimpa environment
//   per-file dengan komentar `// @vitest-environment jsdom`.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
