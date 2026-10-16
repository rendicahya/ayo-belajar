<script>
  import { untrack } from 'svelte';
  import { genPattern } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const { seq, hidden, rule } = genPattern(level);
  const isHidden = (i) => hidden.includes(i);

  let typed = $state(Object.fromEntries(hidden.map((i) => [i, ''])));
  let cursor = $state(hidden[0]);
  let bad = $state([]);
  let solved = $state(false);
  let hinted = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;
  const canCheck = $derived(hidden.every((i) => typed[i] !== ''));

  const sign = (d) => (d >= 0 ? `+${d}` : `−${-d}`);
  const diffLabel = (i) => {
    // selisih antara kartu i dan i+1, hanya kalau keduanya kelihatan (atau sudah selesai)
    if (!solved && (isHidden(i) || isHidden(i + 1))) return '?';
    if (rule.type === 'double') return '×2';
    return sign(seq[i + 1] - seq[i]);
  };
  const ruleText =
    rule.type === 'step'
      ? `Setiap kali ${rule.step > 0 ? 'bertambah' : 'berkurang'} ${Math.abs(rule.step)}.`
      : rule.type === 'double'
        ? 'Setiap angka dikali 2.'
        : `Lompatannya makin jauh: ${seq.slice(1).map((v, i) => sign(v - seq[i])).join(', ')}.`;

  function input(d) {
    if (solved || typed[cursor].length >= 3 || (typed[cursor] === '0')) return;
    typed[cursor] += d;
    bad = bad.filter((i) => i !== cursor);
    message = { text: '', kind: '' };
    play('tap');
  }
  function erase() {
    if (solved) return;
    if (!typed[cursor]) {
      const j = hidden.indexOf(cursor);
      if (j > 0) cursor = hidden[j - 1];
    }
    typed[cursor] = typed[cursor].slice(0, -1);
  }
  function next() {
    const j = hidden.indexOf(cursor);
    cursor = hidden[(j + 1) % hidden.length];
  }
  function check() {
    if (solved || !canCheck) return;
    bad = hidden.filter((i) => Number(typed[i]) !== seq[i]);
    if (!bad.length) {
      solved = true;
      message = { text: `Hebat! ${ruleText}`, kind: 'ok' };
      play('correct');
      props.onSolved(attempts === 0 && !hinted);
    } else {
      attempts++;
      shake++;
      cursor = bad[0];
      message = { text: 'Angka yang merah belum pas. Lihat lompatan antar angka, ya! 💪', kind: 'bad' };
      play('wrong');
    }
  }
  function hint() {
    hinted = true;
    message = { text: `Petunjuk: ${ruleText}`, kind: 'nudge' };
    play('pop');
  }

  function onkeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) input(Number(e.key));
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') check();
    else if (e.key === 'Tab' || e.key === 'ArrowRight') next();
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<p class="hint">Angka apa yang hilang? Perhatikan lompatannya.{#if hidden.length > 1}{' '}Ketuk kotak untuk pindah.{/if}</p>

<div class="row">
  {#each seq as v, i}
    {#if isHidden(i)}
      {#key bad.includes(i) ? shake : 0}
        <button
          class="card blank"
          class:active={cursor === i && !solved}
          class:filled={typed[i] !== ''}
          class:ok={solved}
          class:bad={bad.includes(i)}
          onclick={() => (cursor = i)}
          aria-label="Kotak angka yang hilang"
        >
          {typed[i]}
        </button>
      {/key}
    {:else}
      <button class="card" style="--d:{i * 0.06}s" onclick={() => speak(String(v))}>{v}</button>
    {/if}
    {#if i < seq.length - 1}
      <span class="jump" class:known={solved || hinted}>
        {solved || hinted ? diffLabel(i) : ''}
        <svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 14 Q20 -6 38 14" /></svg>
      </span>
    {/if}
  {/each}
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>
<div class="center">
  {#if !solved && !hinted}
    <button class="btn light small" onclick={hint}>💡 Petunjuk</button>
  {/if}
</div>
<div class="center pad">
  <Keypad oninput={input} onerase={erase} oncheck={check} {canCheck} disabled={solved} />
</div>

<style>
  .row {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin: 22px 0 8px;
  }

  .card {
    display: grid;
    place-items: center;
    flex: 0 1 auto;
    min-width: clamp(40px, 11.5vw, 76px);
    height: clamp(54px, 15vw, 84px);
    padding: 0 4px;
    border-radius: 18px;
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid var(--teal);
    color: var(--teal);
    font-size: clamp(1.25rem, 5.6vw, 2.4rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    animation: pop 0.35s ease-out backwards;
    animation-delay: var(--d, 0s);
  }

  .blank {
    border: 3px dashed var(--dash);
    background: var(--cell-bg);
    color: var(--ink);
  }

  .blank.filled {
    border-style: solid;
  }

  .blank.active {
    border: 4px solid var(--sun);
    background: var(--active-bg);
    animation: bob 1.2s ease-in-out infinite;
  }

  .blank.ok {
    border: 3px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
  }

  .blank.bad {
    border: 3px solid var(--bad);
    background: var(--bad-soft);
    color: var(--bad);
    animation: shake 0.4s;
  }

  .jump {
    display: grid;
    justify-items: center;
    align-self: flex-start;
    flex: none;
    width: clamp(14px, 3.6vw, 40px);
    margin-top: -14px;
    color: var(--muted);
    font-size: clamp(0.75rem, 3vw, 1rem);
    font-weight: 700;
    min-height: 1em;
  }

  .jump.known {
    color: var(--teal);
  }

  .jump svg {
    width: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-dasharray: 4 3;
  }

  .center {
    display: flex;
    justify-content: center;
  }

  .pad {
    margin-top: 12px;
  }

  .msg {
    margin: 12px 0 8px;
  }
</style>
