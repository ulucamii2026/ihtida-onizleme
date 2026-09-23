// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// Önizleme: https://ihtida.ulucamii.be (özel alan adı kökü → base '/').
// İleride gerçek platform: https://ihtida.diyanet.be — yalnız `site` değişir.
export default defineConfig({
  site: 'https://ihtida.ulucamii.be',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [preact({ compat: false })],
  i18n: {
    locales: ['tr', 'fr', 'nl', 'de', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
});
