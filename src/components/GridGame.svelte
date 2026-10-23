<script>
  import { untrack } from 'svelte';
  import { genGrid, lineUnits } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const q = genGrid(untrack(() => props.level));
  const mirror = q.type === 'mirror';
  const S = 40; // jarak antar titik
  const M = 22;
  const W = (q.cols - 1) * S;
  const H = (q.rows - 1) * S;
  const targetSet = new Set(q.target);
  const dots = Array.from({ length: q.cols * q.rows }, (_, i) => [i % q.cols, Math.floor(i / q.cols)]);
  // di mode cermin, titik di sisi contoh tidak dipakai
  const active = ([x, y]) => !mirror || (q.flip ? y : x) >= q.axis;

  const ask = mirror
    ? { text: `Lengkapi ${q.name} supaya sama di kedua sisi!`, spoken: `Lengkapi ${q.name} supaya sama di kedua sisi` }
    : { text: `Salin gambar ${q.name} di kotak titik!`, spoken: `Salin gambar ${q.name} di kotak titik` };

  let svg = $state();
  let mine = $state([]);
  let sel = $state(null);
  let cursor = $state(null);
  let flash = $state(null);
  let hint = $state(null);
  let solved = $state(false);
  let attempts = $state(0);
  let message = $state({ text: '', kind: '' });
  let dragging = false;
  let flashTimer;

  const seg = (k) => k.split(',').map((v) => Number(v) * S);

  function toGrid(e) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  function dotAt(e) {
    const [px, py] = toGrid(e);
    const x = Math.round(px / S);
    const y = Math.round(py / S);
    if (x < 0 || y < 0 || x >= q.cols || y >= q.rows) return null;
    if (Math.hypot(px - x * S, py - y * S) > S * 0.45) return null;
    return [x, y];
  }

  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

  function down(e) {
    if (solved) return;
    const d = dotAt(e);
    if (!d) {
      sel = null;
      return;
    }
    if (!active(d)) {
      message = { text: `Gambar di sisi ${q.flip ? 'bawah' : 'kanan'} garis cermin, ya.`, kind: 'nudge' };
      return;
    }
    svg.setPointerCapture(e.pointerId);
    if (sel && !same(sel, d)) {
      connect(sel, d);
      sel = null;
      return;
    }
    sel = d;
    dragging = true;
    cursor = toGrid(e);
  }

  function move(e) {
    if (dragging) cursor = toGrid(e);
  }

  function up(e) {
    if (!dragging) return;
    dragging = false;
    cursor = null;
    const d = dotAt(e);
    if (d && active(d) && !same(d, sel)) {
      connect(sel, d);
      sel = null;
    }
  }

  function connect(a, b) {
    const units = lineUnits(a, b);
    if (!units) {
      message = { text: 'Garisnya harus lurus: mendatar, tegak, atau miring.', kind: 'nudge' };
      return;
    }
    if (units.every((u) => mine.includes(u))) return;
    if (units.some((u) => !targetSet.has(u))) {
      attempts++;
      flash = [a, b];
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => (flash = null), 600);
      message = {
        text: mirror ? 'Ups, garis itu bukan pantulannya. Lihat sisi seberangnya, ya!' : 'Ups, garis itu tidak ada di contoh. Coba lihat lagi, ya!',
        kind: 'bad',
      };
      play('wrong');
      return;
    }
    mine = [...mine, ...units.filter((u) => !mine.includes(u))];
    hint = null;
    message = { text: '', kind: '' };
    if (mine.length < q.target.length) return play('pop');
    solved = true;
    const text = mirror ? 'Hebat, gambarnya sudah sama di kedua sisi!' : 'Hebat, gambarnya sudah sama dengan contoh!';
    message = { text, kind: 'ok' };
    play('correct');
    say(text);
    props.onSolved(attempts === 0);
  }

  function showHint() {
    hint = q.target.find((u) => !mine.includes(u));
    play('tap');
  }
</script>

<AskBar text={ask.text} spoken={ask.spoken} />
<p class="hint">
  {mirror
    ? `Bayangkan ada cermin di garis putus-putus. Gambar pantulannya di sebelah ${q.flip ? 'bawah' : 'kanan'}.`
    : 'Tarik garis dari titik ke titik, atau ketuk dua titik, supaya sama dengan contoh.'}
</p>

<div class="pair" class:mirror>
  {#if !mirror}
    <figure class="board example">
      <figcaption>Contoh</figcaption>
      <svg viewBox="{-M} {-M} {W + 2 * M} {H + 2 * M}" role="img" aria-label="Contoh gambar {q.name}">
        {#each dots as [x, y]}<circle cx={x * S} cy={y * S} r="4" class="pin faded" />{/each}
        {#each q.example as k}
          {@const [x1, y1, x2, y2] = seg(k)}
          <line {x1} {y1} {x2} {y2} class="given" />
        {/each}
      </svg>
    </figure>
  {/if}

  <figure class="board work">
    {#if !mirror}<figcaption>Gambarmu</figcaption>{/if}
    <svg
      bind:this={svg}
      viewBox="{-M} {-M} {W + 2 * M} {H + 2 * M}"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={() => ((dragging = false), (cursor = null))}
      role="img"
      aria-label="Kotak titik untuk menggambar"
    >
      {#if mirror}
        {#if q.flip}
          <line x1={-M} x2={W + M} y1={q.axis * S} y2={q.axis * S} class="axis" />
        {:else}
          <line y1={-M} y2={H + M} x1={q.axis * S} x2={q.axis * S} class="axis" />
        {/if}
        {#each q.given as k}
          {@const [x1, y1, x2, y2] = seg(k)}
          <line {x1} {y1} {x2} {y2} class="given" />
        {/each}
      {/if}
      {#if hint}
        {@const [x1, y1, x2, y2] = seg(hint)}
        <line {x1} {y1} {x2} {y2} class="hintline" />
      {/if}
      {#each mine as k}
        {@const [x1, y1, x2, y2] = seg(k)}
        <line {x1} {y1} {x2} {y2} class="mine" class:done={solved} />
      {/each}
      {#if flash}
        <line x1={flash[0][0] * S} y1={flash[0][1] * S} x2={flash[1][0] * S} y2={flash[1][1] * S} class="flash" />
      {/if}
      {#if sel && cursor}
        <line x1={sel[0] * S} y1={sel[1] * S} x2={cursor[0]} y2={cursor[1]} class="rubber" />
      {/if}
      {#each dots as d}
        <circle cx={d[0] * S} cy={d[1] * S} r={same(d, sel) ? 9 : 5} class="pin" class:faded={!active(d)} class:sel={same(d, sel)} />
      {/each}
    </svg>
  </figure>
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

{#if !solved && attempts >= 2}
  <div class="center">
    <button class="btn light small" onclick={showHint}>💡 Petunjuk</button>
  </div>
{/if}

<style>
  .pair {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 10px;
    margin: 10px auto 4px;
    max-width: 640px;
  }

  .board {
    margin: 0;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    text-align: center;
  }

  .example {
    flex: 0 1 38%;
  }

  .work {
    flex: 0 1 60%;
  }

  .mirror .work {
    flex-basis: min(100%, 420px);
  }

  figcaption {
    color: var(--muted);
    font-weight: 600;
    font-size: 0.95rem;
  }

  svg {
    display: block;
    width: 100%;
    max-height: min(50vh, 420px);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  line {
    stroke-linecap: round;
  }

  .given {
    stroke: var(--ink);
    stroke-width: 6;
  }

  .mine {
    stroke: var(--grape);
    stroke-width: 6;
  }

  .mine.done {
    stroke: var(--ok);
  }

  .flash {
    stroke: var(--bad);
    stroke-width: 6;
    animation: fade 0.6s reverse;
  }

  .rubber {
    stroke: var(--grape);
    stroke-width: 4;
    stroke-dasharray: 6 6;
    opacity: 0.7;
  }

  .hintline {
    stroke: var(--sun);
    stroke-width: 8;
    stroke-dasharray: 4 8;
  }

  .axis {
    stroke: var(--coral);
    stroke-width: 3;
    stroke-dasharray: 8 8;
  }

  .pin {
    fill: var(--muted);
    pointer-events: none;
  }

  .pin.faded {
    opacity: 0.35;
  }

  .pin.sel {
    fill: var(--grape);
  }

  .center {
    display: flex;
    justify-content: center;
  }
</style>
