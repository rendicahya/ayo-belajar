// Huruf hijaiyah, harakat, serta doa & surat pendek untuk tab Mengaji.
// Nama huruf memakai ejaan yang biasa diajarkan di TPQ (Alif, Ba, Ta, Tsa, …),
// dibacakan dengan suara bahasa Indonesia. Lafal Arab tetap dicontohkan guru/orang tua.

import { rand, pick, shuffle } from './generate.js';

// `lat` = bunyi huruf dalam latin (dipakai untuk bacaan berharakat), `dots` = ciri titiknya
export const HIJAIYAH = [
  { id: 'alif', ch: 'ا', name: 'Alif', lat: '', dots: 'tanpa titik' },
  { id: 'ba', ch: 'ب', name: 'Ba', lat: 'b', dots: 'satu titik di bawah' },
  { id: 'ta', ch: 'ت', name: 'Ta', lat: 't', dots: 'dua titik di atas' },
  { id: 'tsa', ch: 'ث', name: 'Tsa', lat: 'ts', dots: 'tiga titik di atas' },
  { id: 'jim', ch: 'ج', name: 'Jim', lat: 'j', dots: 'satu titik di tengah' },
  { id: 'ha', ch: 'ح', name: 'Ha', lat: 'h', dots: 'tanpa titik' },
  { id: 'kho', ch: 'خ', name: 'Kho', lat: 'kh', dots: 'satu titik di atas' },
  { id: 'dal', ch: 'د', name: 'Dal', lat: 'd', dots: 'tanpa titik' },
  { id: 'dzal', ch: 'ذ', name: 'Dzal', lat: 'dz', dots: 'satu titik di atas' },
  { id: 'ro', ch: 'ر', name: 'Ro', lat: 'r', dots: 'tanpa titik' },
  { id: 'zai', ch: 'ز', name: 'Zai', lat: 'z', dots: 'satu titik di atas' },
  { id: 'sin', ch: 'س', name: 'Sin', lat: 's', dots: 'tanpa titik' },
  { id: 'syin', ch: 'ش', name: 'Syin', lat: 'sy', dots: 'tiga titik di atas' },
  { id: 'shod', ch: 'ص', name: 'Shod', lat: 'sh', dots: 'tanpa titik' },
  { id: 'dhod', ch: 'ض', name: 'Dhod', lat: 'dh', dots: 'satu titik di atas' },
  { id: 'tho', ch: 'ط', name: 'Tho', lat: 'th', dots: 'tanpa titik' },
  { id: 'zho', ch: 'ظ', name: 'Zho', lat: 'zh', dots: 'satu titik di atas' },
  { id: 'ain', ch: 'ع', name: "'Ain", lat: "'", dots: 'tanpa titik' },
  { id: 'ghoin', ch: 'غ', name: 'Ghoin', lat: 'gh', dots: 'satu titik di atas' },
  { id: 'fa', ch: 'ف', name: 'Fa', lat: 'f', dots: 'satu titik di atas' },
  { id: 'qof', ch: 'ق', name: 'Qof', lat: 'q', dots: 'dua titik di atas' },
  { id: 'kaf', ch: 'ك', name: 'Kaf', lat: 'k', dots: 'tanpa titik' },
  { id: 'lam', ch: 'ل', name: 'Lam', lat: 'l', dots: 'tanpa titik' },
  { id: 'mim', ch: 'م', name: 'Mim', lat: 'm', dots: 'tanpa titik' },
  { id: 'nun', ch: 'ن', name: 'Nun', lat: 'n', dots: 'satu titik di atas' },
  { id: 'wau', ch: 'و', name: 'Wau', lat: 'w', dots: 'tanpa titik' },
  { id: 'hha', ch: 'ه', name: "Ha'", lat: 'h', dots: 'tanpa titik' },
  { id: 'ya', ch: 'ي', name: 'Ya', lat: 'y', dots: 'dua titik di bawah' },
];
const byId = Object.fromEntries(HIJAIYAH.map((h) => [h.id, h]));

/** Nama untuk dibacakan suara Indonesia: "'Ain" → "ain". */
export const spokenName = (h) => h.name.replace(/'/g, '');

// huruf yang bentuknya mirip, hanya beda titik
const SIMILAR = [
  ['ba', 'ta', 'tsa', 'nun'],
  ['jim', 'ha', 'kho'],
  ['dal', 'dzal'],
  ['ro', 'zai'],
  ['sin', 'syin'],
  ['shod', 'dhod'],
  ['tho', 'zho'],
  ['ain', 'ghoin'],
  ['fa', 'qof'],
];

// ح dan ه sama-sama dibaca "ha" dengan suara Indonesia, jadi tidak boleh muncul bersamaan
const clash = (a, b) => a.lat !== '' && a.lat === b.lat;

function distinctPicks(pool, answer, n) {
  const out = [answer];
  for (const h of shuffle(pool)) {
    if (out.length >= n) break;
    if (out.every((o) => o !== h && !clash(o, h) && o.name.replace("'", '') !== h.name.replace("'", ''))) out.push(h);
  }
  return shuffle(out);
}

export function genHijaiyah({ type, from = 0, to = 28, n = 4 }) {
  if (type === 'similar') {
    const group = pick(SIMILAR).map((id) => byId[id]);
    const answer = pick(group);
    return { type, answer, choices: shuffle(group) };
  }
  const pool = HIJAIYAH.slice(from, to);
  const answer = pick(pool);
  return { type, answer, choices: distinctPicks(pool, answer, n) };
}

// ---------- Harakat ----------

export const MARKS = {
  a: 'َ', // fathah
  i: 'ِ', // kasrah
  u: 'ُ', // dhammah
  an: 'ً', // fathatain
  in: 'ٍ', // kasratain
  un: 'ٌ', // dhammatain
};
export const MARK_NAMES = { a: 'fathah', i: 'kasrah', u: 'dhammah', an: 'fathatain', in: 'kasratain', un: 'dhammatain' };

const syl = (h, v) => ({ ar: h.ch + MARKS[v], lat: h.lat + v });
const noAlif = HIJAIYAH.filter((h) => h.id !== 'alif');

export function genHarakat({ type }) {
  if (type === 'fathah') {
    const answer = pick(HIJAIYAH);
    const choices = distinctPicks(HIJAIYAH, answer, 3).map((h) => syl(h, 'a').lat);
    return { type, ar: syl(answer, 'a').ar, answer: syl(answer, 'a').lat, choices, vowels: ['a'] };
  }
  if (type === 'vowels' || type === 'tanwin') {
    const vs = type === 'tanwin' ? ['an', 'in', 'un'] : ['a', 'i', 'u'];
    const h = pick(type === 'tanwin' ? noAlif : HIJAIYAH);
    const v = pick(vs);
    return { type, ar: syl(h, v).ar, answer: syl(h, v).lat, choices: vs.map((x) => syl(h, x).lat), vowels: vs };
  }
  if (type === 'mixed') {
    const [h, other] = distinctPicks(HIJAIYAH, pick(HIJAIYAH), 2);
    const vs = shuffle(['a', 'i', 'u']);
    const answer = syl(h, vs[0]).lat;
    const choices = shuffle([answer, syl(h, vs[1]).lat, syl(other, vs[0]).lat, syl(other, vs[2]).lat]);
    return { type, ar: syl(h, vs[0]).ar, answer, choices, vowels: ['a', 'i', 'u'] };
  }
  // sambung 2–3 huruf berharakat, seperti latihan Iqro jilid 2–3
  const len = rand(2, 3);
  const letters = Array.from({ length: len }, () => pick(noAlif));
  const vs = letters.map(() => pick(['a', 'i', 'u']));
  const read = (vv) => letters.map((h, i) => h.lat + vv[i]).join('');
  const answer = read(vs);
  const choices = new Set([answer]);
  for (let guard = 0; choices.size < 4 && guard < 50; guard++) {
    const k = rand(0, len - 1);
    const alt = [...vs];
    alt[k] = pick(['a', 'i', 'u'].filter((v) => v !== vs[k]));
    if (guard > 10) alt[(k + 1) % len] = pick(['a', 'i', 'u'].filter((v) => v !== vs[(k + 1) % len]));
    choices.add(read(alt));
  }
  return { type, ar: letters.map((h, i) => h.ch + MARKS[vs[i]]).join(''), answer, choices: shuffle([...choices]), vowels: ['a', 'i', 'u'] };
}

// ---------- Menulis hijaiyah ----------
// Satu path SVG per goresan dalam kotak 200 × 200, garis dasar y = 135.
// Badan huruf ditulis dulu dari kanan ke kiri, titik ditulis terakhir.

const D = (x, y) => `M${x} ${y} L${x} ${y + 6}`;
const baBody = 'M165 92 C168 122 156 135 126 135 L74 135 C44 135 32 122 35 92';
const jimBody = 'M55 70 C80 55 115 55 140 68 C95 80 58 100 58 132 C58 168 100 182 155 168';
const dalBody = 'M85 62 C105 78 122 102 122 124 C122 133 112 135 70 135';
const roBody = 'M125 92 C130 125 118 152 70 172';
const sinBody = 'M172 95 C172 125 162 135 152 135 C140 135 136 122 136 105 C136 125 128 135 116 135 C104 135 100 122 100 105 C100 145 88 168 62 168 C38 168 28 148 30 128';
const shodBody = 'M108 135 C118 100 176 94 176 118 C176 135 150 135 108 135 C104 150 92 168 64 168 C40 168 28 148 30 128';
const thoBody = ['M58 135 C88 122 118 95 148 98 C172 100 172 135 148 135 L58 135', 'M82 40 L82 130'];
const ainBody = 'M140 72 C122 56 96 68 100 88 C104 104 128 106 142 100 C100 112 70 132 74 156 C78 176 120 182 155 170';

const STROKES = {
  alif: ['M100 25 L100 135'],
  ba: [baBody, D(100, 158)],
  ta: [baBody, D(88, 90), D(112, 90)],
  tsa: [baBody, D(100, 68), D(86, 90), D(114, 90)],
  jim: [jimBody, D(100, 126)],
  ha: [jimBody],
  kho: [jimBody, D(95, 36)],
  dal: [dalBody],
  dzal: [dalBody, D(90, 36)],
  ro: [roBody],
  zai: [roBody, D(125, 60)],
  sin: [sinBody],
  syin: [sinBody, D(136, 50), D(118, 70), D(154, 70)],
  shod: [shodBody],
  dhod: [shodBody, D(146, 76)],
  tho: thoBody,
  zho: [...thoBody, D(112, 76)],
  ain: [ainBody],
  ghoin: [ainBody, D(120, 38)],
  fa: ['M122 112 C102 112 100 82 124 82 C146 82 148 110 142 125 C136 135 120 135 52 135 C40 135 34 126 34 112', D(124, 56)],
  qof: ['M130 104 C110 104 108 74 132 74 C154 74 154 104 150 124 C142 162 104 178 76 168 C56 160 50 144 54 128', D(120, 46), D(144, 46)],
  kaf: ['M152 38 L152 118 C152 135 140 135 62 135 C46 135 40 126 40 110', 'M96 86 L112 94 L94 104 L112 112'],
  lam: ['M140 28 L140 120 C140 160 112 172 86 168 C60 164 52 146 55 126'],
  mim: ['M112 128 C112 104 148 100 150 118 C152 135 130 137 112 130 L112 186'],
  nun: ['M152 102 C152 154 124 170 100 170 C76 170 48 156 48 102', D(100, 76)],
  wau: ['M124 120 C102 120 100 90 122 90 C144 90 146 116 140 132 C130 162 104 176 72 176'],
  hha: ['M100 64 C70 64 58 100 68 120 C78 138 124 138 134 120 C144 100 130 64 100 64'],
  ya: ['M150 88 C122 86 116 110 140 116 C162 121 164 136 132 142 C92 148 60 142 50 122 C45 108 53 98 64 96', D(88, 164), D(112, 164)],
};

export const HIJAIYAH_TRACE = Object.fromEntries(
  HIJAIYAH.map((h) => [h.id, { name: `huruf ${h.name}`, spoken: `huruf ${spokenName(h)}`, glyph: h.ch, s: STROKES[h.id] }]),
);
export const hijaiyahIds = (from, to) => HIJAIYAH.slice(from, to).map((h) => h.id);

// ---------- Doa & surat pendek ----------
// Teks Arab mengikuti penulisan mushaf standar Indonesia; latin memakai ejaan populer.

export const DOA = [
  {
    id: 'basmalah',
    set: 'short',
    title: 'Basmalah',
    meaning: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.',
    parts: [
      { ar: 'بِسْمِ اللّٰهِ', lat: 'Bismillāhi' },
      { ar: 'الرَّحْمٰنِ', lat: 'ar-raḥmāni' },
      { ar: 'الرَّحِيْمِ', lat: 'ar-raḥīm' },
    ],
  },
  {
    id: 'hamdalah',
    set: 'short',
    title: 'Hamdalah',
    meaning: 'Segala puji bagi Allah, Tuhan seluruh alam.',
    parts: [
      { ar: 'اَلْحَمْدُ', lat: 'Al-ḥamdu' },
      { ar: 'لِلّٰهِ', lat: 'lillāhi' },
      { ar: 'رَبِّ الْعٰلَمِيْنَ', lat: "rabbil-'ālamīn" },
    ],
  },
  {
    id: 'tidur',
    set: 'short',
    title: 'Doa sebelum tidur',
    meaning: 'Dengan nama-Mu ya Allah, aku hidup dan aku mati.',
    parts: [
      { ar: 'بِاسْمِكَ اللّٰهُمَّ', lat: 'Bismikallāhumma' },
      { ar: 'اَحْيَا', lat: 'aḥyā' },
      { ar: 'وَبِاسْمِكَ اَمُوْتُ', lat: 'wa bismika amūt' },
    ],
  },
  {
    id: 'makan',
    set: 'daily',
    title: 'Doa sebelum makan',
    meaning: 'Ya Allah, berkahilah rezeki yang Engkau berikan kepada kami, dan peliharalah kami dari siksa api neraka.',
    parts: [
      { ar: 'اَللّٰهُمَّ بَارِكْ لَنَا', lat: 'Allāhumma bārik lanā' },
      { ar: 'فِيْمَا رَزَقْتَنَا', lat: 'fīmā razaqtanā' },
      { ar: 'وَقِنَا عَذَابَ النَّارِ', lat: "wa qinā 'ażāban-nār" },
    ],
  },
  {
    id: 'selesaimakan',
    set: 'daily',
    title: 'Doa sesudah makan',
    meaning: 'Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami orang-orang Islam.',
    parts: [
      { ar: 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ', lat: 'Al-ḥamdu lillāhil-lażī' },
      { ar: 'اَطْعَمَنَا وَسَقَانَا', lat: "aṭ'amanā wa saqānā" },
      { ar: 'وَجَعَلَنَا مُسْلِمِيْنَ', lat: "wa ja'alanā muslimīn" },
    ],
  },
  {
    id: 'bangun',
    set: 'daily',
    title: 'Doa bangun tidur',
    meaning: 'Segala puji bagi Allah yang menghidupkan kami setelah mematikan kami, dan kepada-Nya kami kembali.',
    parts: [
      { ar: 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ', lat: 'Al-ḥamdu lillāhil-lażī' },
      { ar: 'اَحْيَانَا بَعْدَ مَا اَمَاتَنَا', lat: "aḥyānā ba'da mā amātanā" },
      { ar: 'وَاِلَيْهِ النُّشُوْرُ', lat: 'wa ilaihin-nusyūr' },
    ],
  },
  {
    id: 'orangtua',
    set: 'daily',
    title: 'Doa untuk kedua orang tua',
    meaning: 'Ya Tuhanku, ampunilah aku dan kedua orang tuaku, dan sayangilah mereka sebagaimana mereka menyayangiku di waktu kecil.',
    parts: [
      { ar: 'رَبِّ اغْفِرْ لِيْ', lat: 'Rabbigfir lī' },
      { ar: 'وَلِوَالِدَيَّ', lat: 'wa liwālidayya' },
      { ar: 'وَارْحَمْهُمَا', lat: 'warḥamhumā' },
      { ar: 'كَمَا رَبَّيَانِيْ صَغِيْرًا', lat: 'kamā rabbayānī ṣagīrā' },
    ],
  },
  {
    id: 'sapujagat',
    set: 'daily',
    title: 'Doa kebaikan dunia akhirat',
    meaning: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari siksa api neraka.',
    parts: [
      { ar: 'رَبَّنَا اٰتِنَا فِى الدُّنْيَا حَسَنَةً', lat: 'Rabbanā ātinā fid-dunyā ḥasanah' },
      { ar: 'وَّفِى الْاٰخِرَةِ حَسَنَةً', lat: 'wa fil-ākhirati ḥasanah' },
      { ar: 'وَّقِنَا عَذَابَ النَّارِ', lat: "wa qinā 'ażāban-nār" },
    ],
  },
  {
    id: 'kautsar',
    set: 'surah3',
    title: 'Surat Al-Kautsar',
    meaning: 'Surat ke-108, 3 ayat.',
    surah: true,
    parts: [
      { ar: 'اِنَّآ اَعْطَيْنٰكَ الْكَوْثَرَۗ', lat: "Innā a'ṭainākal-kauṡar" },
      { ar: 'فَصَلِّ لِرَبِّكَ وَانْحَرْۗ', lat: 'Fa ṣalli lirabbika wanḥar' },
      { ar: 'اِنَّ شَانِئَكَ هُوَ الْاَبْتَرُ', lat: "Inna syāni'aka huwal-abtar" },
    ],
  },
  {
    id: 'ikhlas',
    set: 'surah3',
    title: 'Surat Al-Ikhlas',
    meaning: 'Surat ke-112, 4 ayat.',
    surah: true,
    parts: [
      { ar: 'قُلْ هُوَ اللّٰهُ اَحَدٌۚ', lat: 'Qul huwallāhu aḥad' },
      { ar: 'اَللّٰهُ الصَّمَدُۚ', lat: 'Allāhuṣ-ṣamad' },
      { ar: 'لَمْ يَلِدْ وَلَمْ يُوْلَدْۙ', lat: 'Lam yalid wa lam yūlad' },
      { ar: 'وَلَمْ يَكُنْ لَّهٗ كُفُوًا اَحَدٌ', lat: 'Wa lam yakul lahū kufuwan aḥad' },
    ],
  },
  {
    id: 'falaq',
    set: 'surah5',
    title: 'Surat Al-Falaq',
    meaning: 'Surat ke-113, 5 ayat.',
    surah: true,
    parts: [
      { ar: 'قُلْ اَعُوْذُ بِرَبِّ الْفَلَقِۙ', lat: "Qul a'ūżu birabbil-falaq" },
      { ar: 'مِنْ شَرِّ مَا خَلَقَۙ', lat: 'Min syarri mā khalaq' },
      { ar: 'وَمِنْ شَرِّ غَاسِقٍ اِذَا وَقَبَۙ', lat: 'Wa min syarri gāsiqin iżā waqab' },
      { ar: 'وَمِنْ شَرِّ النَّفّٰثٰتِ فِى الْعُقَدِۙ', lat: "Wa min syarrin-naffāṡāti fil-'uqad" },
      { ar: 'وَمِنْ شَرِّ حَاسِدٍ اِذَا حَسَدَ', lat: 'Wa min syarri ḥāsidin iżā ḥasad' },
    ],
  },
  {
    id: 'nas',
    set: 'surah5',
    title: 'Surat An-Nas',
    meaning: 'Surat ke-114, 6 ayat.',
    surah: true,
    parts: [
      { ar: 'قُلْ اَعُوْذُ بِرَبِّ النَّاسِۙ', lat: "Qul a'ūżu birabbin-nās" },
      { ar: 'مَلِكِ النَّاسِۙ', lat: 'Malikin-nās' },
      { ar: 'اِلٰهِ النَّاسِۙ', lat: 'Ilāhin-nās' },
      { ar: 'مِنْ شَرِّ الْوَسْوَاسِ ەۙ الْخَنَّاسِۖ', lat: 'Min syarril-waswāsil-khannās' },
      { ar: 'الَّذِيْ يُوَسْوِسُ فِيْ صُدُوْرِ النَّاسِۙ', lat: 'Allażī yuwaswisu fī ṣudūrin-nās' },
      { ar: 'مِنَ الْجِنَّةِ وَالنَّاسِ', lat: 'Minal-jinnati wan-nās' },
    ],
  },
  {
    id: 'fatihah',
    set: 'fatihah',
    title: 'Surat Al-Fatihah',
    meaning: 'Surat ke-1, 7 ayat.',
    surah: true,
    parts: [
      { ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ', lat: 'Bismillāhir-raḥmānir-raḥīm' },
      { ar: 'اَلْحَمْدُ لِلّٰهِ رَبِّ الْعٰلَمِيْنَۙ', lat: "Al-ḥamdu lillāhi rabbil-'ālamīn" },
      { ar: 'الرَّحْمٰنِ الرَّحِيْمِۙ', lat: 'Ar-raḥmānir-raḥīm' },
      { ar: 'مٰلِكِ يَوْمِ الدِّيْنِۗ', lat: 'Māliki yaumid-dīn' },
      { ar: 'اِيَّاكَ نَعْبُدُ وَاِيَّاكَ نَسْتَعِيْنُۗ', lat: "Iyyāka na'budu wa iyyāka nasta'īn" },
      { ar: 'اِهْدِنَا الصِّرَاطَ الْمُسْتَقِيْمَۙ', lat: 'Ihdinaṣ-ṣirāṭal-mustaqīm' },
      { ar: 'صِرَاطَ الَّذِيْنَ اَنْعَمْتَ عَلَيْهِمْ ەۙ غَيْرِ الْمَغْضُوْبِ عَلَيْهِمْ وَلَا الضَّاۤلِّيْنَ', lat: "Ṣirāṭal-lażīna an'amta 'alaihim gairil-magḍūbi 'alaihim wa laḍ-ḍāllīn" },
    ],
  },
];

let lastDoa = null;
export function genDoa({ type, sets }) {
  const pool = DOA.filter((d) => sets.includes(d.set));
  const item = pick(pool.length > 1 ? pool.filter((d) => d.id !== lastDoa) : pool);
  lastDoa = item.id;
  if (type === 'next') {
    // ayat yang ditampilkan, lalu pilih ayat sesudahnya
    const k = rand(0, item.parts.length - 2);
    const answer = item.parts[k + 1];
    const others = shuffle(DOA.filter((d) => d.surah).flatMap((d) => d.parts)).filter((p) => p !== answer && p !== item.parts[k]);
    const same = shuffle(item.parts.filter((p, i) => i !== k && i !== k + 1));
    const choices = shuffle([answer, ...[...same, ...others].filter((p, i, a) => a.findIndex((q) => q.ar === p.ar) === i && p.ar !== answer.ar).slice(0, 2)]);
    return { type, item, k, shown: item.parts[k], answer, choices };
  }
  let tiles;
  do tiles = shuffle(item.parts.map((p, id) => ({ id, ...p })));
  while (tiles.every((t, i) => t.id === i));
  return { type, item, tiles };
}
