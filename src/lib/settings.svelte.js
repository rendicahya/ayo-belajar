import { STICKERS, STARS_PER_STICKER } from './stickers.js';

const SETTINGS_KEY = 'jb-settings';
const BEST_KEY = 'jb-best';
const PROGRESS_KEY = 'jb-progress';

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // penyimpanan tidak tersedia (mode privat, dsb.) — abaikan saja
  }
}

export const settings = $state({ muted: false, ...load(SETTINGS_KEY) });

export function setSubject(id) {
  settings.subject = id;
  save(SETTINGS_KEY, settings);
}

export function toggleMute() {
  settings.muted = !settings.muted;
  save(SETTINGS_KEY, settings);
}

// tema: 'light' / 'dark' kalau dipilih manual, kosong = ikut sistem
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
export const isDark = () => (settings.theme ? settings.theme === 'dark' : systemDark());

export function applyTheme() {
  const root = document.documentElement;
  if (settings.theme) root.dataset.theme = settings.theme;
  else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark() ? '#1c1a30' : '#ffb703');
}

export function toggleTheme() {
  settings.theme = isDark() ? 'light' : 'dark';
  save(SETTINGS_KEY, settings);
  applyTheme();
}

export function getBest(key) {
  return load(BEST_KEY)[key] ?? 0;
}

export function saveBest(key, stars) {
  const best = load(BEST_KEY);
  if (stars > (best[key] ?? 0)) {
    best[key] = stars;
    save(BEST_KEY, best);
  }
}

// ---- bintang, stiker, dan hari latihan berturut-turut ----

export const progress = $state({ totalStars: 0, days: [], ...load(PROGRESS_KEY) });

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function unlockedStickers() {
  return Math.min(STICKERS.length, Math.floor(progress.totalStars / STARS_PER_STICKER));
}

/** Hari berturut-turut sampai hari ini (atau kemarin, kalau hari ini belum latihan). */
export function streak() {
  const days = new Set(progress.days);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const practicedToday = () => progress.days.includes(dayKey(new Date()));

/** Catat satu soal selesai. Mengembalikan stiker baru / info hari latihan bila ada. */
export function recordSolve(star) {
  const result = { sticker: null, streak: 0 };
  const today = dayKey(new Date());
  if (!progress.days.includes(today)) {
    progress.days = [...progress.days, today].slice(-400);
    result.streak = streak();
  }
  if (star) {
    const before = unlockedStickers();
    progress.totalStars++;
    if (unlockedStickers() > before) result.sticker = STICKERS[before];
  }
  save(PROGRESS_KEY, progress);
  return result;
}
