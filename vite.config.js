import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Membuat sw.js saat build berisi daftar semua file hasil build,
 * supaya aplikasi bisa dibuka tanpa internet setelah kunjungan pertama.
 */
function serviceWorker() {
  return {
    name: 'jb-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const files = [
        './',
        ...readdirSync('public').map((f) => `./${f}`),
        ...Object.keys(bundle)
          .filter((f) => !f.endsWith('.map'))
          .map((f) => `./${f}`),
      ];
      const version = createHash('sha1').update(files.join()).digest('hex').slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'jb-${version}';
const RUNTIME = 'jb-runtime';
const PRECACHE = ${JSON.stringify([...new Set(files)])};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // halaman: ambil versi terbaru dulu, kalau offline pakai cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }
  // aset & font: cache dulu
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`,
      });
    },
  };
}

// base relatif supaya bisa jalan di GitHub Pages (https://<user>.github.io/<repo>/)
export default defineConfig({
  plugins: [svelte(), serviceWorker()],
  base: './',
});
