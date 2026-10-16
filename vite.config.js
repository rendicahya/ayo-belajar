import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base relatif supaya bisa jalan di GitHub Pages (https://<user>.github.io/<repo>/)
export default defineConfig({
  plugins: [svelte()],
  base: './',
});
