<script>
  import { untrack } from 'svelte';
  import { genSyllable } from '../lib/words.js';
  import { play } from '../lib/sound.js';
  import { say, speak } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';
  import BuildTiles from './BuildTiles.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genSyllable(level);
  const { type } = level;
  const listen = type === 'vowel' || type === 'mixed';

  const ask = listen
    ? { text: 'Dengarkan, lalu ketuk suku katanya!', spoken: `Mana ${q.answer}?` }
    : type === 'build'
      ? { text: 'Susun suku katanya sesuai gambar!', spoken: `Susun suku katanya menjadi kata ${q.word.word}!` }
      : { text: 'Baca katanya, lalu pilih gambarnya!' };

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  function win(text, spoken = text) {
    solved = true;
    message = { text, kind: 'ok' };
    play('correct');
    say(spoken);
    props.onSolved(attempts === 0);
  }

  function pickOption(value, i) {
    if (solved || wrong.includes(i)) return;
    const right = listen ? value === q.answer : value === q.word;
    if (right) {
      if (listen) win(`Betul, ini ${q.answer}!`);
      else win(`Betul, ${q.word.word}! ${q.word.emoji}`, `Betul, ${q.word.word}!`);
      return;
    }
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    if (listen) {
      message = { text: `Itu ${value}. Dengarkan lagi, ya! 💪`, kind: 'bad' };
      say(`Itu ${value}. Cari ${q.answer}.`);
    } else {
      message = { text: `Itu gambar ${value.word}. Baca lagi pelan-pelan: ${q.word.syl.join(' - ')} 💪`, kind: 'bad' };
    }
  }

  function onwrong() {
    attempts++;
    message = { text: `Hampir! Ucapkan pelan-pelan: ${q.word.syl.join(' - ')} 💪`, kind: 'bad' };
    say(q.word.syl.join(', '));
  }
</script>

<AskBar {...ask} />

{#if listen}
  <div class="pick">
    <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
  </div>
{:else if type === 'build'}
  <button class="picture" onclick={() => speak(q.word.word)} aria-label="Dengar kata">{q.word.emoji}</button>
  <BuildTiles
    tiles={q.tiles.map((text, id) => ({ id, text }))}
    target={q.word.syl}
    onsolved={() => win(`Hebat, ${q.word.syl.join(' - ')} jadi ${q.word.word}!`, `${q.word.syl.join(', ')}. ${q.word.word}!`)}
    {onwrong}
  />
{:else}
  <div class="read">{q.word.word}</div>
  <div class="pics">
    <ChoiceButtons options={q.choices} isRight={(w) => w === q.word} onpick={pickOption} {wrong} {solved}>
      {#snippet item(w)}<span class="pic">{w.emoji}</span>{/snippet}
    </ChoiceButtons>
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .pick {
    margin-top: 18px;
  }

  .pick :global(.choice) {
    flex-basis: 140px;
    padding: 20px 6px;
    font-size: clamp(2.2rem, 10vw, 3rem);
  }

  .picture {
    display: block;
    margin: 10px auto 0;
    padding: 8px 28px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(4.5rem, 22vw, 6rem);
    line-height: 1.2;
  }

  .read {
    width: fit-content;
    margin: 14px auto 20px;
    padding: 10px 30px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    font-size: clamp(2.6rem, 13vw, 3.8rem);
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .pics :global(.choice) {
    flex-basis: 130px;
    padding: 14px 6px;
  }

  .pic {
    font-size: clamp(2.8rem, 13vw, 3.6rem);
    line-height: 1.1;
  }

  .msg {
    margin-top: 16px;
  }
</style>
