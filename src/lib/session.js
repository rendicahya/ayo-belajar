// Satu sesi = satu kali main 10 soal di sebuah level. Selama sesi, soal yang sudah
// muncul dicatat lewat kuncinya, supaya soal yang sama tidak muncul dua kali.

const seen = new Set();

/** Mulai sesi baru (dipanggil saat level dimulai atau diulang). */
export function newSession() {
  seen.clear();
}

/**
 * Bungkus pembuat soal: buat ulang sampai kuncinya belum pernah muncul di sesi ini.
 * `key(q, ...args)` mengembalikan string yang sama untuk soal yang dianggap sama.
 */
export function noRepeat(name, gen, key) {
  const wrapped = (...args) => {
    let q;
    let k;
    for (let tries = 0; tries < 200; tries++) {
      q = gen(...args);
      k = `${name}:${key(q, ...args)}`;
      if (!seen.has(k)) break;
    }
    seen.add(k);
    return q;
  };
  wrapped.key = (q, ...args) => `${name}:${key(q, ...args)}`;
  wrapped.raw = gen;
  return wrapped;
}
