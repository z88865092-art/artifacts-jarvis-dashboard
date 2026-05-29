import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// ── Environment resolution ────────────────────────────────────────────────────
//
// PORT and BASE_PATH are injected by the Replit artifact runtime in dev/prod.
// When building on external CI (Vercel, GitHub Actions, etc.) these are absent
// and must fall back to safe defaults so the build doesn't crash before Vite
// even initializes.  The dev-server port default of 3000 is never actually
// listened on during a static build — it only matters for `vite dev`.

const rawPort  = process.env.PORT;
const basePath = process.env.BASE_PATH ?? "/";
const port     = Number(rawPort ?? "3000");
const isReplitRuntime = process.env.REPL_ID !== undefined;

// Only enforce PORT strictness when the dev-server will actually need it
// (i.e. when REPL_ID is present and we're NOT doing a production build).
if (isReplitRuntime && process.env.NODE_ENV !== "production") {
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
}

// ── Plugins ───────────────────────────────────────────────────────────────────

const replitPlugins =
  process.env.NODE_ENV !== "production" && isReplitRuntime
    ? await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").then(m => m.default()),
        import("@replit/vite-plugin-cartographer").then(m =>
          m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
        ),
        import("@replit/vite-plugin-dev-banner").then(m => m.devBanner()),
      ])
    : [];

// ── Config ────────────────────────────────────────────────────────────────────

export default defineConfig({
  base: basePath,

  plugins: [react(), tailwindcss(), ...replitPlugins],

  resolve: {
    alias: {
      "@":       path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir:     path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port,
    strictPort:   true,
    host:         "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },

  preview: {
    port,
    host:         "0.0.0.0",
    allowedHosts: true,
  },
});
