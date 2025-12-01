import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import inject from '@rollup/plugin-inject';

export default defineConfig({
  
  assetsInclude: ['**/*.gltf', '**/*.glb'],  
  plugins: [
      inject({
        $: 'jquery',
        jQuery: 'jquery',        
      }),  

      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
            enabled: true
        },
        includeAssets: ['./images/inav_icon_128.png'],
        manifest: {
          name: 'INAV Configurator',
          short_name: 'INAV Configurator',
          description: 'Configurator for the open source flight controller software INAV.',
          theme_color: '#ffffff',
          icons: [
            { 
              src: './images/inav_icon_128.png',
              sizes: '128x128',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      proxy: {
        '/githubApi' : {
          target: 'https://api.github.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/githubApi/, '')
        }
      },
      port: 8001,
      strictPort: true,
      host: '0.0.0.0'
    },
    preview: {
      port: 8081,
      strictPort: true
    }
});