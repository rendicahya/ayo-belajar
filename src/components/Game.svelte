<script>
  import ColumnGame from './ColumnGame.svelte';
  import CompareGame from './CompareGame.svelte';
  import SortGame from './SortGame.svelte';
  import DivisionGame from './DivisionGame.svelte';
  import PlaceValueGame from './PlaceValueGame.svelte';
  import StoryGame from './StoryGame.svelte';
  import LongDivisionGame from './LongDivisionGame.svelte';
  import JumpGame from './JumpGame.svelte';
  import FractionGame from './FractionGame.svelte';
  import MoneyGame from './MoneyGame.svelte';
  import FactsGame from './FactsGame.svelte';
  import PatternGame from './PatternGame.svelte';
  import MeasureGame from './MeasureGame.svelte';
  import ShapeGame from './ShapeGame.svelte';
  import CountGame from './CountGame.svelte';
  import { TOTAL_ROUNDS } from '../lib/modes.js';
  import { pick } from '../lib/generate.js';
  import { confetti } from '../lib/confetti.js';
  import { play } from '../lib/sound.js';
  import { getBest, saveBest, recordSolve } from '../lib/settings.svelte.js';

  let { mode, levelIndex } = $props();

  const games = {
    column: ColumnGame,
    division: DivisionGame,
    compare: CompareGame,
    sort: SortGame,
    place: PlaceValueGame,
    story: StoryGame,
    longdiv: LongDivisionGame,
    jump: JumpGame,
    fraction: FractionGame,
    money: MoneyGame,
    facts: FactsGame,
    pattern: PatternGame,
    measure: MeasureGame,
    shape: ShapeGame,
    count: CountGame,
  };
  const praises = ['Hebat!', 'Pintar!', 'Keren!', 'Luar biasa!', 'Mantap!', 'Jago!', 'Benar sekali!'];
  const cheers = ['🎉', '🥳', '🌟', '🚀', '🦄', '🐯', '🍭'];

  const level = $derived(mode.levels[levelIndex]);
  const Game = $derived(games[mode.kind]);
  const bestKey = $derived(`${mode.id}-${levelIndex}`);

  let round = $state(1);
  let results = $state([]); // true = benar di percobaan pertama
  let phase = $state('play'); // play | celebrate | done
  let praise = $state({ text: '', icon: '', note: '' });
  let reward = $state({ sticker: null, streak: 0 });
  let previousBest = $state(0);
  const stars = $derived(results.filter(Boolean).length);

  function handleSolved(firstTry, info = {}) {
    results.push(firstTry);
    reward = recordSolve(firstTry);
    praise = firstTry
      ? { text: pick(praises), icon: pick(cheers), note: 'Kamu dapat bintang! ⭐' }
      : info.shown
        ? { text: 'Sudah paham?', icon: '🦉', note: 'Sekarang kamu tahu caranya. Coba soal berikutnya sendiri, ya! 💪' }
        : { text: 'Benar!', icon: '👍', note: 'Lain kali pasti bisa langsung benar 💪' };
    // beri waktu sebentar supaya anak melihat jawabannya berubah hijau
    setTimeout(() => {
      phase = 'celebrate';
      confetti();
    }, info.shown ? 900 : 600);
  }

  function next() {
    if (round < TOTAL_ROUNDS) {
      round++;
      phase = 'play';
      return;
    }
    previousBest = getBest(bestKey);
    saveBest(bestKey, stars);
    phase = 'done';
    play('win');
    confetti();
  }

  function restart() {
    round = 1;
    results = [];
    phase = 'play';
  }

  function onkeydown(e) {
    if (phase === 'celebrate' && e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="topbar">
  <span class="chip" style="--c:{mode.color}">{level.emoji} Level {levelIndex + 1} · {level.name}</span>
  <ol class="dots" aria-label="Kemajuan soal">
    {#each { length: TOTAL_ROUNDS } as _, i}
      <li
        class:current={i === round - 1 && phase !== 'done'}
        class:star={results[i] === true}
        class:solved={results[i] === false}
      >
        {results[i] === true ? '⭐' : results[i] === false ? '✓' : i + 1}
      </li>
    {/each}
  </ol>
</div>

{#if phase === 'done'}
  <section class="summary">
    <div class="trophy">{stars >= 8 ? '🏆' : stars >= 5 ? '🏅' : '🌱'}</div>
    <h2>{stars >= 8 ? 'Kamu jago banget!' : stars >= 5 ? 'Bagus sekali!' : 'Terus berlatih, ya!'}</h2>
    <p class="score">⭐ {stars} <small>/ {TOTAL_ROUNDS}</small></p>
    {#if stars > previousBest && previousBest > 0}
      <p class="record">Rekor baru! Sebelumnya ⭐ {previousBest} 🎉</p>
    {:else if previousBest > 0}
      <p class="record">Rekor terbaik: ⭐ {previousBest}</p>
    {/if}
    <p class="hint">Bintang didapat kalau soal dijawab benar pada percobaan pertama tanpa petunjuk. Kumpulkan 5 bintang untuk 1 stiker!</p>
    <div class="actions">
      <button class="btn" style="--c:var(--coral)" onclick={restart}>🔁 Main lagi</button>
      {#if levelIndex < mode.levels.length - 1}
        <a class="btn" style="--c:var(--ok)" href="#/{mode.id}/{levelIndex + 2}">Level berikutnya ➜</a>
      {/if}
      <a class="btn light" href="#/{mode.id}">Pilih level</a>
    </div>
  </section>
{:else}
  {#key round}
    <Game {mode} {level} onSolved={handleSolved} />
  {/key}
{/if}

{#if phase === 'celebrate'}
  <div class="overlay">
    <div class="bubble" role="dialog" aria-live="polite">
      <div class="big">{praise.icon}</div>
      <h2>{praise.text}</h2>
      <p>{praise.note}</p>
      {#if reward.sticker}
        <div class="reward">
          <span class="sticker">{reward.sticker.emoji}</span>
          <span>Stiker baru: <b>{reward.sticker.name}</b>! Lihat di album 📒</span>
        </div>
      {/if}
      {#if reward.streak > 1}
        <div class="reward">🔥 <span>Hari ke-<b>{reward.streak}</b> berturut-turut latihan!</span></div>
      {:else if reward.streak === 1}
        <div class="reward">🔥 <span>Latihan pertama hari ini. Besok main lagi, ya!</span></div>
      {/if}
      <button class="btn" style="--c:var(--ok)" onclick={next}>
        {round < TOTAL_ROUNDS ? 'Lanjut ➜' : 'Lihat hasil 🏁'}
      </button>
    </div>
  </div>
{/if}

<style>
  .topbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px 16px;
    margin-bottom: 18px;
  }

  .chip {
    padding: 6px 16px;
    border-radius: 999px;
    background: var(--c);
    color: #fff;
    font-weight: 600;
  }

  .dots {
    display: flex;
    gap: 6px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .dots li {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--card);
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 600;
    box-shadow: 0 2px 0 var(--line);
  }

  .dots li.current {
    background: var(--sun);
    color: var(--on-sun);
    transform: scale(1.15);
  }

  .dots li.star {
    background: var(--soft-sun);
    font-size: 0.95rem;
  }

  .dots li.solved {
    background: var(--ok-soft);
    color: var(--ok);
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: grid;
    place-items: center;
    padding: 16px;
    background: var(--overlay);
    animation: fade 0.2s;
  }

  .bubble,
  .summary {
    text-align: center;
    background: var(--card);
    border-radius: 32px;
    box-shadow: var(--shadow);
    padding: 28px 32px;
    animation: pop 0.35s ease-out;
  }

  .bubble {
    display: grid;
    gap: 10px;
    justify-items: center;
    min-width: min(100%, 320px);
  }

  .big,
  .trophy {
    font-size: 4.5rem;
    line-height: 1;
    animation: bob 1.6s ease-in-out infinite;
  }

  h2 {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--ok);
  }

  .reward {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 16px;
    background: var(--soft-sun);
    text-align: left;
  }

  .sticker {
    font-size: 2.6rem;
    line-height: 1;
    animation: pop 0.5s ease-out;
  }

  .bubble p {
    color: var(--muted);
    font-size: 1.1rem;
    margin-bottom: 6px;
  }

  .summary {
    display: grid;
    gap: 12px;
    justify-items: center;
    max-width: 560px;
    margin: 0 auto;
  }

  .summary h2 {
    color: var(--grape);
  }

  .score {
    font-size: 3rem;
    font-weight: 700;
  }

  .score small {
    font-size: 1.5rem;
    color: var(--muted);
  }

  .record {
    font-weight: 500;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
  }

  @media (max-width: 480px) {
    .dots li {
      width: 24px;
      height: 24px;
    }
  }
</style>
