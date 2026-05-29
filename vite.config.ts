import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// Node.js environment ke liye path setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT;
const basePath = process.env.BASE_PATH ?? "/";
const port = Number(rawPort ?? "3000");
const isReplitRuntime = process.env.REPL_ID !== undefined;

if (isReplitRuntime && process.env.NODE_ENV !== "production") {
  if (!rawPort) throw new Error("PORT environment variable is required.");
  if (Number.isNaN(port) || port <= 0)
    throw new Error(`Invalid PORT value: "${rawPort}"`);
}

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

  plugins: [react(), tailwindcss(), ...replitPlugins],

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
    emptyOutDir: true,
  },

  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },

  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
