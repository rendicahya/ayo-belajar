import { settings } from './settings.svelte.js';

const BASE = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

/** 325 → "tiga ratus dua puluh lima" */
export function terbilang(n) {
  if (n < 0) return `minus ${terbilang(-n)}`;
  if (n < 12) return BASE[n];
  if (n < 20) return `${BASE[n - 10]} belas`;
  const part = (big, word, oneWord) => {
    const head = Math.floor(n / big);
    const rest = n % big;
    const front = head === 1 && oneWord ? oneWord : `${terbilang(head)} ${word}`;
    return rest ? `${front} ${terbilang(rest)}` : front;
  };
  if (n < 100) return part(10, 'puluh');
  if (n < 1000) return part(100, 'ratus', 'seratus');
  if (n < 1e6) return part(1000, 'ribu', 'seribu');
  return part(1e6, 'juta');
}

/** 1/2 → "setengah", 2/3 → "dua pertiga" */
export function fractionWords(k, d) {
  if (k === 1 && d === 2) return 'setengah';
  return `${k === 1 ? 'se' : `${terbilang(k)} `}per${terbilang(d)}`;
}

/** Ubah teks berisi angka & simbol menjadi kalimat yang enak dibacakan. */
export function toSpeech(text) {
  const num = (s) => terbilang(Number(s.replace(/\./g, '')));
  return String(text)
    .replace(/Rp\s?(\d{1,3}(?:\.\d{3})+|\d+)/g, (_, m) => ` ${num(m)} rupiah `)
    .replace(/\d{1,3}(?:\.\d{3})+/g, (m) => ` ${num(m)} `)
    .replace(/(\d+)\/(\d+)/g, (_, k, d) => ` ${fractionWords(Number(k), Number(d))} `)
    .replace(/\d+/g, (m) => ` ${terbilang(Number(m))} `)
    .replace(/×/g, ' kali ')
    .replace(/−/g, ' kurang ')
    .replace(/\+/g, ' tambah ')
    .replace(/÷| : /g, ' bagi ')
    .replace(/=/g, ' sama dengan ')
    .replace(/[^\p{L}\p{N}\s.,?!]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voice = null;
function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('id')) ?? null;
}
if (canSpeak) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

// Browser menolak suara sebelum halaman pernah disentuh (mis. saat aplikasi baru dibuka langsung di
// halaman soal). Teks terakhir disimpan dulu dan dibacakan pada ketukan pertama.
let touched = false;
let pending = null;
let current = null; // referensi ucapan supaya tidak dibuang sebelum selesai (bug Chrome)

const activated = () => touched || navigator.userActivation?.hasBeenActive === true;

function utter(text) {
  const synth = window.speechSynthesis;
  if (!voice) pickVoice();
  const u = new SpeechSynthesisUtterance(toSpeech(text));
  u.lang = voice?.lang ?? 'id-ID';
  if (voice) u.voice = voice;
  u.rate = 0.9;
  u.pitch = 1.1;
  u.onend = u.onerror = () => {
    if (current === u) current = null;
  };
  current = u;
  synth.resume(); // Chrome kadang tersangkut dalam keadaan jeda
  synth.speak(u);
}

export function speak(text) {
  if (!canSpeak) return;
  if (!activated()) {
    pending = text;
    return;
  }
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    // ucapan yang dikirim tepat setelah cancel() sering hilang di Chrome Android
    setTimeout(() => utter(text), 80);
  } else {
    utter(text);
  }
}

if (canSpeak) {
  // hanya event yang dihitung browser sebagai interaksi pengguna (pointerdown sentuhan tidak termasuk)
  const events = ['mousedown', 'touchend', 'click', 'keydown'];
  const unlock = () => {
    if (touched) return;
    touched = true;
    events.forEach((ev) => window.removeEventListener(ev, unlock, true));
    if (pending) {
      const text = pending;
      pending = null;
      utter(text);
    } else {
      // ucapan kosong di dalam ketukan membuka kunci suara di Safari iPhone/iPad
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  };
  events.forEach((ev) => window.addEventListener(ev, unlock, true));
}

/** Bacakan otomatis (bukan karena diketuk), kecuali suara sedang dimatikan. */
export function say(text) {
  if (!settings.muted) speak(text);
}
