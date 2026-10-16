<script>
  import { untrack } from 'svelte';
  import { genFact, recordFact } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genFact(level);
  const started = performance.now();

  let typed = $state('');
  let solved = $state(false);
  let showGroups = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  function input(d) {
    if (solved || typed.length >= 3 || (typed === '' && d === 0 && q.answer !== 0)) return;
    typed += d;
    message = { text: '', kind: '' };
    play('tap');
  }
  function erase() {
    if (!solved) typed = typed.slice(0, -1);
  }
  function check() {
    if (solved || !typed) return;
    if (Number(typed) === q.answer) {
      solved = true;
      const secs = ((performance.now() - started) / 1000).toFixed(1).replace('.', ',');
      const star = attempts === 0 && !showGroups;
      message = { text: `${q.a} × ${q.b} = ${q.answer} ${star ? `⚡ ${secs} detik` : ''}`, kind: 'ok' };
      recordFact(q.id, star);
      play('correct');
      props.onSolved(star);
    } else {
      attempts++;
      shake++;
      typed = '';
      message = { text: 'Belum tepat, coba lagi! Kamu bisa lihat kelompoknya. 💪', kind: 'bad' };
      play('wrong');
    }
  }

  function onkeydown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) input(Number(e.key));
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') check();
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<p class="hint">Berapa hasilnya? Jawab secepat kamu bisa!</p>

{#key shake}
  <div class="fact" class:bad={shake > 0 && !solved}>
    <button class="n" onclick={() => speak(`${q.a} × ${q.b}`)} aria-label="Dengarkan soal">{q.a} × {q.b}</button>
    <span class="eq">=</span>
    <span class="box" class:ok={solved}>{typed}<span class="caret" class:hide={solved || typed.length >= 3}></span></span>
  </div>
{/key}

{#if showGroups}
  <div class="groups" aria-label="{q.a} kelompok berisi {q.b}">
    {#each { length: q.a } as _, r}
      <div class="group">
        {#each { length: q.b } as _}<span class="dot"></span>{/each}
        <small>{q.b * (r + 1)}</small>
      </div>
    {/each}
  </div>
  <p class="explain">{q.a} kelompok, masing-masing {q.b}. Hitung lompat: {Array.from({ length: q.a }, (_, i) => q.b * (i + 1)).join(', ')}.</p>
{:else if !solved}
  <div class="center">
    <button class="btn light small" onclick={() => (showGroups = true)}>💡 Lihat kelompoknya</button>
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>
<div class="center">
  <Keypad oninput={input} onerase={erase} oncheck={check} canCheck={!!typed} disabled={solved} />
</div>

<style>
  .fact {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 14px 0;
    font-size: clamp(3rem, 15vw, 5rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .fact.bad {
    animation: shake 0.4s;
  }

  .n {
    font-size: inherit;
    font-weight: inherit;
    color: var(--pink);
  }

  .eq {
    color: var(--muted);
  }

  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.2em;
    height: 1.3em;
    padding: 0 0.15em;
    border-radius: 20px;
    border: 4px solid var(--sun);
    background: var(--active-bg);
  }

  .box.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
    animation: pop 0.3s ease-out;
  }

  .caret {
    width: 4px;
    height: 0.8em;
    margin-left: 2px;
    background: var(--ink);
    animation: blink 1s steps(1) infinite;
  }

  .caret.hide {
    display: none;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .groups {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    max-width: 640px;
    margin: 0 auto;
  }

  .group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    max-width: 120px;
    padding: 6px 8px;
    border-radius: 14px;
    background: var(--card);
    box-shadow: var(--shadow);
    animation: pop 0.3s ease-out;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pink);
  }

  .group small {
    margin-left: 4px;
    color: var(--muted);
    font-weight: 600;
  }

  .explain {
    margin-top: 8px;
    text-align: center;
    color: var(--muted);
  }

  .center {
    display: flex;
    justify-content: center;
  }

  .msg {
    margin: 10px 0;
  }
</style>
