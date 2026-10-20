# Jago Berhitung 🧮

**Main sekarang: https://rendicahya.github.io/jago-berhitung/**

Aplikasi web (frontend saja, Svelte 5 + Vite) untuk anak belajar berhitung dengan tampilan ceria dan ramah HP/tablet.

## Mode permainan

**Untuk si kecil**
- **Menghitung benda:** menghitung hewan 🐱🐶🐰 sampai 5 dan sampai 10, mengambil hewan sebanyak yang diminta, menghitung satu jenis hewan di antara hewan lain, dan memilih kelompok yang lebih banyak atau lebih sedikit. Setiap hewan bisa diketuk untuk diberi nomor sambil dibacakan, pertanyaan dibacakan otomatis, dan ada bantuan "Hitung bersama".

**Berhitung bersusun**
- **Penjumlahan:** isi jawaban digit demi digit dari kanan. Ketuk lingkaran di atas kolom untuk menyimpan 1 (atau 2 bila ada 3 bilangan).
- **Pengurangan:** ketuk lingkaran di atas angka untuk meminjam 1 darinya. Angkanya dicoret dan nilai barunya muncul di atas. Pinjaman berantai dari angka 0 juga didukung.
- **Perkalian:** 1 digit × 1 digit sampai 3 digit × 2 digit, lengkap dengan baris-baris perkalian dan penjumlahannya.
- **Pembagian:** pembagian bersusun pendek, dengan sisa kecil ditulis di depan angka berikutnya.
- **Pembagian panjang:** porogapit lengkap (bagi, kali, kurangkan, turunkan), sampai 4 digit ÷ 2 digit dan dengan sisa akhir.

Kalau jawabannya benar tapi simpanan, pinjaman, atau sisa kecilnya tidak ditulis, burung hantu memberi teguran lembut dan lingkarannya berkedip. Teguran hanya muncul sekali, dan bintang tetap didapat.

**Mengenal bilangan**
- **Garis bilangan:** katak 🐸 melompat di garis bilangan untuk penjumlahan, pengurangan, perkalian sebagai lompatan sama jauh, dan lompatan puluhan sampai 100.
- **Nilai tempat:** menghitung balok ratusan/puluhan/satuan, menyusun balok sesuai bilangan, dan menentukan nilai suatu angka (sampai ribuan).
- **Perbandingan:** pilih lebih kecil (<), sama dengan (=), atau lebih besar (>).
- **Mengurutkan:** geser kartu bilangan (drag & drop, juga dengan sentuhan) sampai urut.
- **Pola bilangan:** melengkapi pola maju, mundur, lompat 3–9, pola yang lompatannya makin jauh, dan pola dikali 2.
- **Pecahan:** mengenali pecahan pada pizza 🍕, mewarnai potongan sesuai pecahan, dan membandingkan pecahan (termasuk yang senilai, misalnya ½ = 2/4).

**Bangun & ukuran**
- **Bangun datar:** mengenali nama bangun, mencari semua bangun yang sama, menghitung sisi dan titik sudut (bisa diketuk untuk ditandai), dan menebak bangun dari cirinya.
- **Satuan ukur:** mengukur dengan penggaris (termasuk benda yang tidak mulai dari 0), membaca timbangan, mengubah satuan (m–cm, kg–g, km–m), dan membandingkan ukuran dengan satuan berbeda.

**Tantangan**
- **Tabel perkalian:** latihan cepat perkalian 1–10. Fakta yang pernah salah lebih sering muncul, dan ada bantuan "lihat kelompoknya".
- **Bandingkan hasil:** misalnya `3 + 4 ○ 2 + 6` atau `3 × 4 ○ 2 × 6`.
- **Soal cerita:** baca ceritanya (bisa dibacakan), pilih operasi yang tepat, lalu kerjakan secara bersusun.
- **Uang & belanja:** menghitung uang rupiah, membayar dengan uang pas, menghitung total belanja di warung, dan menghitung kembalian.

## Fitur belajar
- 💡 **Petunjuk:** menyorot kolom yang sedang dikerjakan dan menjelaskan langkahnya, misalnya "7 + 5 = 12, tulis 2, simpan 1".
- 👀 **Lihat cara:** setelah 2 kali salah, cara menjawab bisa diputar langkah demi langkah.
- 🔊 **Ketuk untuk mendengar:** bilangan, petunjuk, dan soal cerita dibacakan dalam bahasa Indonesia (Web Speech API).
- ⭐ **Bintang & stiker:** bintang didapat bila soal benar pada percobaan pertama tanpa petunjuk. Setiap 5 bintang membuka 1 dari 40 stiker di album.
- 🔥 **Hari berturut-turut:** menghitung berapa hari berturut-turut anak berlatih.
- 🌙 **Mode gelap:** mengikuti pengaturan perangkat, atau dipilih lewat tombol 🌙/☀️ di pojok atas.
- 📱 **PWA:** bisa dipasang ke layar utama HP/tablet dan dipakai offline setelah dibuka sekali.

Setiap mode punya 5 level dengan 10 soal per sesi. Progres tersimpan di `localStorage` perangkat.

## Rencana pengembangan

Ide yang belum dikerjakan:
- ⏱️ **Tantangan waktu:** menjawab sebanyak mungkin soal dalam 60 detik, dengan rekor pribadi.
- 📈 **Halaman progres:** ringkasan per mode dan level, misalnya bintang, soal yang sering salah, dan grafik latihan per hari.
- 👧 **Profil anak:** beberapa anak di satu perangkat, masing-masing dengan progres, stiker, dan hari berturut-turut sendiri.
- 👨‍👩‍👧 **Mode orang tua:** dibuka dengan soal perkalian sederhana. Isinya laporan belajar, pengaturan level yang boleh dimainkan, dan reset progres.
- 📅 **Latihan harian:** paket 10 soal campuran setiap hari, disesuaikan dengan mode yang masih lemah.
- 🦉 **Tema & maskot:** pilihan tema warna dan maskot pendamping yang bisa dibuka dengan bintang.
- 🕒 **Jam & waktu:** membaca jam analog/digital, mengatur jarum jam, dan menghitung lama waktu.

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
