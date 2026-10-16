# Jago Berhitung 🧮

**Main sekarang: https://rendicahya.github.io/jago-berhitung/**

Aplikasi web (frontend saja, Svelte 5 + Vite) untuk anak belajar berhitung dengan tampilan ceria dan ramah HP/tablet.

## Mode permainan

**Berhitung bersusun**
- **Penjumlahan:** isi jawaban digit demi digit dari kanan. Ketuk lingkaran di atas kolom untuk menyimpan 1 (atau 2 bila ada 3 bilangan).
- **Pengurangan:** ketuk lingkaran di atas angka untuk meminjam 1 darinya. Angkanya dicoret dan nilai barunya muncul di atas. Pinjaman berantai dari angka 0 juga didukung.
- **Perkalian:** 1 digit × 1 digit sampai 3 digit × 2 digit, lengkap dengan baris-baris perkalian dan penjumlahannya.
- **Pembagian:** pembagian bersusun pendek (porogapit), dengan sisa kecil ditulis di depan angka berikutnya.

**Mengenal bilangan**
- **Nilai tempat:** menghitung balok ratusan/puluhan/satuan, menyusun balok sesuai bilangan, dan menentukan nilai suatu angka (sampai ribuan).
- **Perbandingan:** pilih lebih kecil (<), sama dengan (=), atau lebih besar (>).
- **Mengurutkan:** geser kartu bilangan (drag & drop, juga dengan sentuhan) sampai urut.

**Tantangan**
- **Bandingkan hasil:** misalnya `3 + 4 ○ 2 + 6` atau `3 × 4 ○ 2 × 6`.
- **Soal cerita:** baca ceritanya (bisa dibacakan), pilih operasi yang tepat, lalu kerjakan secara bersusun.

## Fitur belajar
- 💡 **Petunjuk:** menyorot kolom yang sedang dikerjakan dan menjelaskan langkahnya, misalnya "7 + 5 = 12, tulis 2, simpan 1".
- 👀 **Lihat cara:** setelah 2 kali salah, cara menjawab bisa diputar langkah demi langkah.
- 🔊 **Ketuk untuk mendengar:** bilangan, petunjuk, dan soal cerita dibacakan dalam bahasa Indonesia (Web Speech API).
- ⭐ **Bintang & stiker:** bintang didapat bila soal benar pada percobaan pertama tanpa petunjuk. Setiap 5 bintang membuka 1 dari 40 stiker di album.
- 🔥 **Hari berturut-turut:** menghitung berapa hari berturut-turut anak berlatih.
- 📱 **PWA:** bisa dipasang ke layar utama HP/tablet dan dipakai offline setelah dibuka sekali.

Setiap mode punya 5 level dengan 10 soal per sesi. Progres tersimpan di `localStorage` perangkat.

## Pengembangan

```sh
npm install
npm run dev      # server pengembangan
npm run build    # hasil build ke dist/ (termasuk sw.js untuk offline)
npm run preview  # coba hasil build
```

Struktur singkat:
- `src/lib/generate.js`: pembuat soal untuk semua mode
- `src/lib/board.js`: model papan bersusun beserta langkah penyelesaiannya (dipakai Petunjuk & Lihat cara)
- `src/lib/boardState.svelte.js`: state interaktif papan (isi, cek, petunjuk)
- `src/components/`: tampilan tiap mode

## Deploy

Workflow `.github/workflows/deploy.yml` otomatis membangun dan menerbitkan ke GitHub Pages setiap ada push ke `main`.
