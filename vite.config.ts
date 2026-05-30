import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT;
// Vercel par deployment ke liye default '/' hona zaroori hai
const basePath =
  process.env.NODE_ENV === "production" ? "/" : (process.env.BASE_PATH ?? "/");
const port = Number(rawPort ?? "3000");
const isReplitRuntime = process.env.REPL_ID !== undefined;

// Replit plugins ko dynamic load karna
const replitPlugins =
  process.env.NODE_ENV !== "production" && isReplitRuntime
    ? await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").then((m) =>
          m.default(),
        ),
        import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({ root: path.resolve(__dirname) }),
        ),
        import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
      ])
    : [];

export default defineConfig({
  base: basePath,

  plugins: [react(), ...replitPlugins],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  root: __dirname,

  build: {
    outDir: path.resolve(__dirname, "dist"),
    assetsDir: "assets", // Assets ke liye sahi folder path
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "framer-motion", "lucide-react"],
        },
      },
    },
  },

  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
});
