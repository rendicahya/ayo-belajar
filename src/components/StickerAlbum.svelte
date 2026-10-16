<script>
  import { STICKERS, STARS_PER_STICKER } from '../lib/stickers.js';
  import { progress, unlockedStickers } from '../lib/settings.svelte.js';
  import { speak } from '../lib/speech.js';

  const unlocked = $derived(unlockedStickers());
  const toNext = $derived(STARS_PER_STICKER - (progress.totalStars % STARS_PER_STICKER));
  const done = $derived(unlocked >= STICKERS.length);
</script>

<div class="head">
  <p class="count"><b>{unlocked}</b> / {STICKERS.length} stiker</p>
  {#if done}
    <p class="hint">Wah, semua stiker sudah terkumpul! Kamu juara! 👑</p>
  {:else}
    <div class="bar" aria-hidden="true">
      <span style="width:{((STARS_PER_STICKER - toNext) / STARS_PER_STICKER) * 100}%"></span>
    </div>
    <p class="hint">Kumpulkan <b>{toNext} ⭐</b> lagi untuk stiker berikutnya.</p>
  {/if}
</div>

<div class="grid">
  {#each STICKERS as s, i}
    {#if i < unlocked}
      <button class="sticker" onclick={() => speak(s.name)} style="animation-delay:{Math.min(i, 20) * 0.03}s">
        <span class="emoji">{s.emoji}</span>
        <span class="name">{s.name}</span>
      </button>
    {:else}
      <div class="sticker locked" aria-label="Stiker terkunci">
        <span class="emoji">❓</span>
        <span class="name">⭐ {(i + 1) * STARS_PER_STICKER}</span>
      </div>
    {/if}
  {/each}
</div>

<style>
  .head {
    display: grid;
    gap: 8px;
    justify-items: center;
    margin-bottom: 18px;
  }

  .count {
    font-size: 1.4rem;
  }

  .bar {
    width: min(100%, 320px);
    height: 16px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--sun), var(--coral));
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 10px;
  }

  .sticker {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 12px 4px;
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
    animation: pop 0.35s ease-out both;
  }

  .emoji {
    font-size: 2.6rem;
    line-height: 1;
  }

  .name {
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
  }

  .locked {
    background: var(--locked);
    box-shadow: none;
    border: 2px dashed var(--locked-line);
    color: var(--muted);
    animation: none;
  }

  .locked .emoji {
    opacity: 0.35;
  }
</style>
