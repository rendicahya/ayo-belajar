<script>
  import { untrack } from 'svelte';
  import { genLongDivision } from '../lib/generate.js';
  import { buildLongDivision } from '../lib/board.js';
  import { BoardState } from '../lib/boardState.svelte.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';
  import HelpBar from './HelpBar.svelte';

  let props = $props();

  const level = untrack(() => props.level);
  const problem = genLongDivision(level);
  const model = buildLongDivision(problem.dividend, problem.divisor);
  const { digits, divisor, lines, qFrom } = model;
  const board = new BoardState(model, (firstTry, info) => props.onSolved(firstTry, info));
  const n = digits.length;
  const dlen = String(divisor).length;
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  // kolom grid (mulai 1): pembagi, lengkung, angka-angka yang dibagi, label sisa
  const gc = (i) => dlen + 2 + i;
  const rowUnits = 2.2 + lines.length * 1.15;

  const hl = $derived(board.help?.col);

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

<p class="hint">
  Ulangi 4 langkah: <b>bagi</b> (tulis di atas), <b>kali</b>, <b>kurangkan</b>, lalu <b>turunkan</b> angka berikutnya.
  <span class="sub">🔊 Ketuk bilangan untuk mendengar bacaannya.</span>
</p>

{#snippet cell(k, col, row)}
  {#key board.marks[k] === 'bad' ? board.shake : 0}
    <button
      class="cell"
      style="grid-row:{row}; grid-column:{gc(col)}"
      class:hl={hl === col}
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
{/snippet}

<div class="play">
  <div
    class="board"
    style="--cols:{dlen + n + 1.6}; --rows:{rowUnits}; grid-template-columns: repeat({dlen}, var(--cell)) calc(var(--cell) * 0.4) repeat({n}, var(--cell)) auto"
  >
    <!-- hasil bagi -->
    {#each range(qFrom, n - 1) as i}
      {@render cell(`q${i}`, i, 1)}
    {/each}

    <!-- pembagi ) yang dibagi -->
    <button class="divisor" style="grid-row:2; grid-column:1 / span {dlen}" onclick={() => speak(divisor)} aria-label="Dengarkan {divisor}">
      {divisor}
    </button>
    <div class="bracket" style="grid-row:2; grid-column:{dlen + 1}" aria-hidden="true"></div>
    <div class="overline" style="grid-row:2; grid-column:{gc(0)} / {gc(n)}" aria-hidden="true"></div>
    {#each digits as d, i}
      <button
        class="digit"
        class:hl={hl === i}
        style="grid-row:2; grid-column:{gc(i)}"
        onclick={() => speak(problem.dividend)}
        aria-label="Dengarkan {problem.dividend}"
      >
        {d}
      </button>
    {/each}

    <!-- baris kerja -->
    {#each lines as l, j}
      {@const row = j + 3}
      {#if l.kind === 'prod'}
        <div class="sign" style="grid-row:{row}; grid-column:{gc(l.from) - 1}">−</div>
        <div class="under" style="grid-row:{row}; grid-column:{gc(l.from) - 1} / {gc(l.to) + 1}" aria-hidden="true"></div>
      {/if}
      {#each l.keys as k}
        {@render cell(k, l.cells[k].pos, row)}
      {/each}
      {#if j === lines.length - 1}
        <div class="label" style="grid-row:{row}; grid-column:{gc(n)}">← sisa</div>
      {/if}
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
      28px,
      min(
        calc((100vw - 70px - var(--cols) * 6px) / var(--cols)),
        calc((100dvh - var(--reserve)) / var(--rows))
      ),
      72px
    );
    display: grid;
    column-gap: 6px;
    row-gap: calc(var(--cell) * 0.15);
    align-items: center;
    padding: 14px 14px 16px 10px;
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
      --cell: clamp(36px, calc((100dvh - var(--reserve)) / var(--rows)), 72px);
    }
  }

  .divisor,
  .digit,
  .sign {
    display: grid;
    place-items: center;
    height: calc(var(--cell) * 1.1);
    font-size: calc(var(--cell) * 0.78);
    font-weight: 600;
    line-height: 1;
    border-radius: 10px;
  }

  .divisor {
    color: var(--indigo);
    justify-self: end;
    padding-right: 4px;
    letter-spacing: 0.08em;
  }

  .digit {
    z-index: 1;
  }

  .sign {
    height: var(--cell);
    color: var(--coral);
    justify-self: end;
  }

  .bracket {
    align-self: stretch;
    border-right: 5px solid var(--ink);
    border-radius: 0 60% 60% 0 / 0 50% 50% 0;
  }

  .overline {
    align-self: start;
    height: 5px;
    margin-left: -6px;
    border-radius: 3px;
    background: var(--ink);
  }

  .under {
    align-self: end;
    height: 4px;
    border-radius: 2px;
    background: var(--ink);
    transform: translateY(calc(var(--cell) * 0.1));
  }

  .label {
    padding-left: 6px;
    color: var(--muted);
    font-size: calc(var(--cell) * 0.32);
    font-weight: 600;
    white-space: nowrap;
  }

  .hl {
    background: rgba(255, 183, 3, 0.18);
  }

  .cell {
    width: var(--cell);
    height: var(--cell);
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
