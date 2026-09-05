import { fileURLToPath } from "node:url";
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
    {
      // Popup windows don't need their own SW/manifest, and the injected
      // "./"-relative paths 404 anyway since those files only exist at the
      // build root, not under /tabs/.
      name: "strip-pwa-injection-from-popups",
      // Plugin-level enforce (not just the hook's own `order`) decides
      // which bucket Vite runs it in; VitePWA's html hook is enforce:
      // "post", so this must be too or it runs first regardless of order.
      enforce: "post",
      transformIndexHtml: {
        order: "post",
        handler(html, ctx) {
          if (!/\/tabs\/(receiver_msp|debug_trace)\.html$/.test(ctx.filename)) {
            return html;
          }
          return html
            .replace(/<link rel="manifest"[^>]*>/, "")
            .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/, "");
        },
      },
    },
  ],
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.wasm"],
  // WASM SITL is built with pthread support (SharedArrayBuffer), which the
  // browser only allows in a crossOriginIsolated context - i.e. these two
  // headers must be present on every response, not just the WASM file's.
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
    // Keep .wasm/.gltf/.glb as real emitted files rather than inlined
    // base64 — inlining was turning e.g. a 9.5MB model into a 12.7MB JS
    // chunk (33% base64 bloat) and breaking SITL-Webassembly.js's `?url`
    // import, which expects a real cacheable asset.
    assetsInlineLimit: (filePath) => !/\.(wasm|gltf|glb)$/.test(filePath),
    chunkSizeWarningLimit: 10240,
    rollupOptions: {
      // receiver_msp.html and debug_trace.html are opened via window.open()
      // as standalone popup windows (tabs/receiver.js, tabs/sensors.js), so
      // they need to be built as real entries, not just fetched HTML
      // fragments like the rest of tabs/*.html.
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        receiver_msp: fileURLToPath(
          new URL("./tabs/receiver_msp.html", import.meta.url),
        ),
        debug_trace: fileURLToPath(
          new URL("./tabs/debug_trace.html", import.meta.url),
        ),
      },
    },
  },
});
