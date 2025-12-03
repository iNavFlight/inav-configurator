import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import inject from '@rollup/plugin-inject';
import copy from "rollup-plugin-copy";
import pkg from "./package.json";

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_PRODUCTNAME__: JSON.stringify(pkg.productName),
  },
  build: {
    chunkSizeWarningLimit: 5 * 1024 * 1024,
  },
  publicDir: './resources/public',
  assetsInclude: ['**/*.gltf', '**/*.glb'],  
  plugins: [
      inject({
        $: 'jquery',
        jQuery: 'jquery',        
      }),  
      copy({
        targets: [
          { src: "locale/**/*", dest: "dist/locale" },
          { src: "resources/**/*", dest: "dist/resources" },
          { src: "tabs/**/*", dest: "dist/tabs" },
          { src: "images/**/*", dest: "dist/images" },
        ],
        hook: "writeBundle"
      }),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
            enabled: true
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB (for monaco editor)
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: pkg.displayName,
                short_name: pkg.productName,
                description: pkg.description,
          theme_color: '#ffffff',
          icons: [
            { 
              src: './images/pwa/inav_icon_192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            { 
              src: './images/pwa/inav_icon_512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    root: './',
    server: {
      port: 8001,
      strictPort: true,
      host: '0.0.0.0'
    },
    preview: {
      port: 8081,
      strictPort: true
    }
});