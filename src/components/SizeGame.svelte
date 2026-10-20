<script>
  import { untrack } from 'svelte';
  import { genSize } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genSize(level);
  const { type } = level;

  const question =
    type === 'big'
      ? `Mana yang lebih ${q.ask}?`
      : type === 'long' || type === 'tall'
        ? `Mana yang paling ${q.ask}?`
        : type === 'heavy'
          ? `Mana yang lebih ${q.ask}?`
          : 'Ketuk dari yang paling kecil sampai yang paling besar!';
  const okText = {
    big: `Betul, yang itu lebih ${q.ask}!`,
    long: `Betul, pita itu paling ${q.ask}!`,
    tall: `Betul, menara itu paling ${q.ask}!`,
    heavy: type === 'heavy' && `Betul! Si ${q.items[q.heavier].name} lebih berat, jadi sisinya turun.`,
    order: 'Hebat, urutannya sudah benar!',
  }[type];
  const badText = {
    big: 'Belum tepat. Bandingkan ukurannya, ya! 💪',
    long: 'Belum tepat. Lihat ujung kanannya, mana yang paling jauh? 💪',
    tall: 'Belum tepat. Lihat puncaknya, ya! 💪',
    heavy: 'Belum tepat. Yang lebih berat membuat jungkat-jungkit turun. 💪',
    order: 'Belum tepat. Cari yang paling kecil dari yang tersisa. 💪',
  }[type];

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state({ i: -1, n: 0 });
  let attempts = 0;

  function finish() {
    solved = true;
    message = { text: okText, kind: 'ok' };
    play('correct');
    say(okText);
    props.onSolved(attempts === 0);
  }
  function miss(i) {
    attempts++;
    shake = { i, n: shake.n + 1 };
    message = { text: badText, kind: 'bad' };
    play('wrong');
  }

  function choose(i) {
    if (solved || wrong.includes(i)) return;
    if (i === q.answer) return finish();
    wrong = [...wrong, i];
    miss(i);
  }

  // urutkan: ketuk dari yang paling kecil
  let tapped = $state([]);
  function tapOrder(i) {
    if (solved || tapped.includes(i)) return;
    if (q.items[i].s === q.order[tapped.length]) {
      tapped = [...tapped, i];
      play('pop');
      message = { text: '', kind: '' };
      if (tapped.length === q.items.length) finish();
    } else miss(i);
  }

  const tilt = q.heavier === 0 ? -12 : 12;
</script>

<AskBar text={question} />

{#if type === 'big'}
  <div class="row">
    {#each q.items as it, i}
      <button class="tile" class:wrong={wrong.includes(i)} class:right={solved && i === q.answer} disabled={solved || wrong.includes(i)} onclick={() => choose(i)}>
        <span class="thing" style="font-size:{it.s * 7}rem">{it.emoji}</span>
      </button>
    {/each}
  </div>
{:else if type === 'long'}
  <div class="ribbons">
    {#each q.items as it, i}
      <button class="lane" class:wrong={wrong.includes(i)} class:right={solved && i === q.answer} disabled={solved || wrong.includes(i)} onclick={() => choose(i)} aria-label="Pita {i + 1}">
        <span class="ribbon" style="width:{it.v}%; --c:{it.color}"></span>
      </button>
    {/each}
  </div>
{:else if type === 'tall'}
  <div class="row towers">
    {#each q.items as it, i}
      <button class="tile tower" class:wrong={wrong.includes(i)} class:right={solved && i === q.answer} disabled={solved || wrong.includes(i)} onclick={() => choose(i)} aria-label="Menara {i + 1}">
        {#each { length: it.v } as _, k}
          <span class="block" style="--c:{it.color}; --d:{k * 0.05}s"></span>
        {/each}
      </button>
    {/each}
  </div>
{:else if type === 'heavy'}
  <div class="seesaw">
    <div class="plank" style="transform:rotate({tilt}deg)">
      {#each q.items as it, i}
        <button class="rider" class:wrong={wrong.includes(i)} class:right={solved && i === q.answer} disabled={solved || wrong.includes(i)} onclick={() => choose(i)} aria-label={it.name}>
          <span style="transform:rotate({-tilt}deg)">{it.emoji}</span>
        </button>
      {/each}
    </div>
    <div class="pivot"></div>
  </div>
{:else}
  <div class="row">
    {#each q.items as it, i}
      {@const no = tapped.indexOf(i) + 1}
      {#key shake.i === i ? shake.n : 0}
        <button class="tile" class:on={no > 0} class:bad={shake.i === i && shake.n > 0 && !no} onclick={() => tapOrder(i)}>
          <span class="thing" style="font-size:{it.s * 4.4}rem">{it.emoji}</span>
          {#if no}<span class="no">{no}</span>{/if}
        </button>
      {/key}
    {/each}
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .row {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 12px;
    margin: 16px auto;
    max-width: 680px;
  }

  .tile {
    position: relative;
    display: grid;
    place-items: end center;
    flex: 1 1 0;
    min-width: 0;
    min-height: 150px;
    padding: 12px 6px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--line);
    transition: opacity 0.2s;
  }

  .tile:active:not(:disabled),
  .lane:active:not(:disabled) {
    transform: scale(0.97);
  }

  .thing {
    line-height: 1;
    animation: pop 0.35s ease-out backwards;
  }

  .wrong {
    opacity: 0.35;
  }

  .tile.right,
  .lane.right {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .tile.on {
    border-color: var(--sun);
    background: var(--active-bg);
  }

  .tile.bad {
    border-color: var(--bad);
    animation: shake 0.4s;
  }

  .no {
    position: absolute;
    top: 8px;
    left: 8px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--sun);
    color: var(--on-sun);
    font-weight: 700;
    animation: pop 0.25s ease-out;
  }

  .ribbons {
    display: grid;
    gap: 12px;
    max-width: 560px;
    margin: 16px auto;
  }

  .lane {
    display: flex;
    padding: 14px 12px;
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--line);
    transition: opacity 0.2s;
  }

  .ribbon {
    height: 30px;
    border-radius: 6px 16px 16px 6px;
    background: var(--c);
    box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.15);
    transform-origin: left;
    animation: grow 0.5s ease-out backwards;
  }

  @keyframes grow {
    from {
      transform: scaleX(0);
    }
  }

  .towers .tower {
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    justify-content: flex-start;
    gap: 3px;
    min-height: 300px;
  }

  .block {
    width: min(72px, 80%);
    height: 30px;
    border-radius: 6px;
    background: var(--c);
    box-shadow: inset 0 -5px 0 rgba(0, 0, 0, 0.15);
    animation: pop 0.3s ease-out backwards;
    animation-delay: var(--d);
  }

  .seesaw {
    position: relative;
    max-width: 520px;
    height: 230px;
    margin: 16px auto;
  }

  .plank {
    position: absolute;
    left: 4%;
    right: 4%;
    top: 130px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 14px;
    border-radius: 7px;
    background: var(--orange);
    transition: transform 0.8s cubic-bezier(0.3, 1.6, 0.5, 1);
    animation: settle 1.2s ease-out;
  }

  @keyframes settle {
    from {
      transform: rotate(0deg);
    }
  }

  .rider {
    display: grid;
    place-items: center;
    width: 110px;
    height: 110px;
    margin-bottom: 10px;
    border-radius: 50%;
    border: 4px solid transparent;
    font-size: 4.2rem;
    line-height: 1;
    transition: opacity 0.2s;
  }

  .rider span {
    display: inline-block;
  }

  .rider.right {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .pivot {
    position: absolute;
    left: 50%;
    top: 140px;
    width: 0;
    height: 0;
    transform: translateX(-50%);
    border: 40px solid transparent;
    border-top: 0;
    border-bottom: 70px solid var(--muted);
  }

  .msg {
    margin-top: 14px;
  }
</style>
