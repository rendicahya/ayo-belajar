<script>
  import { untrack } from 'svelte';
  import { genJump } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, terbilang } from '../lib/speech.js';
  import { settings } from '../lib/settings.svelte.js';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genJump(level);
  const { start, hop, count, dir, max, tick } = q;

  // koordinat SVG
  const W = 1000;
  const PAD = 40;
  const Y = 170;
  const H = 235;
  const x = (v) => PAD + (v / max) * (W - 2 * PAD);
  const ticks = Array.from({ length: max / tick + 1 }, (_, i) => i * tick);
  const labelSize = max / tick > 12 ? 30 : 38;
  // garis 0–20 dengan lompatan 1: label "+1" terlalu rapat, cukup nomor lompatannya
  const crowded = max / tick > 12 && hop === tick;

  let done = $state(0);
  let wrong = $state([]);
  let solved = $state(false);
  let shake = $state(0);
  let attempts = 0;

  const pos = $derived(start + dir * hop * done);
  const arcs = $derived(
    Array.from({ length: done }, (_, i) => {
      const a = x(start + dir * hop * i);
      const b = x(start + dir * hop * (i + 1));
      const h = Math.min(120, 60 + Math.abs(b - a) * 0.5);
      return { d: `M ${a} ${Y - 6} Q ${(a + b) / 2} ${Y - h * 1.6} ${b} ${Y - 6}`, mx: (a + b) / 2, my: Y - h * 0.8 - 8 };
    }),
  );

  const how =
    level.type === 'mul'
      ? `${q.text} artinya ${count} lompatan, setiap lompatan ${hop}. Katak mulai dari 0.`
      : `Katak mulai di ${start}, lalu lompat ${count} kali ${tick > 1 ? `(setiap lompatan ${tick}) ` : ''}ke ${dir > 0 ? 'kanan' : 'kiri'}.`;

  function jump() {
    if (solved || done >= count) return;
    done++;
    play('pop');
    if (!settings.muted) speak(String(done));
  }

  function choose(c) {
    if (solved || wrong.includes(c)) return;
    if (c === q.answer) {
      solved = true;
      done = count;
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      shake++;
      wrong = [...wrong, c];
      play('wrong');
    }
  }

  function onkeydown(e) {
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      jump();
    }
  }
</script>

<svelte:window {onkeydown} />

<button class="equation" onclick={() => speak(`${q.text} = ?`)} aria-label="Dengarkan soal">
  {q.text} = <span class="slot" class:ok={solved}>{solved ? q.answer : '?'}</span>
</button>
<p class="hint">{how}</p>

<div class="line"><div class="track">
  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Garis bilangan 0 sampai {max}">
    <line x1={PAD - 20} y1={Y} x2={W - PAD + 20} y2={Y} class="axis" />
    {#each ticks as v}
      <line x1={x(v)} y1={Y - 14} x2={x(v)} y2={Y + 14} class="tick" class:start={v === start} />
      <text
        x={x(v)}
        y={Y + 52}
        font-size={labelSize}
        class:start={v === start}
        class:end={solved && v === q.answer}
      >{v}</text>
    {/each}
    {#each arcs as a, i}
      <path d={a.d} class="arc" />
      {#if crowded}
        <text x={a.mx} y={a.my} class="hop" font-size="28">{i + 1}</text>
      {:else}
        <text x={a.mx} y={a.my} class="hop" font-size="30">{dir > 0 ? '+' : '−'}{hop}</text>
        <text x={a.mx} y={a.my - 34} class="num" font-size="24">{i + 1}</text>
      {/if}
    {/each}
  </svg>
  <div class="frog" style="left:{(x(pos) / W) * 100}%; top:{(Y / H) * 100}%">
    {#key done}<span class:jumping={done > 0} class:happy={solved}>🐸</span>{/key}
  </div>
</div></div>

<div class="controls">
  <button class="btn" style="--c:var(--ok)" disabled={solved || done >= count} onclick={jump}>
    🐸 Lompat! <small>({done}/{count})</small>
  </button>
</div>

<p class="ask">
  {#if solved}
    <span class="ok">Benar! Katak berhenti di {q.answer}. 🎉</span>
  {:else if wrong.length}
    <span class="bad">Belum tepat. Coba hitung lompatannya lagi, ya! 💪</span>
  {:else if done >= count}
    Katak berhenti di angka berapa?
  {:else}
    Tekan <b>Lompat</b> untuk membantu katak, lalu pilih jawabannya.
  {/if}
</p>

{#key shake}
  <div class="choices" class:shake={shake > 0 && !solved}>
    {#each q.choices as c}
      <button
        class="choice"
        class:wrong={wrong.includes(c)}
        class:right={solved && c === q.answer}
        disabled={solved || wrong.includes(c)}
        onclick={() => choose(c)}
        aria-label={terbilang(c)}
      >
        {c}
      </button>
    {/each}
  </div>
{/key}

<style>
  .equation {
    display: block;
    margin: 0 auto 8px;
    padding: 6px 22px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(2.2rem, 10vw, 3.4rem);
    font-weight: 700;
    color: var(--ok);
  }

  .slot {
    display: inline-block;
    min-width: 1.4em;
    padding: 0 0.15em;
    border-radius: 14px;
    border: 3px dashed var(--dash);
    color: var(--muted);
  }

  .slot.ok {
    border: 3px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
    animation: pop 0.3s ease-out;
  }

  .track {
    position: relative;
  }

  .line {
    max-width: 900px;
    margin: 6px auto 0;
    padding: 4px 6px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .axis {
    stroke: var(--ink);
    stroke-width: 6;
    stroke-linecap: round;
  }

  .tick {
    stroke: var(--ink);
    stroke-width: 4;
  }

  .tick.start {
    stroke: var(--coral);
    stroke-width: 7;
  }

  text {
    text-anchor: middle;
    fill: var(--ink);
    font-family: inherit;
    font-weight: 600;
  }

  text.start {
    fill: var(--coral);
    font-weight: 700;
  }

  text.end {
    fill: var(--ok);
    font-weight: 700;
  }

  .arc {
    fill: none;
    stroke: var(--ok);
    stroke-width: 7;
    stroke-dasharray: 12 8;
    animation: fade 0.3s;
  }

  .hop {
    fill: var(--ok);
    font-weight: 700;
  }

  .num {
    fill: var(--muted);
  }

  .frog {
    position: absolute;
    transform: translate(-50%, -96%);
    transition: left 0.45s ease-in-out;
    font-size: clamp(30px, 7vw, 52px);
    line-height: 1;
    pointer-events: none;
  }

  .frog span {
    display: inline-block;
  }

  .jumping {
    animation: leap 0.45s ease-out;
  }

  .happy {
    animation: bob 0.9s ease-in-out infinite;
  }

  @keyframes leap {
    40% {
      transform: translateY(-70%) scale(1.1);
    }
    100% {
      transform: translateY(0);
    }
  }

  .controls {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .controls small {
    font-size: 0.75em;
    opacity: 0.85;
  }

  .ask {
    margin: 14px 0 10px;
    text-align: center;
    font-size: 1.15rem;
    font-weight: 500;
    color: var(--muted);
  }

  .ok {
    color: var(--ok);
  }

  .bad {
    color: var(--bad);
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 120px));
    justify-content: center;
    gap: 10px;
  }

  .choices.shake {
    animation: shake 0.4s;
  }

  .choice {
    padding: 14px 4px;
    border-radius: var(--radius);
    background: var(--sky);
    color: #fff;
    font-size: clamp(1.6rem, 7vw, 2.2rem);
    font-weight: 700;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .choice:nth-child(2) {
    background: var(--grape);
  }

  .choice:nth-child(3) {
    background: var(--pink);
  }

  .choice:nth-child(4) {
    background: var(--orange);
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
</style>
