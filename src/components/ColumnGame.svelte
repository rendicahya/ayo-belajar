<script>
  import { untrack } from 'svelte';
  import { genAddition, genSubtraction, genMultiplication } from '../lib/generate.js';
  import { buildColumn } from '../lib/board.js';
  import { BoardState } from '../lib/boardState.svelte.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';
  import HelpBar from './HelpBar.svelte';

  let props = $props();

  // Komponen ini dibuat ulang (via {#key}) untuk setiap soal, jadi nilai awal props sudah cukup.
  const { op, level, given, compact } = untrack(() => ({
    op: props.op ?? props.mode.id,
    level: props.level,
    given: props.problem,
    compact: props.compact,
  }));
  const gens = { tambah: genAddition, kurang: genSubtraction, kali: genMultiplication };
  const problem = given ?? gens[op](level);
  const model = buildColumn(op, problem.operands);
  const { cols, numbers, values, helper, rows } = model;
  const board = new BoardState(model, (firstTry, info) => props.onSolved(firstTry, info));

  const positions = Array.from({ length: cols }, (_, k) => cols - 1 - k); // kiri → kanan
  const top = numbers[0];
  const rowUnits = 0.8 + numbers.length + rows.length * 1.05 + rows.filter((r) => r.lineBefore).length * 0.4;

  const hl = $derived(board.help?.col);

  // --- pinjam (pengurangan): l{p} berarti kolom p meminjamkan 1 ke kanannya ---
  const lent = (p) => board.vals[`l${p}`] === true;
  const received = (p) => p + 1 < cols && lent(p + 1);
  const effective = (p) => top[p] + (received(p) ? 10 : 0) - (lent(p) ? 1 : 0);

  function toggleLend(p) {
    if (board.locked) return;
    if (!lent(p)) {
      if (top[p] + (received(p) ? 10 : 0) < 1) {
        board.message = { text: 'Angka 0 belum bisa meminjamkan. Pinjam dulu dari angka di kirinya!', kind: 'bad' };
        play('wrong');
        return;
      }
      board.vals[`l${p}`] = true;
    } else {
      if (lent(p - 1) && top[p - 1] === 0) {
        board.message = { text: 'Batalkan dulu pinjaman di sebelah kanannya, ya.', kind: 'bad' };
        play('wrong');
        return;
      }
      board.vals[`l${p}`] = null;
    }
    board.message = { text: '', kind: '' };
    play('pop');
  }

  function onkeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) board.input(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete') board.erase();
    else if (e.key === 'Enter') board.playing ? board.nextStep() : board.check();
    else if (e.key === 'ArrowLeft') board.moveCursor(1);
    else if (e.key === 'ArrowRight') board.moveCursor(-1);
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if !compact}
  <p class="hint">
    Isi jawaban mulai dari <b>kanan</b>.
    {#if op === 'tambah'}
      Kalau hasilnya lebih dari 9, ketuk lingkaran di atas angka di kirinya untuk <b>menyimpan</b>.
    {:else if op === 'kurang'}
      Kalau angka atas lebih kecil, ketuk lingkaran di atas angka di kirinya untuk <b>meminjam 1</b>.
    {:else}
      Ketuk lingkaran di atas kolom untuk menulis angka <b>simpanan</b>.
    {/if}
    <span class="sub">🔊 Ketuk bilangan untuk mendengar bacaannya.</span>
  </p>
{/if}

<div class="play">
  <div class="board" style="--cols:{cols}; --rows:{rowUnits}; grid-template-columns: repeat({cols + 1}, var(--cell))">
    <!-- baris simpan / pinjam -->
    <div></div>
    {#each positions as p}
      {@const k = `c${p}`}
      <div class="helper" class:hl={hl === p}>
        {#if helper.type === 'cycle' && p >= 1}
          <button
            class="bubble"
            class:on={board.vals[k]}
            class:nudge-ring={board.nudgeKeys.includes(k)}
            onclick={() => board.cycle(k, helper.max)}
            aria-label="Simpan angka di kolom ini"
          >
            {board.vals[k] ?? ''}
          </button>
        {:else if helper.type === 'type' && p >= 1}
          <button
            class="bubble"
            class:on={board.vals[k]}
            class:active={board.cursor === k}
            class:nudge-ring={board.nudgeKeys.includes(k)}
            onclick={() => board.select(k)}
            aria-label="Tulis angka simpanan"
          >
            {board.vals[k] ?? ''}
          </button>
        {:else if helper.type === 'lend' && p >= 1 && p < top.length}
          <button
            class="bubble lend"
            class:on={lent(p)}
            class:nudge-ring={board.nudgeKeys.includes(`l${p}`)}
            onclick={() => toggleLend(p)}
            aria-label="Pinjam 1 dari angka ini"
          >
            {lent(p) ? effective(p) : ''}
          </button>
        {/if}
      </div>
    {/each}

    <!-- bilangan-bilangan -->
    {#each numbers as row, r}
      <div class="op">{r === numbers.length - 1 ? model.sign : ''}</div>
      {#each positions as p}
        <div class="digit" class:hl={hl === p}>
          {#if row[p] !== undefined}
            <button class="num" onclick={() => speak(values[r])} aria-label="Dengarkan {values[r]}">
              {#if helper.type === 'lend' && r === 0}
                <span class="top" class:struck={lent(p)}>
                  {#if received(p) && !lent(p)}<span class="ten">1</span>{/if}{row[p]}
                </span>
              {:else}
                {row[p]}
              {/if}
            </button>
          {/if}
        </div>
      {/each}
    {/each}

    <!-- baris jawaban -->
    {#each rows as row}
      {#if row.lineBefore}<div class="line"></div>{/if}
      <div class="op">{row.sign ?? ''}</div>
      {#each positions as p}
        {@const k = `a${row.r}_${p}`}
        {#if row.fixed[p] !== undefined}
          <div class="digit fixed" class:hl={hl === p}>{row.fixed[p]}</div>
        {:else if p >= row.from && p <= row.to}
          {#key board.marks[k] === 'bad' ? board.shake : 0}
            <button
              class="cell"
              class:hl={hl === p}
              class:focus={board.help?.key === k}
              class:active={board.cursor === k && !board.locked}
              class:filled={board.vals[k] != null}
              class:ok={board.marks[k] === 'ok' && board.vals[k] != null}
              class:bad={board.marks[k] === 'bad'}
              onclick={() => board.select(k)}
              aria-label="Kotak jawaban"
            >
              {board.vals[k] ?? ''}
            </button>
          {/key}
        {:else}
          <div></div>
        {/if}
      {/each}
    {/each}
  </div>

  <div class="side">
    <HelpBar {board} />
    <p class="msg {board.message.kind}" aria-live="polite">{board.message.text}</p>
    <Keypad
      oninput={(d) => board.input(d)}
      onerase={() => board.erase()}
      oncheck={() => board.check()}
      canCheck={board.canCheck}
      disabled={board.locked}
    />
  </div>
</div>

<style>
  .sub {
    display: block;
    font-size: 0.9em;
  }

  .play {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px 40px;
    margin: 14px 0 8px;
  }

  .side {
    display: grid;
    gap: 6px;
    justify-items: center;
    width: min(100%, 420px);
  }

  .board {
    --reserve: 520px;
    --cell: clamp(
      30px,
      min(
        calc((100vw - 60px - var(--cols) * 6px) / (var(--cols) + 1)),
        calc((100dvh - var(--reserve)) / var(--rows))
      ),
      80px
    );
    display: grid;
    column-gap: 6px;
    padding: 12px 18px 16px 8px;
    border-radius: var(--radius);
    background-color: var(--card);
    background-image:
      linear-gradient(var(--grid) 2px, transparent 2px), linear-gradient(90deg, var(--grid) 2px, transparent 2px);
    background-size: 28px 28px;
    box-shadow: var(--shadow);
    font-variant-numeric: tabular-nums;
    max-width: 100%;
  }

  @media (min-width: 820px) {
    .board {
      --reserve: 230px;
      --cell: clamp(40px, calc((100dvh - var(--reserve)) / var(--rows)), 84px);
    }
  }

  .helper,
  .digit,
  .op {
    display: grid;
    place-items: center;
    border-radius: 10px;
  }

  .hl {
    background: rgba(255, 183, 3, 0.18);
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

  .num {
    width: 100%;
    height: 100%;
    font-size: inherit;
    font-weight: inherit;
  }

  .fixed {
    color: var(--faint);
  }

  .op {
    color: var(--coral);
  }

  .bubble {
    width: calc(var(--cell) * 0.72);
    height: calc(var(--cell) * 0.72);
    border-radius: 50%;
    border: 3px dashed var(--dash);
    background: var(--cell-bg);
    color: #fff;
    font-size: calc(var(--cell) * 0.42);
    font-weight: 700;
    transition: transform 0.12s;
  }

  .bubble:hover {
    border-color: var(--pink);
  }

  .bubble.on {
    border: 3px solid var(--pink);
    background: var(--pink);
    animation: pop 0.25s ease-out;
  }

  .bubble.active {
    border: 3px solid var(--sun);
    box-shadow: 0 0 0 4px rgba(255, 183, 3, 0.3);
    background: var(--active-bg);
    color: var(--pink);
  }

  .bubble.lend.on {
    border-color: var(--sky);
    background: var(--sky);
  }

  .top {
    position: relative;
  }

  .top.struck {
    color: var(--faint);
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
    height: 5px;
    margin: calc(var(--cell) * 0.1) 0 calc(var(--cell) * 0.15);
    border-radius: 3px;
    background: var(--ink);
  }

  .cell {
    width: var(--cell);
    height: var(--cell);
    margin-bottom: calc(var(--cell) * 0.05);
    border-radius: calc(var(--cell) * 0.22);
    border: 3px dashed var(--dash);
    background: var(--cell-bg);
    font-size: calc(var(--cell) * 0.72);
    font-weight: 600;
    line-height: 1;
  }

  .cell.hl {
    background: var(--hl-bg);
  }

  .cell.filled {
    border-style: solid;
  }

  .cell.active {
    border: 4px solid var(--sun);
    background: var(--active-bg);
    box-shadow: 0 0 0 5px rgba(255, 183, 3, 0.25);
    animation: bob 1.2s ease-in-out infinite;
  }

  .cell.focus {
    border-color: var(--grape);
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
</style>
