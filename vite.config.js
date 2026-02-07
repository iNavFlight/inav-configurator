import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import inject from '@rollup/plugin-inject';
import copy from "rollup-plugin-copy";
import pkg from "./package.json";
import { resolve } from "path";


export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_PRODUCTNAME__: JSON.stringify(pkg.productName),
  },
  build: {
    chunkSizeWarningLimit: 5 * 1024 * 1024,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        receiver_msp: resolve(__dirname, 'tabs/receiver_msp.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'js/web/WASM/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
      plugins: [
        copy({
          targets: [
            { src: 'images/pwa/inav_icon_*.png', dest: 'dist' },
          ],
          hook: "writeBundle",
        })
      ]
    },
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.woff2', '**/*.woff', '**/*.ttf', '**/*.eot', '**/*.svg', '**/*.wasm' ],
  plugins: [
      inject({
        $: 'jquery',
        jQuery: 'jquery',
        exclude: '**/*.css'    
      }),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
            enabled: true
        },
        injectRegister: 'script',
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot,gltf,glb,wasm}'],
          runtimeCaching: [
            {
              urlPattern: /\.wasm$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'wasm-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }  
            },
          ],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: pkg.displayName,
                short_name: pkg.productName,
                description: pkg.description,
          theme_color: '#ffffff',
          icons: [
            { 
              src: './inav_icon_192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            { 
              src: './inav_icon_512.png',
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
      host: '0.0.0.0',
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
    },
    },
    preview: {
      port: 8081,
      strictPort: true,
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
    },
    }
});