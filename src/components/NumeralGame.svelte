<script>
  import { untrack } from 'svelte';
  import { genNumeral } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';
  import Herd from './Herd.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genNumeral(level);
  const { type } = q;

  const word = q.dir === 'after' ? 'sesudah' : 'sebelum';
  const ask =
    type === 'listen'
      ? { text: 'Dengarkan, lalu ketuk angkanya!', spoken: `Mana angka ${q.answer}?` }
      : type === 'toGroup'
        ? { text: `Mana yang jumlahnya ${q.answer}?` }
        : { text: `Angka apa ${word} ${q.n}?` };

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  function pickOption(value, i) {
    if (solved || wrong.includes(i)) return;
    if (value === q.answer) {
      solved = true;
      const text =
        type === 'listen'
          ? `Betul, ini angka ${q.answer}!`
          : type === 'toGroup'
            ? `Betul, ada ${q.answer} ${q.groups[i].animal.name}!`
            : `Betul! ${q.dir === 'after' ? `${q.n}, ${q.answer}` : `${q.answer}, ${q.n}`}.`;
      message = { text, kind: 'ok' };
      play('correct');
      say(text);
      props.onSolved(attempts === 0);
      return;
    }
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    if (type === 'listen') {
      message = { text: `Itu angka ${value}. Dengarkan lagi, ya! 💪`, kind: 'bad' };
      say(`Itu angka ${value}. Cari angka ${q.answer}.`);
    } else if (type === 'toGroup') {
      message = { text: `Itu ada ${value}. Coba hitung kelompok lain, ya! 💪`, kind: 'bad' };
    } else {
      message = {
        text: q.dir === 'after' ? `Sesudah ${q.n}, hitung maju satu lagi. 💪` : `Sebelum ${q.n}, hitung mundur satu. 💪`,
        kind: 'bad',
      };
    }
  }
</script>

<AskBar {...ask} />

{#if type === 'listen'}
  <div class="pick">
    <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
  </div>
{:else if type === 'toGroup'}
  <div class="target">{q.answer}</div>
  <div class="groups">
    {#each q.groups as g, i}
      <button
        class="group"
        class:wrong={wrong.includes(i)}
        class:right={solved && g.n === q.answer}
        disabled={solved || wrong.includes(i)}
        onclick={() => pickOption(g.n, i)}
        aria-label="Kelompok {g.animal.name}"
      >
        <Herd field={g.field} />
      </button>
    {/each}
  </div>
{:else}
  <div class="strip">
    {#each q.dir === 'after' ? [q.n, null] : [null, q.n] as v}
      <span class="card" class:blank={v === null} class:ok={v === null && solved}>{v ?? (solved ? q.answer : '?')}</span>
    {/each}
  </div>
  <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .pick {
    margin-top: 18px;
  }

  .pick :global(.choice) {
    flex-basis: 140px;
    padding: 22px 6px;
    font-size: clamp(2.6rem, 12vw, 3.6rem);
  }

  .target {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    margin: 10px auto;
    border-radius: 28px;
    background: var(--sky);
    color: #fff;
    font-size: 3.4rem;
    font-weight: 700;
    box-shadow: inset 0 -8px 0 rgba(0, 0, 0, 0.15);
  }

  .groups {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    max-width: 720px;
    margin: 14px auto;
  }

  .group {
    display: grid;
    align-content: center;
    min-height: 130px;
    padding: 12px 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--line);
    transition: opacity 0.2s;
  }

  .group:active:not(:disabled) {
    transform: scale(0.97);
  }

  .group.wrong {
    opacity: 0.35;
  }

  .group.right {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .strip {
    display: flex;
    justify-content: center;
    gap: 14px;
    margin: 18px 0;
  }

  .card {
    display: grid;
    place-items: center;
    width: clamp(84px, 24vw, 112px);
    height: clamp(96px, 27vw, 128px);
    border-radius: 24px;
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--sky);
    color: var(--sky);
    font-size: clamp(2.4rem, 11vw, 3.4rem);
    font-weight: 700;
    animation: pop 0.35s ease-out backwards;
  }

  .card.blank {
    border-style: dashed;
    border-color: var(--dash);
    color: var(--muted);
  }

  .card.ok {
    border: 4px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
  }

  .msg {
    margin-top: 16px;
  }
</style>
