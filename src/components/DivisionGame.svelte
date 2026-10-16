<script>
  import { untrack } from 'svelte';
  import { genDivision } from '../lib/generate.js';
  import { buildDivision } from '../lib/board.js';
  import { BoardState } from '../lib/boardState.svelte.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';
  import HelpBar from './HelpBar.svelte';

  let props = $props();

  const { level, given, compact } = untrack(() => ({
    level: props.level,
    given: props.problem,
    compact: props.compact,
  }));
  const problem = given ?? genDivision(level);
  const model = buildDivision(problem.dividend, problem.divisor);
  const { digits, divisor } = model;
  const board = new BoardState(model, (firstTry, info) => props.onSolved(firstTry, info));
  const n = digits.length;

  const hl = $derived(board.help?.col);

  function onkeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) board.input(Number(e.key));
    else if (e.key === 'Backspace' || e.key === 'Delete') board.erase();
    else if (e.key === 'Enter') board.playing ? board.nextStep() : board.check();
    else if (e.key === 'ArrowLeft') board.moveCursor(-1);
    else if (e.key === 'ArrowRight') board.moveCursor(1);
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if !compact}
  <p class="hint">
    Bagi mulai dari angka paling <b>kiri</b>, tulis hasilnya di atas. Kalau ada sisa, ketuk lingkaran kecil di
    depan angka berikutnya untuk menulis sisanya.
    <span class="sub">🔊 Ketuk bilangan untuk mendengar bacaannya.</span>
  </p>
{/if}

<div class="play">
  <div class="board" style="--cols:{n + 2}">
    <!-- hasil bagi -->
    <div class="row">
      <div class="divisor"></div>
      <div class="bracket-space"></div>
      {#each digits as _, i}
        {@const k = `q${i}`}
        {#key board.marks[k] === 'bad' ? board.shake : 0}
          <button
            class="cell"
            class:hl={hl === i}
            class:focus={board.help?.key === k}
            class:active={board.cursor === k && !board.locked}
            class:filled={board.vals[k] != null}
            class:ok={board.marks[k] === 'ok' && board.vals[k] != null}
            class:bad={board.marks[k] === 'bad'}
            onclick={() => board.select(k)}
            aria-label="Kotak hasil bagi"
          >
            {board.vals[k] ?? ''}
          </button>
        {/key}
      {/each}
    </div>

    <!-- pembagi ) yang dibagi -->
    <div class="row">
      <button class="divisor" onclick={() => speak(divisor)} aria-label="Dengarkan {divisor}">{divisor}</button>
      <div class="bracket" aria-hidden="true"></div>
      <div class="dividend">
      {#each digits as d, i}
        {@const k = `r${i}`}
        <div class="digit" class:hl={hl === i || hl === i - 1}>
          {#if i > 0}
            <button
              class="rem"
              class:on={board.vals[k] != null}
              class:active={board.cursor === k}
              class:nudge-ring={board.nudgeKeys.includes(k)}
              onclick={() => board.select(k)}
              aria-label="Tulis sisa"
            >
              {board.vals[k] ?? ''}
            </button>
          {/if}
          <button class="num" onclick={() => speak(problem.dividend)} aria-label="Dengarkan {problem.dividend}">{d}</button>
        </div>
      {/each}
      </div>
    </div>
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
    --cell: clamp(40px, calc((100vw - 90px) / (var(--cols) + 0.6)), 84px);
    display: grid;
    gap: 6px;
    padding: 16px 22px 20px 14px;
    border-radius: var(--radius);
    background-color: var(--card);
    background-image:
      linear-gradient(#eef3fb 2px, transparent 2px), linear-gradient(90deg, #eef3fb 2px, transparent 2px);
    background-size: 28px 28px;
    box-shadow: var(--shadow);
    font-variant-numeric: tabular-nums;
  }

  .row {
    display: flex;
    gap: 6px;
    align-items: stretch;
  }

  .divisor,
  .digit {
    display: grid;
    place-items: center;
    width: var(--cell);
    height: calc(var(--cell) * 1.15);
    font-size: calc(var(--cell) * 0.78);
    font-weight: 600;
    line-height: 1;
  }

  .divisor {
    color: var(--teal);
  }

  .bracket-space,
  .bracket {
    width: calc(var(--cell) * 0.35);
  }

  /* lengkung porogapit ")" */
  .bracket {
    border-right: 5px solid var(--ink);
    border-radius: 0 60% 60% 0 / 0 50% 50% 0;
  }

  .dividend {
    display: flex;
    gap: 6px;
    border-top: 5px solid var(--ink);
    padding-left: 6px;
    margin-left: -6px;
  }

  .digit {
    position: relative;
  }

  .hl {
    background: rgba(255, 183, 3, 0.18);
  }

  .num {
    font-size: inherit;
    font-weight: inherit;
    width: 100%;
    height: 100%;
  }

  .rem {
    position: absolute;
    left: calc(var(--cell) * -0.22);
    top: calc(var(--cell) * 0.08);
    width: calc(var(--cell) * 0.46);
    height: calc(var(--cell) * 0.46);
    border-radius: 50%;
    border: 2px dashed #c9c3dd;
    background: rgba(255, 255, 255, 0.9);
    color: #fff;
    font-size: calc(var(--cell) * 0.3);
    font-weight: 700;
    z-index: 1;
  }

  .rem.on {
    border: 2px solid var(--teal);
    background: var(--teal);
  }

  .rem.active {
    border: 3px solid var(--sun);
    background: #fff8dc;
    color: var(--teal);
    box-shadow: 0 0 0 3px rgba(255, 183, 3, 0.3);
  }

  .cell {
    width: var(--cell);
    height: var(--cell);
    border-radius: calc(var(--cell) * 0.22);
    border: 3px dashed #c9c3dd;
    background: rgba(255, 255, 255, 0.85);
    font-size: calc(var(--cell) * 0.72);
    font-weight: 600;
    line-height: 1;
  }

  .cell.hl {
    background: #fff3c4;
  }

  .cell.filled {
    border-style: solid;
  }

  .cell.active {
    border: 4px solid var(--sun);
    background: #fff8dc;
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
  }

  .cell.bad {
    border: 3px solid var(--bad);
    background: var(--bad-soft);
    color: var(--bad);
    animation: shake 0.4s;
  }
</style>
