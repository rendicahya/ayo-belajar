<script>
  import { untrack } from 'svelte';
  import { genHijaiyah, spokenName } from '../lib/hijaiyah.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const q = genHijaiyah(untrack(() => props.level));
  const { type, answer } = q;
  const name = spokenName(answer);

  const ask =
    type === 'name'
      ? { text: 'Ini huruf apa?', spoken: 'Ini huruf apa?' }
      : type === 'similar'
        ? { text: `Mana huruf ${answer.name}? Lihat titiknya!`, spoken: `Mana huruf ${name}? Lihat titiknya!` }
        : { text: `Mana huruf ${answer.name}?`, spoken: `Mana huruf ${name}?` };

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  function pickOption(h, i) {
    if (solved || wrong.includes(i)) return;
    if (h === answer) {
      solved = true;
      message = { text: `Betul, ini huruf ${answer.name}!`, kind: 'ok' };
      play('correct');
      say(`Betul, ini huruf ${name}!`);
      props.onSolved(attempts === 0);
      return;
    }
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    const text =
      type === 'name'
        ? `Bukan ${h.name}. Coba lagi, ya! 💪`
        : `Itu huruf ${h.name}. Huruf ${answer.name} ${answer.dots === 'tanpa titik' ? 'tidak punya titik' : `punya ${answer.dots}`}. 💪`;
    message = { text, kind: 'bad' };
    say(text.replace(/'/g, ''));
  }
</script>

<AskBar text={ask.text} spoken={ask.spoken} />

{#if type === 'name'}
  <div class="target ar">{answer.ch}</div>
{/if}

<div class="pick" class:names={type === 'name'}>
  <ChoiceButtons options={q.choices} isRight={(h) => h === answer} onpick={pickOption} {wrong} {solved}>
    {#snippet item(h)}
      {#if type === 'name'}{h.name}{:else}<span class="ar">{h.ch}</span>{/if}
    {/snippet}
  </ChoiceButtons>
</div>

{#if solved && type !== 'name'}
  <p class="hint">{answer.name}: {answer.dots}</p>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .pick {
    margin-top: 18px;
  }

  .pick :global(.choice) {
    flex-basis: 120px;
    padding: 4px 6px 10px;
    font-size: clamp(3rem, 14vw, 4rem);
  }

  .pick.names :global(.choice) {
    padding: 16px 6px;
    font-size: clamp(1.5rem, 6.5vw, 2rem);
  }

  .target {
    display: grid;
    place-items: center;
    width: 140px;
    height: 140px;
    margin: 10px auto;
    border-radius: 34px;
    background: var(--ok);
    color: #fff;
    font-size: 5.2rem;
    line-height: 1;
    padding-bottom: 14px;
    box-shadow: inset 0 -8px 0 rgba(0, 0, 0, 0.15);
  }

  .msg {
    margin-top: 16px;
  }
</style>
