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
  assetsInclude: ["**/*.gltf", "**/*.glb"],
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 10240,
  },
});
