import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort  = process.env.PORT;
const basePath = process.env.BASE_PATH ?? "/";
const port     = Number(rawPort ?? "3000");
const isReplitRuntime = process.env.REPL_ID !== undefined;

if (isReplitRuntime && process.env.NODE_ENV !== "production") {
  if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
  if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const replitPlugins =
  process.env.NODE_ENV !== "production" && isReplitRuntime
    ? await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").then(m => m.default()),
        import("@replit/vite-plugin-cartographer").then(m =>
          m.cartographer({ root: path.resolve(import.meta.dirname) }),
        ),
        import("@replit/vite-plugin-dev-banner").then(m => m.devBanner()),
      ])
    : [];

export default defineConfig({
  base: basePath,

  plugins: [react(), tailwindcss(), ...replitPlugins],

  resolve: {
    alias: {
      "@":       path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir:      path.resolve(import.meta.dirname, "dist"),
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
