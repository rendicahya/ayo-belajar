<script>
  import { untrack } from 'svelte';
  import { genLetter } from '../lib/words.js';
  import { letterName } from '../lib/letters.js';
  import { play } from '../lib/sound.js';
  import { say, speak } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genLetter(level);
  const { type } = level;
  const name = letterName(q.answer);

  const word = q.dir === 'after' ? 'sesudah' : 'sebelum';
  const ask =
    type === 'listen'
      ? { text: 'Dengarkan, lalu ketuk hurufnya!', spoken: `Mana huruf ${name}?` }
      : type === 'case'
        ? { text: `Mana huruf kecil dari ${q.shown}?`, spoken: `Mana huruf ${name} kecil?` }
        : type === 'initial'
          ? { text: 'Kata ini dimulai dengan huruf apa?', spoken: `${q.word.word}. ${q.word.word} dimulai dengan huruf apa?` }
          : { text: `Huruf apa ${word} ${q.n}?`, spoken: `Huruf apa ${word} ${letterName(q.n)}?` };

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  function pickOption(value, i) {
    if (solved || wrong.includes(i)) return;
    if (value === q.answer) {
      solved = true;
      const text =
        type === 'initial'
          ? `Betul, ${q.word.word} dimulai dengan huruf ${q.answer}!`
          : type === 'neighbor'
            ? `Betul! ${q.dir === 'after' ? `${q.n}, ${q.answer}` : `${q.answer}, ${q.n}`}.`
            : type === 'case'
              ? `Betul, ${q.shown} besar dan ${q.answer} kecil!`
              : `Betul, ini huruf ${q.answer}!`;
      const spoken =
        type === 'initial'
          ? `Betul, ${q.word.word} dimulai dengan huruf ${name}!`
          : type === 'neighbor'
            ? `Betul! ${(q.dir === 'after' ? [q.n, q.answer] : [q.answer, q.n]).map(letterName).join(', ')}.`
            : type === 'case'
              ? `Betul, ${name} besar dan ${name} kecil!`
              : `Betul, ini huruf ${name}!`;
      message = { text, kind: 'ok' };
      play('correct');
      say(spoken);
      props.onSolved(attempts === 0);
      return;
    }
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    if (type === 'listen') {
      message = { text: `Itu huruf ${value}. Dengarkan lagi, ya! 💪`, kind: 'bad' };
      say(`Itu huruf ${letterName(value)}. Cari huruf ${name}.`);
    } else if (type === 'case') {
      message = { text: `${value.toUpperCase()} besar kecilnya ${value}. Cari pasangan ${q.shown}, ya! 💪`, kind: 'bad' };
    } else if (type === 'initial') {
      message = { text: `Ucapkan pelan-pelan: ${q.word.syl.join(' - ')}. Bunyi pertamanya apa? 💪`, kind: 'bad' };
      say(q.word.syl.join(', '));
    } else {
      message = { text: 'Coba nyanyikan a, b, c, d… pelan-pelan. 💪', kind: 'bad' };
    }
  }
</script>

<AskBar {...ask} />

{#if type === 'case'}
  <div class="target">{q.shown}</div>
{:else if type === 'initial'}
  <button class="picture" onclick={() => speak(q.word.word)} aria-label="Dengar kata">
    <span class="emoji">{q.word.emoji}</span>
    {#if solved}<span class="word"><b>{q.word.word[0]}</b>{q.word.word.slice(1)}</span>{/if}
  </button>
{:else if type === 'neighbor'}
  <div class="strip">
    {#each q.dir === 'after' ? [q.n, null] : [null, q.n] as v}
      <span class="card" class:blank={v === null} class:ok={v === null && solved}>{v ?? (solved ? q.answer : '?')}</span>
    {/each}
  </div>
{/if}

<div class="pick">
  <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .pick {
    margin-top: 18px;
  }

  .pick :global(.choice) {
    flex-basis: 120px;
    padding: 18px 6px;
    font-size: clamp(2.6rem, 12vw, 3.4rem);
  }

  .target {
    display: grid;
    place-items: center;
    width: 110px;
    height: 110px;
    margin: 10px auto;
    border-radius: 30px;
    background: var(--sky);
    color: #fff;
    font-size: 4rem;
    font-weight: 700;
    box-shadow: inset 0 -8px 0 rgba(0, 0, 0, 0.15);
  }

  .picture {
    display: grid;
    justify-items: center;
    gap: 4px;
    margin: 10px auto;
    padding: 14px 28px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .emoji {
    font-size: clamp(4.5rem, 22vw, 6rem);
    line-height: 1.1;
  }

  .word {
    font-size: 1.8rem;
    font-weight: 600;
    animation: pop 0.35s ease-out;
  }

  .word b {
    color: var(--ok);
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
