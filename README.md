# Jago Berhitung 🧮

**Main sekarang: https://rendicahya.github.io/jago-berhitung/**

Aplikasi web (frontend saja, Svelte 5 + Vite) untuk anak belajar berhitung:

- **Penjumlahan bersusun** — isi jawaban digit demi digit dari kanan, ketuk lingkaran di atas kolom untuk menyimpan 1 (atau 2 bila 3 bilangan).
- **Pengurangan bersusun** — ketuk lingkaran di atas angka untuk meminjam 1 darinya; angka yang dipinjam dicoret dan nilai barunya muncul di atas.
- **Perbandingan** — pilih lebih kecil (<), sama dengan (=), atau lebih besar (>).
- **Mengurutkan** — geser (drag & drop, juga bisa disentuh di tablet) kartu bilangan sampai urut.

Setiap mode punya 5 level (mis. dari 2 bilangan 1 digit sampai 3 bilangan 3 digit) dengan 10 soal per sesi. Bintang didapat bila soal benar di percobaan pertama; rekor tersimpan di `localStorage`.

## Pengembangan

```sh
npm install
npm run dev      # server pengembangan
npm run build    # hasil build ke dist/
npm run preview  # coba hasil build
```

## Deploy

Workflow `.github/workflows/deploy.yml` otomatis membangun dan menerbitkan ke GitHub Pages setiap push ke `main`.
Aktifkan sekali di **Settings → Pages → Build and deployment → Source: GitHub Actions**.
