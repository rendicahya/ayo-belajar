<script>
  import { untrack } from 'svelte';
  import { genColoring } from '../lib/generate.js';
  import { COLORS } from '../lib/drawings.js';
  import { play } from '../lib/sound.js';
  import { say, speak } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const q = genColoring(untrack(() => props.level));
  const { pic, type, numbers, palette } = q;

  let filled = $state([]); // warna tiap bagian yang sudah benar
  let sel = $state(null);
  let step = $state(0); // bagian yang sedang diminta (mode berpetunjuk)
  let bad = $state(-1);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;
  let badTimer;

  const target = $derived(type === 'guided' ? pic.regions[step] : null);
  const ask = $derived(
    solved
      ? { text: `Cantik! Gambar ${pic.name} sudah berwarna 🎨`, spoken: `Cantik! Gambar ${pic.name} sudah berwarna` }
      : type === 'guided'
        ? { text: `Warnai ${target.label} dengan warna ${target.color}!`, spoken: `Warnai ${target.label} dengan warna ${target.color}` }
        : type === 'number'
          ? { text: 'Warnai sesuai angkanya!', spoken: 'Warnai sesuai angkanya. Lihat angka di kotak warna.' }
          : { text: 'Baca nama warnanya, lalu warnai!', spoken: 'Baca nama warna di gambar, lalu warnai.' },
  );

  function choose(c) {
    sel = c;
    play('tap');
    speak(type === 'number' ? `${numbers[c]}, ${c}` : c);
  }

  function wrong(i, text) {
    attempts++;
    bad = i;
    clearTimeout(badTimer);
    badTimer = setTimeout(() => (bad = -1), 500);
    message = { text, kind: 'bad' };
    play('wrong');
    say(text);
  }

  function tap(i) {
    const r = pic.regions[i];
    if (solved || filled[i]) return;
    if (type === 'guided' && r !== target) {
      message = { text: `Warnai ${target.label} dulu, yang berkedip ✨`, kind: 'nudge' };
      return;
    }
    if (!sel) {
      message = { text: 'Pilih warnanya dulu di bawah, ya 👇', kind: 'nudge' };
      return;
    }
    if (sel !== r.color) {
      if (type === 'guided') return wrong(i, `Itu warna ${sel}. ${r.label[0].toUpperCase() + r.label.slice(1)} diwarnai ${r.color}, ya!`);
      if (type === 'number') return wrong(i, `Ups, angka ${numbers[r.color]} bukan warna ${sel}. Lihat angka di kotak warna.`);
      return wrong(i, `Ups, tulisannya bukan "${sel}". Coba baca lagi, ya.`);
    }
    filled[i] = r.color;
    message = { text: '', kind: '' };
    if (filled.filter(Boolean).length < pic.regions.length) {
      play('pop');
      if (type === 'guided') step++;
      return;
    }
    solved = true;
    message = { text: 'Hebat, semua bagian sudah berwarna!', kind: 'ok' };
    play('correct');
    props.onSolved(attempts === 0);
  }
</script>

{#key ask.text}<AskBar text={ask.text} spoken={ask.spoken} />{/key}
<p class="hint">
  {type === 'guided' ? 'Ketuk warna di bawah, lalu ketuk bagian gambar yang berkedip.' : 'Ketuk warna di bawah, lalu ketuk bagian gambarnya.'}
</p>

<div class="board">
  <svg viewBox="0 0 200 200" role="img" aria-label="Gambar {pic.name} untuk diwarnai">
    {#each pic.regions as r, i}
      <path
        d={r.d}
        class="region"
        class:target={r === target && !solved}
        class:bad={bad === i}
        style="fill:{filled[i] ? COLORS[filled[i]] : 'var(--card)'}"
        role="button"
        tabindex="-1"
        aria-label={r.label}
        onclick={() => tap(i)}
        onkeydown={(e) => e.key === 'Enter' && tap(i)}
      />
    {/each}
    {#each pic.lines ?? [] as d}<path {d} class="line" />{/each}
    {#if type !== 'guided'}
      {#each pic.regions as r, i}
        {#if !filled[i]}
          <!-- bagian yang terdiri dari beberapa potong (dua sayap, dua roda) diberi label di setiap potong -->
          {#each Array.isArray(r.at[0]) ? r.at : [r.at] as [x, y]}
            <text {x} {y} class="label" class:word={type === 'word'}>{type === 'number' ? numbers[r.color] : r.color}</text>
          {/each}
        {/if}
      {/each}
    {/if}
  </svg>
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<div class="palette" role="radiogroup" aria-label="Pilih warna">
  {#each palette as c}
    <button
      class="swatch"
      class:on={sel === c}
      style="--sw:{COLORS[c]}"
      role="radio"
      aria-checked={sel === c}
      aria-label={c}
      disabled={solved}
      onclick={() => choose(c)}
    >
      {#if type === 'number'}<span>{numbers[c]}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .board {
    display: flex;
    justify-content: center;
    max-width: 420px;
    margin: 10px auto 4px;
    padding: 10px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  svg {
    display: block;
    width: 100%;
    max-height: min(46vh, 380px);
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
  }

  .region {
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linejoin: round;
    cursor: pointer;
    transition: fill 0.25s;
    outline: none;
  }

  .region.target {
    stroke: var(--sun);
    stroke-width: 5;
    stroke-dasharray: 8 6;
    animation: march 0.8s linear infinite;
  }

  .region.bad {
    stroke: var(--bad);
    stroke-width: 6;
  }

  @keyframes march {
    to {
      stroke-dashoffset: -14;
    }
  }

  .line {
    fill: none;
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
    pointer-events: none;
  }

  .label {
    font-size: 15px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--ink);
    stroke: var(--card);
    stroke-width: 3px;
    paint-order: stroke;
    pointer-events: none;
  }

  .label.word {
    font-size: 10.5px;
    font-weight: 600;
  }

  .palette {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 520px;
    margin: 6px auto 0;
  }

  .swatch {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: var(--sw);
    box-shadow:
      inset 0 -5px 0 rgba(0, 0, 0, 0.18),
      0 4px 0 var(--line);
    transition: transform 0.12s;
  }

  .swatch.on {
    transform: scale(1.15);
    outline: 4px solid var(--ink);
    outline-offset: 3px;
  }

  .swatch span {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #fff;
    color: #2d2a4a;
    font-weight: 700;
    font-size: 1.15rem;
  }

  .swatch:disabled {
    opacity: 0.6;
  }

  @media (max-width: 420px) {
    .swatch {
      width: 46px;
      height: 46px;
    }
  }
</style>
