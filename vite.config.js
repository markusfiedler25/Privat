import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "single" mode builds one self-contained HTML file for a quick browser preview (no install/offline).
export default defineConfig(({ mode }) => {
  if (mode === 'single') {
    return { base: './', plugins: [react(), viteSingleFile()], build: { outDir: 'dist-single' } };
  }
  return {
    base: './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Swiss Health Quest',
          short_name: 'HealthQuest',
          description: 'Daily 60-minute mission: Swiss healthcare IT, SAP IS-H, Epic and German for work.',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#F2F6F7',
          theme_color: '#0F4C5C',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] }
      })
    ]
  };
});
