import { rand, pick, shuffle } from './generate.js';
import { ALPHABET, VOWELS } from './letters.js';

// Kata bergambar beserta pemenggalan suku katanya.
export const WORDS = [
  ['🐔', 'a-yam'], ['🍎', 'a-pel'], ['🔥', 'a-pi'], ['☁️', 'a-wan'], ['🍇', 'ang-gur'],
  ['⚽', 'bo-la'], ['📖', 'bu-ku'], ['🦆', 'be-bek'], ['🌙', 'bu-lan'], ['⭐', 'bin-tang'], ['🌸', 'bu-nga'], ['🎈', 'ba-lon'],
  ['🐫', 'un-ta'], ['🐍', 'u-lar'], ['🐛', 'u-lat'],
  ['👔', 'da-si'], ['🐑', 'dom-ba'], ['🍩', 'do-nat'],
  ['🦅', 'e-lang'],
  ['📷', 'fo-to'],
  ['🐘', 'ga-jah'], ['🦷', 'gi-gi'], ['🎸', 'gi-tar'],
  ['🐯', 'ha-ri-mau'], ['👃', 'hi-dung'], ['🌧️', 'hu-jan'],
  ['🐟', 'i-kan'],
  ['🍊', 'je-ruk'], ['🌽', 'ja-gung'],
  ['🦶', 'ka-ki'], ['🐱', 'ku-cing'], ['🐴', 'ku-da'], ['🚢', 'ka-pal'], ['🍰', 'ku-e'], ['🔑', 'kun-ci'], ['🎁', 'ka-do'],
  ['☕', 'ko-pi'], ['🧀', 'ke-ju'], ['🐰', 'ke-lin-ci'], ['🚆', 'ke-re-ta'], ['🐐', 'kam-bing'], ['🪑', 'kur-si'],
  ['🕯️', 'li-lin'], ['💡', 'lam-pu'], ['🐝', 'le-bah'],
  ['👁️', 'ma-ta'], ['🍯', 'ma-du'], ['🚗', 'mo-bil'], ['🐵', 'mo-nyet'],
  ['🍍', 'na-nas'], ['🍚', 'na-si'],
  ['💊', 'o-bat'],
  ['🍌', 'pi-sang'], ['🚪', 'pin-tu'], ['☂️', 'pa-yung'], ['🌳', 'po-hon'], ['✈️', 'pe-sa-wat'], ['🐋', 'pa-us'], ['🖊️', 'pe-na'],
  ['🍞', 'ro-ti'], ['🏠', 'ru-mah'], ['🦌', 'ru-sa'],
  ['🐄', 'sa-pi'], ['🥛', 'su-su'], ['🐜', 'se-mut'], ['👟', 'se-pa-tu'], ['🥄', 'sen-dok'], ['🧼', 'sa-bun'], ['🚲', 'se-pe-da'],
  ['🧢', 'to-pi'], ['🍅', 'to-mat'], ['🥚', 'te-lur'], ['👂', 'te-li-nga'], ['✋', 'ta-ngan'],
  ['🥕', 'wor-tel'],
  ['🪀', 'yo-yo'],
  ['🦓', 'ze-bra'],
].map(([emoji, cut]) => ({ emoji, syl: cut.split('-'), word: cut.replace(/-/g, '') }));

const CONSONANTS = 'bcdfghjklmnprstwy'.split('');

/** Hindari soal yang sama dua kali berturut-turut. */
let last = null;
function fresh(make) {
  let q;
  for (let tries = 0; tries < 20; tries++) {
    q = make();
    if (q.key !== last) break;
  }
  last = q.key;
  return q;
}

// ---------- Mengenal huruf ----------

export function genLetter({ type, pool }) {
  return fresh(() => {
    if (type === 'listen') {
      const letters = pool === 'vowel' ? VOWELS : ALPHABET;
      const answer = pick(letters);
      return { key: answer, answer, choices: shuffle([answer, ...shuffle(letters.filter((l) => l !== answer)).slice(0, 3)]) };
    }
    if (type === 'case') {
      // huruf besar → pilih huruf kecilnya; huruf yang mirip (b d p q) sengaja dicampur
      const tricky = [['b', 'd', 'p', 'q'], ['m', 'n', 'u', 'w'], ['i', 'j', 'l', 't'], ['a', 'e', 'o', 'c']];
      const answer = pick(ALPHABET);
      const group = tricky.find((g) => g.includes(answer)) ?? [];
      const others = shuffle([...new Set([...group, ...shuffle(ALPHABET)])].filter((l) => l !== answer)).slice(0, 3);
      return { key: answer, answer, shown: answer.toUpperCase(), choices: shuffle([answer, ...others]) };
    }
    if (type === 'initial') {
      const w = pick(WORDS);
      const answer = w.word[0];
      const others = shuffle(ALPHABET.filter((l) => l !== answer && WORDS.some((x) => x.word[0] === l))).slice(0, 3);
      return { key: w.word, answer, word: w, choices: shuffle([answer, ...others]) };
    }
    // huruf sebelum / sesudah dalam abjad
    const dir = Math.random() < 0.5 ? 'after' : 'before';
    const i = dir === 'after' ? rand(0, 24) : rand(1, 25);
    const n = ALPHABET[i];
    const k = dir === 'after' ? i + 1 : i - 1;
    const start = Math.min(Math.max(k - rand(0, 3), 0), 22);
    return { key: n + dir, dir, n, answer: ALPHABET[k], choices: ALPHABET.slice(start, start + 4) };
  });
}

// ---------- Suku kata & kata ----------

export function genSyllable({ type, count }) {
  return fresh(() => {
    if (type === 'vowel') {
      // ba bi bu be bo: konsonannya sama, vokalnya berbeda
      const c = pick(CONSONANTS);
      const answer = c + pick(VOWELS);
      const others = shuffle(VOWELS.map((v) => c + v).filter((s) => s !== answer)).slice(0, 3);
      return { key: answer, answer, choices: shuffle([answer, ...others]) };
    }
    if (type === 'mixed') {
      const answer = pick(CONSONANTS) + pick(VOWELS);
      const set = new Set([answer]);
      // pengecoh: vokal sama konsonan beda, dan konsonan sama vokal beda
      set.add(pick(CONSONANTS.filter((c) => c !== answer[0])) + answer[1]);
      set.add(answer[0] + pick(VOWELS.filter((v) => v !== answer[1])));
      while (set.size < 4) set.add(pick(CONSONANTS) + pick(VOWELS));
      return { key: answer, answer, choices: shuffle([...set]) };
    }
    if (type === 'build') {
      const w = pick(WORDS.filter((x) => x.syl.length === count));
      const extra = pick(WORDS.flatMap((x) => x.syl).filter((s) => !w.syl.includes(s)));
      return { key: w.word, word: w, tiles: shuffle([...w.syl, extra]) };
    }
    // baca kata, pilih gambarnya
    const [w, ...others] = shuffle(WORDS);
    const look = others.filter((x) => x.word[0] === w.word[0] || x.syl.length === w.syl.length);
    const pickedOthers = [...new Set([...shuffle(look), ...others])].slice(0, 3);
    return { key: w.word, word: w, choices: shuffle([w, ...pickedOthers]) };
  });
}

// ---------- Menyusun kalimat ----------

const SENTENCES = [
  'Ibu memasak nasi', 'Ayah membaca koran', 'Adik minum susu', 'Kakak menulis surat', 'Kucing makan ikan',
  'Budi bermain bola', 'Kami makan pisang', 'Burung terbang tinggi', 'Nenek menanam bunga', 'Kakek minum kopi',
  'Sapi makan rumput', 'Kakak naik sepeda', 'Dodi menyiram tanaman', 'Bulan bersinar terang', 'Ayah mencuci mobil',
  'Adik bermain boneka', 'Nenek membuat kue',
  'Ani pergi ke sekolah', 'Saya suka apel merah', 'Ayah pergi ke kantor', 'Adik tidur di kamar', 'Kami belajar di kelas',
  'Ani membaca buku cerita', 'Saya mandi pagi hari', 'Kucing tidur di kursi', 'Kakak memakai topi biru',
  'Budi makan roti keju', 'Ibu menyapu lantai rumah', 'Ayah minum teh panas',
  'Ibu membeli sayur di pasar', 'Kami pergi ke kebun binatang', 'Adik bermain bola di halaman',
  'Ayah menanam pohon di kebun', 'Nenek memasak sayur di dapur', 'Kakak membaca buku di kamar',
  'Saya pergi ke sekolah naik sepeda',
].map((s) => s.split(' '));

// kalimat rumpang: [kalimat dengan ___, jawaban, pengecoh, pengecoh]
const BLANKS = [
  ['Adik minum ___.', 'susu', 'batu', 'sepatu'],
  ['Kucing makan ___.', 'ikan', 'buku', 'meja'],
  ['Ibu memasak ___.', 'nasi', 'pensil', 'bola'],
  ['Budi bermain ___.', 'bola', 'roti', 'sabun'],
  ['Kakak menulis dengan ___.', 'pensil', 'sendok', 'bantal'],
  ['Ayah membaca ___.', 'koran', 'kue', 'sepatu'],
  ['Burung terbang di ___.', 'langit', 'lemari', 'piring'],
  ['Ikan berenang di ___.', 'kolam', 'kursi', 'pohon'],
  ['Saya tidur di ___.', 'kasur', 'piring', 'pohon'],
  ['Sapi makan ___.', 'rumput', 'batu', 'sepatu'],
  ['Kami belajar di ___.', 'sekolah', 'kolam', 'kandang'],
  ['Adik memakai ___ di kaki.', 'sepatu', 'topi', 'dasi'],
  ['Ibu menyapu dengan ___.', 'sapu', 'gelas', 'buku'],
  ['Kakak naik ___ ke sekolah.', 'sepeda', 'kasur', 'meja'],
  ['Kami makan dengan ___.', 'sendok', 'sepatu', 'bantal'],
  ['Monyet suka makan ___.', 'pisang', 'batu', 'kaca'],
  ['Saya mandi memakai ___.', 'sabun', 'pasir', 'lumpur'],
  ['Kakek minum ___ panas.', 'teh', 'batu', 'kertas'],
  ['Adik menggambar dengan ___.', 'krayon', 'garpu', 'sandal'],
  ['Payung dipakai saat ___.', 'hujan', 'tidur', 'makan'],
];

const sentence = (words) => `${words.join(' ')}.`;

export function genSentence({ type, words: size }) {
  return fresh(() => {
    if (type === 'blank') {
      const [text, answer, ...others] = pick(BLANKS);
      return { key: text, text, answer, choices: shuffle([answer, ...others]) };
    }
    if (type === 'build') {
      const words = pick(SENTENCES.filter((s) => s.length === size || (size === 5 && s.length > 5)));
      return { key: words.join(' '), words, tiles: shuffle(words.map((w, i) => ({ id: i, w }))) };
    }
    // pilih kalimat yang penulisannya benar (huruf kapital & titik)
    const words = pick(SENTENCES);
    const answer = sentence(words);
    const lower = [words[0].toLowerCase(), ...words.slice(1)];
    const swapped = [...words];
    const j = rand(1, words.length - 2);
    [swapped[j], swapped[j + 1]] = [swapped[j + 1], swapped[j]];
    const wrong = shuffle([sentence(lower), words.join(' '), `${lower.join(' ')}`, sentence(swapped)]).slice(0, 3);
    return { key: answer, answer, choices: shuffle([answer, ...wrong]) };
  });
}
