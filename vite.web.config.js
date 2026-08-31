import { defineConfig } from "vite";
import inject from "@rollup/plugin-inject";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

export default defineConfig({
  base: "./",
  publicDir: "./resources/public",
  define: {
    __INAV_WEB_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    inject({
      $: "jquery",
      jQuery: "jquery",
      include: ["**/*.js"],
    }),
    VitePWA({
      registerType: "prompt",
      injectRegister: "script",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      workbox: {
        // Largest real asset is model_flying_wing.gltf at ~9.5MB; stay
        // comfortably above Workbox's 2MB default.
        maximumFileSizeToCacheInBytes: 11 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm,gltf,glb}"],
      },
      manifest: {
        name: pkg.productName,
        short_name: pkg.productName,
        description: pkg.description,
        theme_color: "#ffffff",
        icons: [
          { src: "./inav_icon_192.png", sizes: "192x192", type: "image/png" },
          { src: "./inav_icon_512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.wasm"],
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
    // Keep .wasm/.gltf/.glb as real emitted files rather than inlined
    // base64 — inlining was turning e.g. a 9.5MB model into a 12.7MB JS
    // chunk (33% base64 bloat) and breaking SITL-Webassembly.js's `?url`
    // import, which expects a real cacheable asset.
    assetsInlineLimit: (filePath) => !/\.(wasm|gltf|glb)$/.test(filePath),
    chunkSizeWarningLimit: 10240,
  },
});
