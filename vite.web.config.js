import { defineConfig } from "vite";
import inject from "@rollup/plugin-inject";
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
  ],
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.wasm"],
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
    // .wasm stays a real emitted file: inlining it as base64 breaks the
    // point of SITL-Webassembly.js's `?url` import (a real cacheable asset,
    // not ~2MB of base64 duplicated into every chunk that references it).
    assetsInlineLimit: (filePath) => !filePath.endsWith(".wasm"),
    chunkSizeWarningLimit: 10240,
  },
});
