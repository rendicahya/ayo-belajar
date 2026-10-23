<script>
  import { untrack } from 'svelte';
  import { genDots } from '../lib/generate.js';
  import { letterName } from '../lib/letters.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const { pic, type, labels } = genDots(untrack(() => props.level));
  const n = pic.pts.length;
  const last = labels.at(-1);
  const spoken = (l) => (type === 'abc' ? letterName(l) : l);

  // label diletakkan sedikit di luar gambar, menjauhi titik tengahnya
  const cx = pic.pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pic.pts.reduce((s, p) => s + p[1], 0) / n;
  const tags = pic.pts.map(([x, y]) => {
    const len = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / len) * 15, y + ((y - cy) / len) * 15];
  });

  const ask =
    type === 'abc'
      ? { text: `Hubungkan huruf A sampai ${last}!`, spoken: `Hubungkan huruf a sampai ${letterName(last)}` }
      : type === 'skip'
        ? { text: `Hubungkan titik, lompat dua: 2, 4, 6 … ${last}!`, spoken: `Hubungkan titik, lompat dua. 2, 4, 6, sampai ${last}` }
        : { text: `Hubungkan titik dari 1 sampai ${last}!`, spoken: `Hubungkan titik dari 1 sampai ${last}` };

  let k = $state(0); // banyak titik yang sudah tersambung
  let bad = $state(-1);
  let misses = $state(0);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let badTimer;

  let svg = $state();
  // ketukan memilih titik terdekat, supaya titik yang berdekatan tidak saling menutupi
  function nearest(e) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    let best = -1;
    let bestD = 22;
    pic.pts.forEach(([x, y], i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) [best, bestD] = [i, d];
    });
    if (best >= 0) tap(best);
  }

  const path = $derived(pic.pts.slice(0, k).map(([x, y]) => `${x},${y}`).join(' '));

  function tap(i) {
    if (solved) return;
    if (i !== k) {
      if (i < k) return; // titik yang sudah tersambung, abaikan
      misses++;
      bad = i;
      clearTimeout(badTimer);
      badTimer = setTimeout(() => (bad = -1), 500);
      const L = labels[k];
      const P = labels[k - 1];
      const unit = type === 'abc' ? 'huruf' : 'angka';
      const text =
        k === 0
          ? `Mulai dari ${unit} ${L}, ya!`
          : type === 'skip'
            ? `Lompat dua dari ${P} adalah ${L}. Cari angka ${L}!`
            : `Sesudah ${P} adalah ${L}. Cari ${unit} ${L}!`;
      message = { text, kind: 'bad' };
      play('wrong');
      return;
    }
    k++;
    message = { text: '', kind: '' };
    say(spoken(labels[i]));
    if (k < n) return play('pop');
    solved = true;
    message = { text: `Wah, jadi ${pic.name}! ${pic.emoji}`, kind: 'ok' };
    play('correct');
    setTimeout(() => say(`Wah, jadi ${pic.name}!`), 500);
    props.onSolved(misses === 0);
  }
</script>

<AskBar text={ask.text} spoken={ask.spoken} />
<p class="hint">Ketuk titiknya satu per satu sesuai urutan. Gambar apa yang muncul, ya?</p>

<div class="board">
  <svg bind:this={svg} viewBox="-26 -26 252 252" role="img" aria-label="Titik-titik gambar rahasia" onpointerdown={nearest}>
    {#if solved}
      <polygon points={pic.pts.map((p) => p.join(',')).join(' ')} class="shape" style="fill:{pic.color}" />
    {:else if k > 1}
      <polyline points={path} class="link" />
    {/if}
    {#each pic.pts as [x, y], i}
      {@const on = i < k}
      {@const hinted = !solved && i === k && (k === 0 || misses >= 2)}
      <g
        class="dot"
        class:on
        class:bad={bad === i}
        class:hinted
        role="button"
        tabindex="-1"
        aria-label={labels[i]}
        onkeydown={(e) => e.key === 'Enter' && tap(i)}
      >
        <circle cx={x} cy={y} r={hinted ? 8 : 6} class="pin" />
        <text x={tags[i][0]} y={tags[i][1]} class="tag">{labels[i]}</text>
      </g>
    {/each}
  </svg>
  {#if solved}<span class="reveal" aria-hidden="true">{pic.emoji}</span>{/if}
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .board {
    position: relative;
    display: flex;
    justify-content: center;
    max-width: 440px;
    margin: 10px auto 4px;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  svg {
    display: block;
    width: 100%;
    max-height: min(52vh, 420px);
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }

  .link {
    fill: none;
    stroke: var(--grape);
    stroke-width: 5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .shape {
    stroke: var(--ink);
    stroke-width: 5;
    stroke-linejoin: round;
    animation: fade 0.5s ease-out;
  }

  .dot {
    cursor: pointer;
    outline: none;
  }

  .pin {
    fill: var(--ink);
    transition: r 0.15s;
  }

  .dot.on .pin {
    fill: var(--grape);
  }

  .dot.hinted .pin {
    fill: var(--ok);
    animation: pulse 1s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .dot.bad .pin {
    fill: var(--bad);
  }

  .tag {
    font-size: 14px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--muted);
    pointer-events: none;
  }

  .dot.on .tag {
    fill: var(--grape);
  }

  @keyframes pulse {
    50% {
      transform: scale(1.4);
    }
  }

  .reveal {
    position: absolute;
    right: 14px;
    top: 10px;
    font-size: 3rem;
    animation: pop 0.5s ease-out;
  }
</style>
