<script>
  import { MODES } from '../lib/modes.js';

  const letterColors = ['var(--coral)', 'var(--sun)', 'var(--lime)', 'var(--sky)', 'var(--grape)', 'var(--pink)'];
  const words = ['Jago', 'Berhitung'];
  let n = 0;
  const title = words.map((w) => [...w].map((ch) => ({ ch, color: letterColors[n % 6], delay: n++ * 0.08 })));
</script>

<section class="hero">
  <h1 aria-label="Jago Berhitung">
    {#each title as word}
      <span class="word">
        {#each word as l}
          <span class="letter" style="color:{l.color}; animation-delay:{l.delay}s">{l.ch}</span>
        {/each}
      </span>
    {/each}
  </h1>
  <p class="sub">Ayo belajar berhitung sambil bermain! 🎈</p>
</section>

<section class="modes">
  {#each Object.values(MODES) as mode, i}
    <a class="mode" href="#/{mode.id}" style="--c:{mode.color}; --tilt:{i % 2 ? 1.5 : -1.5}deg">
      <span class="icon">{mode.icon}</span>
      <span class="text">
        <span class="name">{mode.title}</span>
        <span class="tagline">{mode.tagline}</span>
      </span>
      <span class="go" aria-hidden="true">➜</span>
    </a>
  {/each}
</section>

<style>
  .hero {
    text-align: center;
    padding: 18px 0 28px;
  }

  h1 {
    font-size: clamp(2.6rem, 11vw, 4.6rem);
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
    margin-top: 12px;
    font-size: 1.25rem;
    color: var(--muted);
  }

  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
    gap: 18px;
  }

  .mode {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid transparent;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .mode:hover {
    transform: rotate(var(--tilt)) scale(1.02);
    border-color: var(--c);
  }

  .mode:active {
    transform: scale(0.98);
  }

  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 76px;
    height: 76px;
    border-radius: 22px;
    background: var(--c);
    color: #fff;
    font-size: 2.1rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    box-shadow: inset 0 -6px 0 rgba(0, 0, 0, 0.15);
  }

  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .tagline {
    color: var(--muted);
  }

  .go {
    font-size: 1.6rem;
    color: var(--c);
  }
</style>
