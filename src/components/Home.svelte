<script>
  import { MODES, SUBJECTS } from '../lib/modes.js';
  import { STICKERS } from '../lib/stickers.js';
  import { settings, setSubject, progress, streak, practicedToday, unlockedStickers } from '../lib/settings.svelte.js';
  import { play } from '../lib/sound.js';

  const letterColors = ['var(--coral)', 'var(--sun)', 'var(--lime)', 'var(--sky)', 'var(--grape)', 'var(--pink)'];
  const words = ['Pintar', 'Bermain'];
  let n = 0;
  const title = words.map((w) => [...w].map((ch) => ({ ch, color: letterColors[n % 6], delay: n++ * 0.08 })));

  const days = $derived(streak());
  const today = $derived(practicedToday());
  const stickers = $derived(unlockedStickers());
  const subject = $derived(SUBJECTS.find((s) => s.id === settings.subject) ?? SUBJECTS[0]);

  function choose(s) {
    if (s.id === subject.id) return;
    play('tap');
    setSubject(s.id);
  }
</script>

<section class="hero">
  <h1 aria-label="Pintar Bermain">
    {#each title as word}
      <span class="word">
        {#each word as l}
          <span class="letter" style="color:{l.color}; animation-delay:{l.delay}s">{l.ch}</span>
        {/each}
      </span>
    {/each}
  </h1>
  <p class="sub">Ayo belajar berhitung, menulis, dan membaca sambil bermain! 🎈</p>
</section>

<section class="stats">
  <div class="stat streak" class:lit={today}>
    <span class="big">🔥</span>
    <span>
      {#if days > 0}
        <b>{days} hari</b> berturut-turut
        <small>{today ? 'Hari ini sudah latihan ✅' : 'Ayo latihan hari ini!'}</small>
      {:else}
        <b>Mulai latihan</b>
        <small>Main tiap hari supaya apinya menyala</small>
      {/if}
    </span>
  </div>
  <a class="stat album" href="#/stiker">
    <span class="big">📒</span>
    <span>
      <b>Stiker {stickers}/{STICKERS.length}</b>
      <small>⭐ {progress.totalStars} bintang terkumpul</small>
    </span>
  </a>
</section>

<div class="subjects" role="tablist" aria-label="Mata pelajaran">
  {#each SUBJECTS as s}
    <button
      class="subject"
      class:on={s.id === subject.id}
      style="--c:{s.color}"
      role="tab"
      aria-selected={s.id === subject.id}
      onclick={() => choose(s)}
    >
      <span class="s-icon">{s.icon}</span>{s.title}
    </button>
  {/each}
</div>

{#each subject.groups as group (group.title + subject.id)}
  <h2 class="group">{group.title}</h2>
  <section class="modes">
    {#each group.modes.map((id) => MODES[id]) as mode, i}
      <a class="mode" href="#/{mode.id}" style="--c:{mode.color}; --tilt:{i % 2 ? 1.5 : -1.5}deg">
        <span class="icon">{mode.icon}</span>
        <span class="name">{mode.title}</span>
        <span class="tagline">{mode.tagline}</span>
      </a>
    {/each}
  </section>
{/each}

<style>
  .hero {
    text-align: center;
    padding: 8px 0 18px;
  }

  h1 {
    font-size: clamp(2.5rem, 11vw, 4.6rem);
    font-weight: 700;
    line-height: 1.05;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 0.35em;
    text-shadow: 0 4px 0 rgba(45, 42, 74, 0.12);
  }

  .word {
    white-space: nowrap;
  }

  .letter {
    display: inline-block;
    animation: bob 2.4s ease-in-out infinite;
  }

  .sub {
    margin-top: 10px;
    font-size: 1.2rem;
    color: var(--muted);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 8px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    line-height: 1.2;
  }

  .stat small {
    display: block;
    color: var(--muted);
    font-size: 0.85rem;
    margin-top: 2px;
  }

  .stat .big {
    font-size: 2.2rem;
    line-height: 1;
  }

  .streak:not(.lit) .big {
    filter: grayscale(1);
    opacity: 0.5;
  }

  .streak.lit .big {
    animation: bob 1.6s ease-in-out infinite;
  }

  .album:active {
    transform: scale(0.98);
  }

  .subjects {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 18px;
    padding: 6px;
    border-radius: calc(var(--radius) + 6px);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .subject {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 6px;
    border-radius: var(--radius);
    font-size: clamp(1rem, 4.2vw, 1.2rem);
    font-weight: 600;
    color: var(--muted);
    transition:
      background 0.15s,
      color 0.15s;
  }

  .subject.on {
    background: var(--c);
    color: #fff;
    box-shadow: inset 0 -5px 0 rgba(0, 0, 0, 0.15);
  }

  .s-icon {
    font-size: 1.3em;
    line-height: 1;
  }

  @media (max-width: 380px) {
    .subject {
      flex-direction: column;
      gap: 2px;
    }
  }

  .group {
    margin: 22px 4px 10px;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--muted);
  }

  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(46%, 200px), 1fr));
    gap: 12px;
  }

  .mode {
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 4px;
    padding: 16px 10px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid transparent;
    text-align: center;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .mode:hover {
    transform: rotate(var(--tilt)) scale(1.02);
    border-color: var(--c);
  }

  .mode:active {
    transform: scale(0.97);
  }

  .icon {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    margin-bottom: 4px;
    border-radius: 22px;
    background: var(--c);
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.15);
  }

  .name {
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .tagline {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.25;
  }

  @media (max-width: 420px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>
