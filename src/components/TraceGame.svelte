<script>
  import { untrack, onMount, onDestroy } from 'svelte';
  import { genTrace } from '../lib/generate.js';
  import { DIGIT_STROKES } from '../lib/digits.js';
  import { LETTER_STROKES, LETTER_LINES, letterName } from '../lib/letters.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const value = genTrace(level);
  const isNumber = /^\d+$/.test(value);
  const glyphs = [...value].map((ch) => (isNumber ? { w: 100, s: DIGIT_STROKES[ch] } : LETTER_STROKES[ch]));
  const lefts = glyphs.map((_, k) => glyphs.slice(0, k).reduce((x, g) => x + g.w, 0));
  const width = lefts.at(-1) + glyphs.at(-1).w;
  const strokes = glyphs.flatMap((g, k) => g.s.map((path) => ({ path, dx: lefts[k] })));
  const height = isNumber ? 140 : LETTER_LINES.height;
  // huruf sempit (i, l) diberi ruang kiri-kanan supaya garis buku tulisnya tetap terlihat
  const pad = isNumber ? 0 : Math.max(10, (150 - width) / 2);

  const what = isNumber
    ? { text: `angka ${value}`, spoken: `angka ${value}` }
    : level.pairs
      ? { text: `huruf ${value[0]} dan ${value[1]}`, spoken: `huruf ${letterName(value[1])} besar dan ${letterName(value[1])} kecil` }
      : value.length > 1
        ? { text: `kata ${value}`, spoken: `kata ${value}` }
        : { text: `huruf ${value}`, spoken: `huruf ${letterName(value)}` };

  const STEP = 5; // jarak antar titik periksa
  const NEAR = 16; // jari dianggap menyentuh titik periksa
  const OFF = 28; // jari dianggap keluar jalur

  let svg = $state();
  const pathEls = [];
  let cps = $state([]); // titik periksa tiap goresan
  let cur = $state(0); // goresan yang sedang ditulis
  let prog = $state(0); // banyak titik periksa yang sudah dilewati
  let solved = $state(false);
  let demo = $state(0); // > 0 = animasi contoh sedang diputar
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;
  let pressed = false;
  let engaged = false;
  let last = null;

  onMount(() => {
    cps = pathEls.map((el, i) => {
      const len = el.getTotalLength();
      const n = Math.max(2, Math.round(len / STEP));
      return Array.from({ length: n + 1 }, (_, j) => {
        const p = el.getPointAtLength((len * j) / n);
        return [p.x + strokes[i].dx, p.y];
      });
    });
    showDemo();
  });

  let demoTimer;
  function showDemo() {
    clearTimeout(demoTimer);
    demo++;
    demoTimer = setTimeout(() => (demo = 0), strokes.length * 1300 + 400);
  }
  onDestroy(() => clearTimeout(demoTimer));

  const frac = (i) => {
    if (i < cur || solved) return 1;
    if (i > cur || !cps[i]) return 0;
    return Math.max(0, prog - 1) / (cps[i].length - 1);
  };
  const angle = (pts) => {
    const q = pts[Math.min(3, pts.length - 1)];
    return (Math.atan2(q[1] - pts[0][1], q[0] - pts[0][0]) * 180) / Math.PI;
  };
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  function toSvg(e) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  function down(e) {
    if (solved || !cps.length) return;
    svg.setPointerCapture(e.pointerId);
    demo = 0;
    pressed = true;
    engaged = false;
    last = toSvg(e);
    track(last);
  }

  function moveTo(e) {
    if (!pressed) return;
    const p = toSvg(e);
    // jari yang bergerak cepat bisa melompati titik periksa, jadi isi celahnya
    const n = Math.ceil(dist(last, p) / 4);
    for (let k = 1; k <= n && pressed; k++) track([last[0] + ((p[0] - last[0]) * k) / n, last[1] + ((p[1] - last[1]) * k) / n]);
    last = p;
  }

  function lift() {
    pressed = false;
    engaged = false;
  }

  function track(p) {
    if (solved) return;
    const pts = cps[cur];
    for (let j = Math.min(prog + 5, pts.length - 1); j >= prog; j--) {
      if (dist(p, pts[j]) < NEAR) {
        prog = j + 1;
        engaged = true;
        message = { text: '', kind: '' };
        break;
      }
    }
    if (prog >= pts.length) return finishStroke();
    if (!engaged) return;
    let nearest = Infinity;
    for (let j = Math.max(0, prog - 8); j <= Math.min(pts.length - 1, prog + 5); j++) nearest = Math.min(nearest, dist(p, pts[j]));
    if (nearest > OFF) {
      attempts++;
      shake++;
      prog = 0;
      engaged = false;
      pressed = false;
      message = { text: 'Ups, keluar jalur. Mulai lagi dari titik hijau, ya! 💪', kind: 'bad' };
      play('wrong');
    }
  }

  function finishStroke() {
    engaged = false;
    prog = 0;
    if (cur + 1 < strokes.length) {
      cur++;
      play('pop');
      message = { text: 'Bagus! Sekarang goresan berikutnya dari titik hijau.', kind: 'nudge' };
      return;
    }
    solved = true;
    pressed = false;
    message = { text: `Hebat, kamu menulis ${what.text}!`, kind: 'ok' };
    play('correct');
    say(`Hebat, kamu menulis ${what.spoken}!`);
    props.onSolved(attempts === 0);
  }

  function restart() {
    cur = 0;
    prog = 0;
    message = { text: '', kind: '' };
    play('tap');
  }
</script>

<AskBar text="Ayo tulis {what.text}!" spoken="Ayo tulis {what.spoken}!" />
<p class="hint">Mulai dari titik hijau, lalu ikuti jalurnya dengan jari.</p>

{#key shake}
  <div class="board" class:bad={shake > 0 && !solved}>
    <svg
      bind:this={svg}
      viewBox="{-pad} 0 {width + 2 * pad} {height}"
      class:wide={value.length > 1}
      class:letters={!isNumber}
      onpointerdown={down}
      onpointermove={moveTo}
      onpointerup={lift}
      onpointercancel={lift}
      role="img"
      aria-label="Jalur {what.text}"
    >
      {#if !isNumber}
        {#each ['top', 'mid', 'base', 'low'] as k}
          <line x1={-pad} x2={width + pad} y1={LETTER_LINES[k]} y2={LETTER_LINES[k]} class="rule {k}" />
        {/each}
      {/if}
      {#each strokes as s, i}
        <g transform="translate({s.dx} 0)">
          <path d={s.path} class="road" class:faint={level.guide === 'faint'} bind:this={pathEls[i]} />
          {#if level.guide === 'dots' && !solved}<path d={s.path} class="dots" />{/if}
          {#if frac(i) > 0}
            <path d={s.path} class="ink" class:done={solved} pathLength="1" stroke-dasharray="{frac(i)} 2" />
          {/if}
          {#if demo && !solved}
            {#key demo}
              <path d={s.path} class="demo" pathLength="1" style="animation-delay:{i * 1.3}s" />
            {/key}
          {/if}
        </g>
      {/each}

      {#if !solved && cps[cur]}
        {@const pts = cps[cur]}
        {#if prog === 0}
          <g transform="translate({pts[0][0]} {pts[0][1]}) rotate({angle(pts)})">
            <path d="M14 -7 L24 0 L14 7" class="arrow" />
          </g>
          <circle cx={pts[0][0]} cy={pts[0][1]} r="9" class="start" />
        {:else}
          <circle cx={pts[Math.min(prog, pts.length - 1)][0]} cy={pts[Math.min(prog, pts.length - 1)][1]} r="7" class="next" />
        {/if}
      {/if}
    </svg>
  </div>
{/key}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

{#if !solved}
  <div class="center">
    <button class="btn light small" onclick={showDemo}>👀 Lihat cara</button>
    <button class="btn light small" onclick={restart}>↺ Ulang</button>
  </div>
{/if}

<style>
  .board {
    display: flex;
    justify-content: center;
    max-width: 520px;
    margin: 12px auto;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .board.bad {
    animation: shake 0.4s;
  }

  svg {
    display: block;
    height: min(48vh, 340px);
    max-width: 100%;
    overflow: visible;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  svg.wide {
    width: 100%;
    height: auto;
    max-height: min(48vh, 340px);
  }

  .rule {
    stroke: var(--sky);
    stroke-width: 1.5;
    opacity: 0.45;
  }

  .rule.mid {
    stroke-dasharray: 6 6;
  }

  .rule.base {
    stroke: var(--coral);
    stroke-width: 2;
  }

  path {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .road {
    stroke: var(--line);
    stroke-width: 22;
  }

  .road.faint {
    opacity: 0.55;
  }

  .dots {
    stroke: var(--dash);
    stroke-width: 4;
    stroke-dasharray: 0 9;
  }

  .ink {
    stroke: var(--grape);
    stroke-width: 15;
  }

  .ink.done {
    stroke: var(--ok);
  }

  .demo {
    stroke: var(--sun);
    stroke-width: 9;
    stroke-dasharray: 1 2;
    stroke-dashoffset: 1;
    animation: draw 1.2s linear forwards;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  .start {
    fill: var(--ok);
    stroke: #fff;
    stroke-width: 3;
    animation: pulse 1s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .next {
    fill: var(--sun);
    stroke: #fff;
    stroke-width: 2.5;
    pointer-events: none;
  }

  .arrow {
    stroke: var(--ok);
    stroke-width: 4;
  }

  @keyframes pulse {
    50% {
      transform: scale(1.3);
    }
  }

  .center {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .msg {
    margin-top: 8px;
  }
</style>
