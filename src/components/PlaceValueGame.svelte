<script>
  import { untrack } from 'svelte';
  import { genPlaceValue, digitsOf, PLACES } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, terbilang } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genPlaceValue(level);
  const { type, digits } = level;
  const ds = digitsOf(q.number); // dari satuan
  const places = Array.from({ length: digits }, (_, i) => digits - 1 - i); // posisi kiri → kanan
  const short = { 0: 'S', 1: 'P', 2: 'R', 3: 'Rb' };
  const colors = ['#f2683f', '#2fa6dc', '#5aae22', '#8f4fd9'];

  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  function finish(ok, badText) {
    if (ok) {
      solved = true;
      message = { text: '', kind: '' };
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      shake++;
      message = { text: badText, kind: 'bad' };
      play('wrong');
    }
  }

  // ---- hitung balok → ketik bilangannya ----
  let typed = $state(Array(digits).fill(null)); // kiri → kanan
  let cursor = $state(0);
  let bad = $state([]);
  const canCheck = $derived(typed.every((d) => d !== null));

  function input(d) {
    if (solved) return;
    typed[cursor] = d;
    bad = bad.filter((i) => i !== cursor);
    if (cursor < digits - 1) cursor++;
    play('tap');
  }
  function erase() {
    if (solved) return;
    if (typed[cursor] === null && cursor > 0) cursor--;
    typed[cursor] = null;
  }
  function checkCount() {
    if (solved || !canCheck) return;
    bad = places.map((p, i) => (typed[i] === ds[p] ? -1 : i)).filter((i) => i >= 0);
    finish(!bad.length, 'Hitung lagi balok yang kotaknya merah, ya! 💪');
    if (bad.length) cursor = bad[0];
  }

  // ---- susun balok sesuai bilangan ----
  let counts = $state(Array(digits).fill(0)); // per posisi dari satuan
  let badBins = $state([]);
  function change(p, delta) {
    if (solved) return;
    counts[p] = Math.max(0, Math.min(9, counts[p] + delta));
    badBins = badBins.filter((b) => b !== p);
    play(delta > 0 ? 'pop' : 'tap');
  }
  function checkBuild() {
    if (solved) return;
    badBins = places.filter((p) => counts[p] !== ds[p]);
    finish(!badBins.length, `Balok ${badBins.map((p) => PLACES[p]).join(' dan ')} belum pas. Coba lagi! 💪`);
  }

  // ---- nilai angka ----
  let wrongChoices = $state([]);
  function choose(c) {
    if (solved || wrongChoices.includes(c)) return;
    if (c !== q.answer) wrongChoices = [...wrongChoices, c];
    finish(c === q.answer, 'Belum tepat, coba lagi! Lihat letak angkanya. 💪');
  }

  function onkeydown(e) {
    if (type !== 'count' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) input(Number(e.key));
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') checkCount();
    else if (e.key === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
    else if (e.key === 'ArrowRight') cursor = Math.min(digits - 1, cursor + 1);
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#snippet blocks(p, n)}
  <div class="blocks" style="--c:{colors[p]}">
    {#each { length: n } as _}
      <span class="b{Math.min(p, 2)}"></span>
    {/each}
  </div>
{/snippet}

{#snippet legend()}
  <div class="legend">
    {#if digits >= 3}<span><i class="b2 mini" style="--c:{colors[2]}"></i> ratusan = 100</span>{/if}
    <span><i class="b1 mini" style="--c:{colors[1]}"></i> puluhan = 10</span>
    <span><i class="b0" style="--c:{colors[0]}"></i> satuan = 1</span>
  </div>
{/snippet}

{#if type === 'count'}
  <p class="hint">Hitung baloknya, lalu tulis bilangannya di kotak bawah.</p>
  {@render legend()}
  <div class="bins">
    {#each places as p}
      <div class="bin p{p}">
        <span class="label" style="color:{colors[p]}">{PLACES[p]}</span>
        {@render blocks(p, ds[p])}
      </div>
    {/each}
  </div>
  <div class="answer">
    {#each places as p, i}
      {#key bad.includes(i) ? shake : 0}
        <button
          class="cell"
          class:active={cursor === i && !solved}
          class:filled={typed[i] !== null}
          class:ok={solved}
          class:bad={bad.includes(i)}
          onclick={() => (cursor = i)}
          style="--c:{colors[p]}"
        >
          {typed[i] ?? ''}
          <small>{short[p]}</small>
        </button>
      {/key}
    {/each}
  </div>
  <p class="msg {message.kind}" aria-live="polite">{message.text}</p>
  <div class="pad"><Keypad oninput={input} onerase={erase} oncheck={checkCount} {canCheck} disabled={solved} /></div>
{:else if type === 'build'}
  <p class="hint">Susun balok sampai jumlahnya sama dengan bilangan ini. Tekan + atau −.</p>
  <button class="target" onclick={() => speak(q.number)}>{q.number}</button>
  {@render legend()}
  <div class="bins">
    {#each places as p}
      {#key badBins.includes(p) ? shake : 0}
        <div class="bin p{p}" class:bad={badBins.includes(p)} class:ok={solved}>
          <span class="label" style="color:{colors[p]}">{PLACES[p]}</span>
          {@render blocks(p, counts[p])}
          <div class="stepper">
            <button class="round" onclick={() => change(p, -1)} disabled={solved} aria-label="Kurangi {PLACES[p]}">−</button>
            <button class="round plus" style="--c:{colors[p]}" onclick={() => change(p, 1)} disabled={solved} aria-label="Tambah {PLACES[p]}">+</button>
          </div>
        </div>
      {/key}
    {/each}
  </div>
  <p class="msg {message.kind}" aria-live="polite">{message.text}</p>
  <div class="center"><button class="btn" style="--c:var(--ok)" disabled={solved} onclick={checkBuild}>✔ Cek</button></div>
{:else}
  <p class="hint">
    {#if q.ask === 'value'}
      Angka <b>{q.digit}</b> pada bilangan ini <b>bernilai</b> berapa?
    {:else}
      Angka <b>{q.digit}</b> pada bilangan ini menempati tempat apa?
    {/if}
  </p>
  <button class="target digits" onclick={() => speak(q.number)} aria-label="Dengarkan {terbilang(q.number)}">
    {#each places as p}
      <span class:pick={p === q.pos}>{ds[p]}</span>
    {/each}
  </button>
  <div class="choices">
    {#each q.choices as c}
      <button
        class="choice"
        class:wrong={wrongChoices.includes(c)}
        class:right={solved && c === q.answer}
        disabled={solved || wrongChoices.includes(c)}
        onclick={() => choose(c)}
      >
        {c}
      </button>
    {/each}
  </div>
  <p class="msg {solved ? 'ok' : message.kind}" aria-live="polite">
    {#if solved}
      Angka {q.digit} ada di tempat {PLACES[q.pos]}, jadi nilainya {q.digit * 10 ** q.pos}.
    {:else}
      {message.text}
    {/if}
  </p>
{/if}

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 16px;
    margin: 10px 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .bins {
    --u: clamp(7px, 2.1vw, 12px);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin: 10px 0 16px;
  }

  .bin {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 10px;
    flex: 1 1 140px;
    max-width: 330px;
    min-height: calc(var(--u) * 13);
    padding: 12px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid transparent;
  }

  /* ratusan butuh tempat lebar supaya baloknya berjajar */
  .bin.p2 {
    --u: clamp(5px, 1.7vw, 11px);
    flex-basis: 100%;
    max-width: 680px;
  }

  .bin.bad {
    border-color: var(--bad);
    animation: shake 0.4s;
  }

  .bin.ok {
    border-color: var(--ok);
  }

  .label {
    font-weight: 600;
    text-transform: capitalize;
  }

  .blocks {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    gap: 5px;
    min-height: calc(var(--u) * 10);
  }

  /* satuan, puluhan, ratusan */
  .b0,
  .b1,
  .b2 {
    display: inline-block;
    background: var(--c);
    border-radius: 3px;
    box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.18);
  }

  .b0 {
    width: var(--u, 12px);
    height: var(--u, 12px);
  }

  .b1 {
    width: var(--u);
    height: calc(var(--u) * 10);
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--u) - 1px),
      rgba(0, 0, 0, 0.22) calc(var(--u) - 1px) var(--u)
    );
  }

  .b2 {
    width: calc(var(--u) * 10);
    height: calc(var(--u) * 10);
    background-image:
      repeating-linear-gradient(to bottom, transparent 0 calc(var(--u) - 1px), rgba(0, 0, 0, 0.2) calc(var(--u) - 1px) var(--u)),
      repeating-linear-gradient(to right, transparent 0 calc(var(--u) - 1px), rgba(0, 0, 0, 0.2) calc(var(--u) - 1px) var(--u));
  }

  .mini {
    --u: 3px;
  }

  .b1.mini {
    height: 22px;
    width: 6px;
  }

  .b2.mini {
    width: 20px;
    height: 20px;
  }

  .answer {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .cell {
    position: relative;
    width: clamp(56px, 17vw, 76px);
    height: clamp(64px, 19vw, 84px);
    border-radius: 18px;
    border: 3px dashed var(--c);
    background: var(--card);
    font-size: 2.6rem;
    font-weight: 600;
    line-height: 1;
  }

  .cell small {
    position: absolute;
    bottom: 3px;
    left: 0;
    right: 0;
    font-size: 0.8rem;
    color: var(--c);
  }

  .cell.filled {
    border-style: solid;
  }

  .cell.active {
    border: 4px solid var(--sun);
    background: #fff8dc;
    animation: bob 1.2s ease-in-out infinite;
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

  .pad,
  .center {
    display: flex;
    justify-content: center;
  }

  .stepper {
    display: flex;
    gap: 12px;
  }

  .round {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--card);
    border: 3px solid var(--line);
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 4px 0 var(--line);
  }

  .round.plus {
    background: var(--c);
    border-color: var(--c);
    color: #fff;
  }

  .round:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--line);
  }

  .target {
    display: block;
    margin: 14px auto;
    padding: 10px 28px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(3rem, 14vw, 5rem);
    font-weight: 700;
    color: var(--orange);
    line-height: 1.1;
  }

  .digits {
    display: flex;
    gap: 4px;
  }

  .digits span {
    padding: 0 6px;
    border-radius: 14px;
  }

  .digits .pick {
    background: var(--sun);
    color: var(--ink);
    animation: bob 1.4s ease-in-out infinite;
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    max-width: 560px;
    margin: 0 auto;
  }

  .choice {
    padding: 16px 8px;
    border-radius: var(--radius);
    background: var(--orange);
    color: #fff;
    font-size: 1.6rem;
    font-weight: 600;
    text-transform: capitalize;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .choice:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .choice.wrong {
    opacity: 0.3;
  }

  .choice.right {
    background: var(--ok);
  }

  .msg {
    margin: 12px 0;
  }
</style>
