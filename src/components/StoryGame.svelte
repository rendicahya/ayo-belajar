<script>
  import { untrack } from 'svelte';
  import { genStory } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, canSpeak } from '../lib/speech.js';
  import ColumnGame from './ColumnGame.svelte';
  import DivisionGame from './DivisionGame.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const story = genStory(level);

  const OPS = {
    tambah: { sym: '+', label: 'Penjumlahan', color: 'var(--coral)' },
    kurang: { sym: '−', label: 'Pengurangan', color: 'var(--sky)' },
    kali: { sym: '×', label: 'Perkalian', color: 'var(--pink)' },
    bagi: { sym: '÷', label: 'Pembagian', color: 'var(--teal)' },
  };
  // Selalu tampilkan minimal tambah & kurang supaya tetap ada pilihan
  const options = level.ops.length > 1 ? level.ops : ['tambah', 'kurang'];

  let phase = $state('choose');
  let wrong = $state([]);
  let opAttempts = 0;

  const equation =
    story.op === 'bagi'
      ? `${story.problem.dividend} ÷ ${story.problem.divisor}`
      : story.problem.operands.join(` ${OPS[story.op].sym} `);

  function choose(op) {
    if (phase !== 'choose' || wrong.includes(op)) return;
    if (op === story.op) {
      phase = 'solve';
      play('pop');
    } else {
      opAttempts++;
      wrong = [...wrong, op];
      play('wrong');
    }
  }

  const solved = (firstTry, info) => props.onSolved(firstTry && opAttempts === 0, info);
</script>

<div class="story">
  <div class="pic" aria-hidden="true">{story.emoji}</div>
  <p>{story.text}</p>
  {#if canSpeak}
    <button class="say" onclick={() => speak(story.text)} aria-label="Bacakan cerita">🔊</button>
  {/if}
</div>

{#if phase === 'choose'}
  <p class="hint">Hitungan apa yang dipakai untuk menjawabnya?</p>
  <div class="ops">
    {#each options as op}
      <button
        class="op"
        style="--c:{OPS[op].color}"
        class:wrong={wrong.includes(op)}
        disabled={wrong.includes(op)}
        onclick={() => choose(op)}
      >
        <span class="sym">{OPS[op].sym}</span>
        <span>{OPS[op].label}</span>
      </button>
    {/each}
  </div>
  {#if wrong.length}<p class="msg bad">Coba baca lagi ceritanya, ya! 📖</p>{/if}
{:else}
  <p class="equation">{equation} = ?</p>
  {#if story.op === 'bagi'}
    <DivisionGame level={level} problem={story.problem} compact onSolved={solved} />
  {:else}
    <ColumnGame op={story.op} level={level} problem={story.problem} compact onSolved={solved} />
  {/if}
{/if}

<style>
  .story {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid var(--rose);
  }

  .pic {
    font-size: 2.6rem;
    line-height: 1;
  }

  .story p {
    flex: 1;
    font-size: 1.2rem;
    line-height: 1.45;
  }

  .say {
    font-size: 1.6rem;
    line-height: 1;
    padding: 4px;
  }

  .hint {
    margin-top: 18px;
  }

  .ops {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    max-width: 640px;
    margin: 14px auto 0;
  }

  .op {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 14px 8px;
    border-radius: var(--radius);
    background: var(--c);
    color: #fff;
    font-weight: 600;
    font-size: 1.1rem;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .op:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .op.wrong {
    opacity: 0.3;
  }

  .sym {
    font-size: 2.4rem;
    line-height: 1;
  }

  .msg {
    margin-top: 14px;
  }

  .equation {
    margin-top: 14px;
    text-align: center;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--rose);
  }
</style>
