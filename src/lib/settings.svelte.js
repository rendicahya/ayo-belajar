const SETTINGS_KEY = 'jb-settings';
const BEST_KEY = 'jb-best';

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

export function toggleMute() {
  settings.muted = !settings.muted;
  save(SETTINGS_KEY, settings);
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
