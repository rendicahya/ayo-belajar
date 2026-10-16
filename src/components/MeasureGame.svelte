<script>
  import { untrack } from 'svelte';
  import { genMeasure } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genMeasure(level);
  const { type } = level;

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  // perbandingan
  const cmp = q.left ? Math.sign(q.left.value - q.right.value) : 0;
  const SYMS = [
    { sym: '<', label: 'Lebih kecil', phrase: 'lebih kecil dari' },
    { sym: '=', label: 'Sama dengan', phrase: 'sama dengan' },
    { sym: '>', label: 'Lebih besar', phrase: 'lebih besar dari' },
  ];
  const correctSym = cmp < 0 ? '<' : cmp > 0 ? '>' : '=';

  const okText = {
    ruler: () => `Panjang ${q.name} ${q.answer} cm.`,
    'ruler-offset': () => `Ujungnya di ${q.start + q.length}, pangkalnya di ${q.start}. ${q.start + q.length} − ${q.start} = ${q.length} cm.`,
    scale: () => `Jarumnya menunjuk ${q.value}. Berat ${q.name} ${q.value} kg.`,
    convert: () => q.text.replace('?', q.answer),
    compare: () => {
      const conv = q.left.text.match(/ (m|kg)$/) ? q.left : q.right;
      const big = conv.text.split(' ');
      const small = big[1] === 'm' ? 'cm' : 'g';
      return `${conv.text} = ${conv.value} ${small}. Jadi ${q.left.text} ${SYMS.find((s) => s.sym === correctSym).phrase} ${q.right.text}.`;
    },
  };
  const badText = {
    ruler: 'Lihat angka di ujung benda pada penggaris. 💪',
    'ruler-offset': 'Benda ini tidak mulai dari 0. Ujung − pangkal = panjangnya. 💪',
    scale: 'Lihat ke mana jarumnya menunjuk. Garis di antara dua angka adalah angka ganjil. 💪',
    convert: 'Ingat: 1 m = 100 cm, 1 kg = 1000 g, 1 km = 1000 m. 💪',
    compare: 'Ubah dulu ke satuan yang sama. 1 m = 100 cm, 1 kg = 1000 g. 💪',
  };

  function pick(o, i) {
    if (solved || wrong.includes(i)) return;
    const ok = type === 'compare' ? o.sym === correctSym : o === q.answer;
    if (ok) {
      solved = true;
      message = { text: okText[type](), kind: 'ok' };
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      wrong = [...wrong, i];
      message = { text: badText[type], kind: 'bad' };
      play('wrong');
    }
  }

  // ---- penggaris ----
  const RW = 1000;
  const PAD = 30;
  const cm = q.max ? (RW - 2 * PAD) / q.max : 0;
  const rx = (v) => PAD + v * cm;
  const x0 = q.max ? rx(q.start) : 0;
  const x1 = q.max ? rx(q.start + q.length) : 0;

  // ---- timbangan: 0–10 kg pada busur 240° ----
  const ang = (v) => ((-210 + (v / 10) * 240) * Math.PI) / 180;
  const at = (v, r) => [150 + r * Math.cos(ang(v)), 190 + r * Math.sin(ang(v))];
  const [nx, ny] = q.value != null ? at(q.value, 80) : [0, 0];
</script>

{#snippet unitItem(o)}{o} <small class="unit">{q.unit}</small>{/snippet}
{#snippet symItem(o)}<span class="sym">{o.sym}</span><span class="lbl">{o.label}</span>{/snippet}

{#if type === 'ruler' || type === 'ruler-offset'}
  <p class="hint">Berapa sentimeter (cm) panjang {q.name} ini?</p>
  <div class="panel">
    <svg viewBox="0 0 {RW} 230" role="img" aria-label="Penggaris dan {q.name}">
      <!-- benda -->
      <g class="obj" style="--c:{q.color}">
        <rect x={x0} y="48" width={Math.max(0, x1 - x0 - 34)} height="40" rx="8" class="body" />
        <rect x={x0} y="48" width="26" height="40" rx="8" class="cap" />
        <path d="M {x1 - 36} 48 L {x1} 68 L {x1 - 36} 88 Z" class="tip" />
      </g>
      <line x1={x0} y1="40" x2={x0} y2="112" class="guide" />
      <line x1={x1} y1="40" x2={x1} y2="112" class="guide" />
      <!-- penggaris -->
      <rect x="4" y="112" width={RW - 8} height="100" rx="10" class="ruler" />
      {#each { length: q.max * 2 + 1 } as _, i}
        <line x1={rx(i / 2)} y1="112" x2={rx(i / 2)} y2={i % 2 ? 132 : 150} class="tick" />
        {#if i % 2 === 0}
          <text x={rx(i / 2)} y="192" font-size={q.max > 15 ? 34 : 40}>{i / 2}</text>
        {/if}
      {/each}
    </svg>
  </div>
  <ChoiceButtons options={q.choices} isRight={(o) => o === q.answer} onpick={pick} {wrong} {solved} item={rulerItem} />
{:else if type === 'scale'}
  <p class="hint">Berapa kilogram (kg) berat {q.name} ini?</p>
  <div class="panel scale">
    <svg viewBox="0 0 300 300" role="img" aria-label="Timbangan">
      <rect x="40" y="60" width="220" height="16" rx="8" class="plate" />
      <rect x="140" y="76" width="20" height="26" class="neck" />
      <text x="150" y="58" font-size="64" class="item">{q.emoji}</text>
      <circle cx="150" cy="190" r="104" class="dial-rim" />
      <circle cx="150" cy="190" r="94" class="dial" />
      {#each { length: 11 } as _, v}
        {@const [ax, ay] = at(v, 92)}
        {@const [bx, by] = at(v, v % 2 ? 80 : 74)}
        <line x1={ax} y1={ay} x2={bx} y2={by} class="tick" />
        {#if v % 2 === 0}
          {@const [tx, ty] = at(v, 58)}
          <text x={tx} y={ty + 8} font-size="22">{v}</text>
        {/if}
      {/each}
      <line x1="150" y1="190" x2={nx} y2={ny} class="needle" />
      <circle cx="150" cy="190" r="9" class="hub" />
      <text x="150" y="250" font-size="18" class="kg">kg</text>
    </svg>
  </div>
  <ChoiceButtons options={q.choices} isRight={(o) => o === q.answer} onpick={pick} {wrong} {solved} item={kgItem} />
{:else if type === 'convert'}
  <p class="hint">Ubah ke satuan yang diminta.</p>
  <button class="big" onclick={() => speak(q.text.replace('?', 'berapa'))}>{q.text}</button>
  <ChoiceButtons options={q.choices} isRight={(o) => o === q.answer} onpick={pick} {wrong} {solved} item={unitItem} />
{:else}
  <p class="hint">Mana yang lebih panjang atau lebih berat? Samakan dulu satuannya.</p>
  <div class="duel">
    <button class="big side" onclick={() => speak(q.left.text)}>{q.left.text}</button>
    <span class="slot" class:ok={solved}>{solved ? correctSym : '?'}</span>
    <button class="big side" onclick={() => speak(q.right.text)}>{q.right.text}</button>
  </div>
  <ChoiceButtons options={SYMS} isRight={(o) => o.sym === correctSym} onpick={pick} {wrong} {solved} item={symItem} />
{/if}

{#snippet rulerItem(o)}{o} <small class="unit">cm</small>{/snippet}
{#snippet kgItem(o)}{o} <small class="unit">kg</small>{/snippet}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .panel {
    max-width: 760px;
    margin: 14px auto 16px;
    padding: 10px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .panel.scale {
    max-width: 300px;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  text {
    text-anchor: middle;
    font-family: inherit;
    font-weight: 600;
    fill: #3a3550;
  }

  .ruler {
    fill: #ffe08a;
    stroke: #d9a93a;
    stroke-width: 3;
  }

  .tick {
    stroke: #3a3550;
    stroke-width: 3;
  }

  .guide {
    stroke: var(--muted);
    stroke-width: 3;
    stroke-dasharray: 6 6;
  }

  .obj .body {
    fill: var(--c);
  }

  .obj .cap {
    fill: #f2a3b8;
  }

  .obj .tip {
    fill: #f5d9a8;
    stroke: var(--c);
    stroke-width: 3;
  }

  .plate,
  .neck {
    fill: var(--muted);
  }

  .item {
    text-anchor: middle;
  }

  .dial-rim {
    fill: var(--coral);
  }

  .dial {
    fill: #fffdf6;
  }

  .needle {
    stroke: var(--bad);
    stroke-width: 6;
    stroke-linecap: round;
  }

  .hub {
    fill: #3a3550;
  }

  .kg {
    fill: #7a7590;
  }

  .unit {
    font-size: 0.55em;
    opacity: 0.85;
  }

  .big {
    display: block;
    margin: 18px auto;
    padding: 12px 24px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(2rem, 9vw, 3.2rem);
    font-weight: 700;
    color: var(--lime);
    white-space: nowrap;
  }

  .duel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 18px 0;
  }

  .duel .big {
    margin: 0;
    padding: 12px 14px;
    font-size: clamp(1.5rem, 7vw, 2.6rem);
  }

  .slot {
    display: grid;
    place-items: center;
    flex: none;
    width: clamp(50px, 13vw, 80px);
    height: clamp(50px, 13vw, 80px);
    border-radius: 50%;
    border: 4px dashed var(--dash);
    background: var(--card);
    font-size: clamp(1.8rem, 8vw, 2.8rem);
    font-weight: 700;
    color: var(--muted);
  }

  .slot.ok {
    border: 4px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
  }

  .sym {
    display: block;
    font-size: 2.2rem;
  }

  .lbl {
    display: block;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .msg {
    margin-top: 16px;
  }
</style>
