<script>
  import { untrack } from 'svelte';
  import { genAddition, genSubtraction, digitsOf } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import Keypad from './Keypad.svelte';

  let props = $props();

  // Komponen ini dibuat ulang (via {#key}) untuk setiap soal, jadi nilai awal props sudah cukup.
  const { mode, level } = untrack(() => props);
  const isAdd = mode.id === 'tambah';
  const problem = isAdd ? genAddition(level) : genSubtraction(level);
  const rows = problem.operands.map(digitsOf); // tiap baris: digit dari satuan ke kiri
  const top = rows[0];
  const maxLen = Math.max(...rows.map((r) => r.length));
  // Penjumlahan bisa menghasilkan satu digit lebih panjang
  const width = isAdd ? maxLen + 1 : maxLen;
  const positions = Array.from({ length: width }, (_, k) => width - 1 - k); // kiri → kanan
  const expected = digitsOf(problem.answer);
  const maxCarry = rows.length - 1; // 3 bilangan bisa menyimpan sampai 2

  let answer = $state(Array(width).fill(null));
  let marks = $state(Array(width).fill(null));
  let cursor = $state(0); // posisi dari kanan; mulai dari satuan
  let carry = $state(Array(width).fill(0)); // carry[p]: angka yang disimpan di atas kolom p
  let lend = $state(Array(width).fill(false)); // lend[p]: kolom p meminjamkan 1 ke kolom p-1
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  // Jawaban harus terisi dari kanan tanpa celah
  const canCheck = $derived.by(() => {
    if (answer[0] === null) return false;
    let gap = false;
    for (const d of answer) {
      if (d === null) gap = true;
      else if (gap) return false;
    }
    return true;
  });

  const received = (p) => p + 1 < width && lend[p + 1];
  const effective = (p) => top[p] + (received(p) ? 10 : 0) - (lend[p] ? 1 : 0);

  function say(text, kind = 'info') {
    message = { text, kind };
  }

  function input(d) {
    if (solved) return;
    answer[cursor] = d;
    marks[cursor] = null;
    if (cursor < width - 1) cursor++;
    say('');
    play('tap');
  }

  function erase() {
    if (solved) return;
    if (answer[cursor] === null && cursor > 0) cursor--;
    answer[cursor] = null;
    marks[cursor] = null;
  }

  function toggleCarry(p) {
    if (solved) return;
    carry[p] = (carry[p] + 1) % (maxCarry + 1);
    play('pop');
  }

  function toggleLend(p) {
    if (solved) return;
    if (!lend[p]) {
      if (top[p] + (received(p) ? 10 : 0) < 1) {
        say('Angka 0 belum bisa meminjamkan. Pinjam dulu dari angka di kirinya!', 'bad');
        play('wrong');
        return;
      }
      lend[p] = true;
    } else {
      if (lend[p - 1] && top[p - 1] === 0) {
        say('Batalkan dulu pinjaman di sebelah kanannya, ya.', 'bad');
        play('wrong');
        return;
      }
      lend[p] = false;
    }
    say('');
    play('pop');
  }

  function check() {
    if (solved || !canCheck) return;
    let allGood = true;
    for (let p = 0; p < width; p++) {
      const got = answer[p];
      // kotak kosong di kiri boleh, asalkan memang tidak ada digitnya
      const good = got === null ? p >= expected.length : got === (expected[p] ?? 0);
      marks[p] = good ? 'ok' : 'bad';
      if (!good) allGood = false;
    }
    if (allGood) {
      solved = true;
      say('');
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      shake++;
      cursor = marks.indexOf('bad');
      say('Hmm, angka yang merah masih salah. Coba lagi, ya! 💪', 'bad');
      play('wrong');
    }
  }

  function onkeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) input(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete') erase();
    else if (e.key === 'Enter') check();
    else if (e.key === 'ArrowLeft') cursor = Math.min(width - 1, cursor + 1);
    else if (e.key === 'ArrowRight') cursor = Math.max(0, cursor - 1);
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<p class="hint">
  {#if isAdd}
    Isi jawaban mulai dari <b>kanan</b>. Kalau hasilnya lebih dari 9, ketuk lingkaran di atas angka di kirinya
    untuk <b>menyimpan</b>.
  {:else}
    Isi jawaban mulai dari <b>kanan</b>. Kalau angka atas lebih kecil, ketuk lingkaran di atas angka di kirinya
    untuk <b>meminjam 1</b>.
  {/if}
</p>

<div class="play">
  <div class="board" style="grid-template-columns: repeat({width + 1}, var(--cell))">
    <!-- baris simpan / pinjam -->
    <div></div>
    {#each positions as p}
      <div class="helper">
        {#if isAdd && p >= 1}
          <button
            class="bubble"
            class:on={carry[p] > 0}
            onclick={() => toggleCarry(p)}
            aria-label="Simpan angka di kolom ini"
            title="Simpan"
          >
            {carry[p] || ''}
          </button>
        {:else if !isAdd && p >= 1 && p < top.length}
          <button
            class="bubble lend"
            class:on={lend[p]}
            onclick={() => toggleLend(p)}
            aria-label="Pinjam 1 dari angka ini"
            title="Pinjam 1"
          >
            {lend[p] ? effective(p) : ''}
          </button>
        {/if}
      </div>
    {/each}

    <!-- bilangan-bilangan -->
    {#each rows as row, r}
      <div class="op">{r === rows.length - 1 ? (isAdd ? '+' : '−') : ''}</div>
      {#each positions as p}
        <div class="digit">
          {#if row[p] !== undefined}
            {#if !isAdd && r === 0}
              <span class="top" class:struck={lend[p]}>
                {#if received(p) && !lend[p]}<span class="ten">1</span>{/if}{row[p]}
              </span>
            {:else}
              {row[p]}
            {/if}
          {/if}
        </div>
      {/each}
    {/each}

    <div class="line"></div>

    <!-- jawaban -->
    <div></div>
    {#each positions as p}
      {#key marks[p] === 'bad' ? shake : 0}
        <button
          class="cell"
          class:active={cursor === p && !solved}
          class:filled={answer[p] !== null}
          class:ok={marks[p] === 'ok' && answer[p] !== null}
          class:bad={marks[p] === 'bad'}
          onclick={() => (cursor = p)}
          aria-label="Kotak jawaban"
        >
          {answer[p] ?? ''}
        </button>
      {/key}
    {/each}
  </div>

  <Keypad oninput={input} onerase={erase} oncheck={check} {canCheck} disabled={solved} />
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .play {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 24px 40px;
    margin: 20px 0 12px;
  }

  .board {
    --cell: clamp(46px, min(15vw, 9.5vh), 84px);
    display: grid;
    column-gap: 6px;
    padding: 14px 22px 20px 10px;
    border-radius: var(--radius);
    background-color: var(--card);
    background-image:
      linear-gradient(#eef3fb 2px, transparent 2px), linear-gradient(90deg, #eef3fb 2px, transparent 2px);
    background-size: 28px 28px;
    box-shadow: var(--shadow);
    font-variant-numeric: tabular-nums;
  }

  .helper,
  .digit,
  .op {
    display: grid;
    place-items: center;
  }

  .helper {
    height: calc(var(--cell) * 0.8);
  }

  .digit,
  .op {
    height: var(--cell);
    font-size: calc(var(--cell) * 0.78);
    font-weight: 600;
    line-height: 1;
  }

  .op {
    color: var(--coral);
  }

  .bubble {
    width: calc(var(--cell) * 0.7);
    height: calc(var(--cell) * 0.7);
    border-radius: 50%;
    border: 3px dashed #c9c3dd;
    background: rgba(255, 255, 255, 0.8);
    color: #fff;
    font-size: calc(var(--cell) * 0.4);
    font-weight: 700;
    transition: transform 0.12s;
  }

  .bubble:hover {
    border-color: var(--pink);
    transform: scale(1.08);
  }

  .bubble.on {
    border: 3px solid var(--pink);
    background: var(--pink);
    animation: pop 0.25s ease-out;
  }

  .bubble.lend.on {
    border-color: var(--sky);
    background: var(--sky);
  }

  .top {
    position: relative;
  }

  .top.struck {
    color: #b9b4cc;
    text-decoration: line-through;
    text-decoration-color: var(--bad);
    text-decoration-thickness: 5px;
  }

  .ten {
    position: absolute;
    right: 100%;
    top: -0.1em;
    font-size: 0.45em;
    color: var(--sky);
    font-weight: 700;
  }

  .line {
    grid-column: 1 / -1;
    height: 6px;
    margin: 8px 0 12px;
    border-radius: 3px;
    background: var(--ink);
  }

  .cell {
    width: var(--cell);
    height: calc(var(--cell) * 1.05);
    border-radius: 16px;
    border: 3px dashed #c9c3dd;
    background: rgba(255, 255, 255, 0.85);
    font-size: calc(var(--cell) * 0.72);
    font-weight: 600;
    line-height: 1;
  }

  .cell.filled {
    border-style: solid;
    border-color: #c9c3dd;
  }

  .cell.active {
    border: 4px solid var(--sun);
    background: #fff8dc;
    box-shadow: 0 0 0 5px rgba(255, 183, 3, 0.25);
    animation: bob 1.2s ease-in-out infinite;
  }

  .cell.ok {
    border: 3px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
    animation: pop 0.3s ease-out;
  }

  .cell.bad {
    border: 3px solid var(--bad);
    background: var(--bad-soft);
    color: var(--bad);
    animation: shake 0.4s;
  }

  .cell.bad.active {
    box-shadow: 0 0 0 5px rgba(232, 67, 95, 0.25);
  }
</style>
