<script>
  import { MODES, SUBJECTS, NEXT_AFTER_LEVEL } from '../lib/modes.js';
  import { STICKERS } from '../lib/stickers.js';
  import { settings, setSubject, progress, streak, practicedToday, unlockedStickers, getBest } from '../lib/settings.svelte.js';
  import { play } from '../lib/sound.js';

  const letterColors = ['var(--coral)', 'var(--sun)', 'var(--lime)', 'var(--sky)', 'var(--grape)', 'var(--pink)'];
  const words = ['Pintar', 'Bermain'];
  let n = 0;
  const title = words.map((w) => [...w].map((ch) => ({ ch, color: letterColors[n % 6], delay: n++ * 0.08 })));

  const days = $derived(streak());
  const today = $derived(practicedToday());
  const stickers = $derived(unlockedStickers());
  const subject = $derived(SUBJECTS.find((s) => s.id === settings.subject) ?? SUBJECTS[0]);

  // nomor urut kartu di tab ini, dan level mana saja yang sudah dapat bintang
  const steps = $derived(
    subject.groups.map((g, gi) => {
      const before = subject.groups.slice(0, gi).reduce((n, x) => n + x.modes.length, 0);
      return g.modes.map((id, i) => {
        const mode = MODES[id];
        return { mode, no: before + i + 1, done: mode.levels.map((_, k) => getBest(`${id}-${k}`) > 0) };
      });
    }),
  );
  // saran berikutnya: kartu pertama yang Level 3-nya belum berbintang, mulai dari level pertama yang belum dimainkan
  const next = $derived.by(() => {
    const step = steps.flat().find((s) => !s.done[NEXT_AFTER_LEVEL - 1]);
    if (!step) return null;
    return { ...step, level: step.done.indexOf(false) + 1, fresh: !step.done.some(Boolean) };
  });

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

{#if next}
  <a class="next" href="#/{next.mode.id}/{next.level}" style="--c:{next.mode.color}">
    <span class="icon">{next.mode.icon}</span>
    <span class="next-info">
      <small>{next.fresh ? (next.no === 1 ? 'Mulai dari sini' : 'Langkah berikutnya') : 'Lanjut belajar'}</small>
      <b>{next.no}. {next.mode.title}</b>
      <span>Level {next.level} · {next.mode.levels[next.level - 1].desc}</span>
    </span>
    <span class="go" aria-hidden="true">▶</span>
  </a>
{:else}
  <p class="all-done">🎉 Semua kartu di tab ini sudah sampai Level {NEXT_AFTER_LEVEL}. Coba level yang lebih sulit, ya!</p>
{/if}

<p class="guide">
  Kartu diurutkan dari usia termuda. Ikuti nomornya, dan pindah ke kartu berikutnya setelah Level {NEXT_AFTER_LEVEL}
  dapat bintang. Usia hanya patokan, sesuaikan dengan kemampuan anak.
</p>

{#each subject.groups as group, gi (group.title + subject.id)}
  <h2 class="group">
    <span class="g-icon">{group.icon}</span>
    <span>{group.title}</span>
    <span class="age">{group.age}</span>
  </h2>
  <section class="modes">
    {#each steps[gi] as { mode, no, done }, i}
      <a
        class="mode"
        class:current={next?.mode.id === mode.id}
        href="#/{mode.id}"
        style="--c:{mode.color}; --tilt:{i % 2 ? 1.5 : -1.5}deg"
      >
        <span class="no">{no}</span>
        <span class="icon">{mode.icon}</span>
        <span class="name">{mode.title}</span>
        <span class="tagline">{mode.tagline}</span>
        <span class="dots" aria-label="{done.filter(Boolean).length} dari {done.length} level berbintang">
          {#each done as d}<i class:on={d}></i>{/each}
        </span>
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

  .next {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid var(--c);
  }

  .next:active {
    transform: scale(0.98);
  }

  .next .icon {
    flex: none;
    width: 58px;
    height: 58px;
    margin: 0;
    font-size: 1.7rem;
  }

  .next-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    line-height: 1.25;
    min-width: 0;
  }

  .next-info small {
    color: var(--c);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.8rem;
  }

  .next-info b {
    font-size: 1.25rem;
  }

  .next-info span {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .go {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--c);
    color: #fff;
    font-size: 1.1rem;
    animation: bob 1.6s ease-in-out infinite;
  }

  .all-done {
    margin-top: 16px;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--soft-sun);
    text-align: center;
    font-weight: 600;
  }

  .guide {
    margin: 12px 4px 0;
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 22px 4px 10px;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .g-icon {
    font-size: 1.4rem;
    line-height: 1;
  }

  .age {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--card);
    box-shadow: var(--shadow);
    color: var(--muted);
    font-size: 0.85rem;
  }

  .mode {
    position: relative;
  }

  .mode.current {
    border-color: var(--c);
  }

  .no {
    position: absolute;
    top: 8px;
    left: 10px;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--c);
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .dots {
    display: flex;
    gap: 5px;
    margin-top: 6px;
  }

  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line);
  }

  .dots i.on {
    background: var(--sun);
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
