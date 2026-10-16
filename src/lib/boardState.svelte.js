import { play } from './sound.js';

const EMPTY = { text: '', kind: '' };

// Teguran lembut kalau jawabannya benar tapi simpan/pinjam/sisa tidak ditulis dengan tepat.
const NUDGES = {
  simpan: {
    missing: 'Tapi simpanannya belum ditulis. Tulis di lingkaran yang berkedip, lalu tekan Cek lagi.',
    wrong: 'Tapi ada simpanan yang belum tepat. Perbaiki lingkaran yang berkedip, lalu tekan Cek lagi.',
  },
  pinjam: {
    missing: 'Tapi kamu lupa menandai pinjamannya. Ketuk lingkaran yang berkedip, lalu tekan Cek lagi.',
    wrong: 'Tapi ada pinjaman yang belum tepat. Periksa lingkaran yang berkedip, lalu tekan Cek lagi.',
  },
  sisa: {
    missing: 'Tapi sisanya belum ditulis kecil di depan angka berikutnya. Tulis di lingkaran yang berkedip, lalu tekan Cek lagi.',
    wrong: 'Tapi ada sisa yang belum tepat. Perbaiki lingkaran yang berkedip, lalu tekan Cek lagi.',
  },
};
const blank = (v) => (v == null || v === false || v === 0 ? null : v);

/** State interaktif papan bersusun: isi kotak, cek jawaban, petunjuk, dan lihat cara. */
export class BoardState {
  vals = $state({});
  marks = $state({});
  cursor = $state(null);
  solved = $state(false);
  playing = $state(false);
  step = $state(-1);
  help = $state(null); // { text, col, key }
  message = $state(EMPTY);
  attempts = $state(0);
  shake = $state(0);
  nudged = $state(false);
  usedHelp = false;
  #lastInput;
  #helperExpect = {};

  /** Kotak bantuan yang perlu diperiksa, setelah anak ditegur. */
  nudgeKeys = $derived(this.nudged && !this.solved ? this.#helperMismatch() : []);

  canCheck = $derived.by(() =>
    this.model.rows.every((row) => {
      if (this.vals[row.keys[0]] == null) return false;
      let gap = false;
      for (const k of row.keys) {
        if (this.vals[k] == null) gap = true;
        else if (gap) return false;
      }
      return true;
    }),
  );

  constructor(model, onSolved) {
    this.model = model;
    this.onSolved = onSolved;
    this.cells = Object.assign({}, ...model.rows.map((r) => r.cells));
    this.cursor = this.#lastInput = model.rows[0].order[0];
    // isi akhir kotak bantuan menurut langkah penyelesaian
    if (model.helperName) {
      const final = Object.assign({}, ...model.steps.map((s) => s.set));
      for (const [k, v] of Object.entries(final)) if (!(k in this.cells)) this.#helperExpect[k] = v;
    }
  }

  #helperMismatch() {
    if (!this.model.helperName) return [];
    const keys = new Set([...Object.keys(this.#helperExpect), ...Object.keys(this.vals).filter((k) => !this.isInput(k))]);
    const optional = this.model.helperOptional ?? [];
    return [...keys].filter((k) => !optional.includes(k) && blank(this.vals[k]) !== blank(this.#helperExpect[k]));
  }

  get locked() {
    return this.solved || this.playing;
  }

  isInput(k) {
    return k in this.cells;
  }

  #rowOf(k) {
    return this.model.rows.findIndex((r) => r.order.includes(k));
  }

  #correct(k) {
    const c = this.cells[k];
    const got = this.vals[k];
    return got == null ? c.lead : got === c.exp;
  }

  select(k) {
    if (this.locked) return;
    this.cursor = k;
    if (this.isInput(k)) this.#lastInput = k;
  }

  /** Untuk kotak bantuan yang diketuk berulang (simpanan penjumlahan). */
  cycle(k, max) {
    if (this.locked) return;
    const next = ((this.vals[k] ?? 0) + 1) % (max + 1);
    this.vals[k] = next || null;
    play('pop');
  }

  input(d) {
    if (this.locked) return;
    const k = this.cursor;
    if (!this.isInput(k)) {
      this.vals[k] = d;
      this.cursor = this.#lastInput;
      play('pop');
      return;
    }
    this.vals[k] = d;
    delete this.marks[k];
    this.message = EMPTY;
    play('tap');
    const r = this.#rowOf(k);
    const order = this.model.rows[r].order;
    const i = order.indexOf(k);
    let next = k;
    if (i < order.length - 1) next = order[i + 1];
    else {
      const nextRow = this.model.rows[r + 1];
      if (nextRow && this.vals[nextRow.order[0]] == null) next = nextRow.order[0];
    }
    this.cursor = this.#lastInput = next;
  }

  erase() {
    if (this.locked) return;
    let k = this.cursor;
    if (!this.isInput(k)) {
      this.vals[k] = null;
      this.cursor = this.#lastInput;
      return;
    }
    if (this.vals[k] == null) {
      const order = this.model.rows[this.#rowOf(k)].order;
      const i = order.indexOf(k);
      if (i > 0) k = order[i - 1];
    }
    this.vals[k] = null;
    delete this.marks[k];
    this.cursor = this.#lastInput = k;
  }

  moveCursor(delta) {
    if (this.locked || !this.isInput(this.cursor)) return;
    const order = this.model.rows[this.#rowOf(this.cursor)].order;
    const i = order.indexOf(this.cursor) + delta;
    if (i >= 0 && i < order.length) this.select(order[i]);
  }

  check() {
    if (this.locked || !this.canCheck) return;
    let ok = true;
    for (const k of Object.keys(this.cells)) {
      const good = this.#correct(k);
      this.marks[k] = good ? 'ok' : 'bad';
      if (!good) ok = false;
    }
    this.help = null;
    if (ok) {
      const miss = this.#helperMismatch();
      if (miss.length && !this.nudged) {
        // cukup sekali: kalau setelah ditegur tetap begitu, jawaban tetap diterima
        this.nudged = true;
        const text = NUDGES[this.model.helperName][miss.every((k) => blank(this.vals[k]) == null) ? 'missing' : 'wrong'];
        this.message = { text: `Jawabanmu sudah benar! 👍 ${text}`, kind: 'nudge' };
        play('pop');
        return;
      }
      this.solved = true;
      this.message = EMPTY;
      play('correct');
      this.onSolved(this.attempts === 0 && !this.usedHelp);
    } else {
      this.attempts++;
      this.shake++;
      const firstBad = this.model.rows.flatMap((r) => r.order).find((k) => this.marks[k] === 'bad');
      this.select(firstBad);
      this.message = { text: 'Hmm, angka yang merah masih salah. Coba lagi, ya! 💪', kind: 'bad' };
      play('wrong');
    }
  }

  hint() {
    if (this.locked) return;
    this.usedHelp = true;
    this.message = EMPTY;
    const wrongKey = (s) => Object.keys(s.set).find((k) => this.isInput(k) && !this.#correct(k));
    const step = this.model.steps.find(wrongKey);
    if (!step) {
      this.help = { text: 'Semua jawaban sudah benar. Tekan tombol Cek! ✔' };
      return;
    }
    const key = wrongKey(step);
    this.help = { text: step.text, col: step.col, key };
    this.select(key);
    play('pop');
  }

  /** Mulai memperlihatkan cara menjawab langkah demi langkah dari papan kosong. */
  startSolution() {
    if (this.locked) return;
    this.usedHelp = true;
    this.playing = true;
    this.vals = {};
    this.marks = {};
    this.message = EMPTY;
    this.cursor = null;
    this.step = -1;
    this.nextStep();
  }

  nextStep() {
    if (!this.playing) return;
    this.step++;
    const s = this.model.steps[this.step];
    if (!s) {
      this.playing = false;
      this.help = { text: 'Begitu caranya! Sekarang kamu sudah tahu. 😊' };
      for (const k of Object.keys(this.cells)) this.marks[k] = 'ok';
      this.solved = true;
      play('correct');
      this.onSolved(false, { shown: true });
      return;
    }
    for (const [k, v] of Object.entries(s.set)) this.vals[k] = v;
    this.help = { text: s.text, col: s.col };
    play('pop');
  }

  get isLastStep() {
    return this.step >= this.model.steps.length - 1;
  }
}
