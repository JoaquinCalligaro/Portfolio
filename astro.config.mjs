// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server', // 👈 renderizado del servidor
  adapter: vercel({
    webAnalytics: { enabled: true },
  }), // 👈 adaptador de Vercel con configuración
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
