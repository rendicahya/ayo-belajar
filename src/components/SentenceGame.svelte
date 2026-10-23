<script>
  import { untrack } from 'svelte';
  import { genSentence } from '../lib/words.js';
  import { play } from '../lib/sound.js';
  import { say, speak } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';
  import BuildTiles from './BuildTiles.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genSentence(level);
  const { type } = level;

  const ask =
    type === 'blank'
      ? { text: 'Pilih kata yang tepat!' }
      : type === 'build'
        ? { text: 'Susun kata-katanya menjadi kalimat!' }
        : { text: 'Mana kalimat yang ditulis dengan benar?' };

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;
  const [before, after] = type === 'blank' ? q.text.split('___') : [];

  function win(sentence) {
    solved = true;
    message = { text: `Hebat! “${sentence}”`, kind: 'ok' };
    play('correct');
    say(sentence);
    props.onSolved(attempts === 0);
  }

  function pickOption(value, i) {
    if (solved || wrong.includes(i)) return;
    if (value === q.answer) return win(type === 'blank' ? q.text.replace('___', q.answer) : q.answer);
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    if (type === 'blank') {
      message = { text: `“${q.text.replace('___', value)}” Hmm, apa bisa begitu? Coba lagi! 💪`, kind: 'bad' };
    } else {
      const tip = !/^[A-Z]/.test(value)
        ? 'Kalimat dimulai dengan huruf kapital.'
        : !value.endsWith('.')
          ? 'Kalimat diakhiri dengan tanda titik.'
          : 'Urutan katanya belum pas. Coba baca pelan-pelan.';
      message = { text: `${tip} 💪`, kind: 'bad' };
    }
  }

  function onwrong() {
    attempts++;
    message = { text: 'Hampir! Baca lagi kalimatnya, apakah sudah masuk akal? 💪', kind: 'bad' };
  }
</script>

<AskBar {...ask} />

{#if type === 'blank'}
  <p class="sentence">
    {before}<span class="gap" class:ok={solved}>{solved ? q.answer : '…'}</span>{after}
    <button class="say" onclick={() => speak(q.text.replace('___', 'apa'))} aria-label="Bacakan kalimat">🔊</button>
  </p>
  <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
{:else if type === 'build'}
  <p class="hint">Ketuk kata di bawah sesuai urutan. Ketuk kata di atas untuk mengembalikannya.</p>
  <BuildTiles
    tiles={q.tiles.map(({ id, w }) => ({ id, text: w }))}
    target={q.words}
    tail="."
    wide
    onsolved={() => win(`${q.words.join(' ')}.`)}
    {onwrong}
  />
{:else}
  <p class="hint">Ingat: diawali huruf kapital, diakhiri tanda titik, dan urutannya masuk akal.</p>
  <div class="list">
    <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} wide />
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .sentence {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0 6px;
    max-width: 640px;
    margin: 18px auto 22px;
    padding: 16px 20px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(1.5rem, 6.5vw, 2rem);
    font-weight: 600;
    text-align: center;
    white-space: pre-wrap;
  }

  .gap {
    min-width: 3.5em;
    padding: 0 8px;
    border-bottom: 4px dashed var(--dash);
    color: var(--muted);
  }

  .gap.ok {
    border-bottom: 4px solid var(--ok);
    color: var(--ok);
  }

  .say {
    font-size: 1.4rem;
    line-height: 1;
  }

  .list :global(.choices) {
    flex-direction: column;
    align-items: stretch;
    max-width: 520px;
  }

  .list :global(.choice) {
    flex-basis: auto;
    padding: 14px 16px;
    text-transform: none;
  }

  .msg {
    margin-top: 16px;
  }
</style>
