<script>
  import { TOTAL_ROUNDS } from '../lib/modes.js';
  import { getBest } from '../lib/settings.svelte.js';

  let { mode } = $props();
</script>

<p class="hint">Pilih tingkat kesulitan. Setiap level ada {TOTAL_ROUNDS} soal — kumpulkan bintangnya! ⭐</p>

<div class="levels" style="--c:{mode.color}">
  {#each mode.levels as level, i}
    {@const best = getBest(`${mode.id}-${i}`)}
    <a class="level" href="#/{mode.id}/{i + 1}" style="animation-delay:{i * 0.06}s">
      <span class="emoji">{level.emoji}</span>
      <span class="info">
        <span class="name">Level {i + 1} · {level.name}</span>
        <span class="desc">{level.desc}</span>
      </span>
      {#if best > 0}
        <span class="best" title="Rekor terbaik">⭐ {best}</span>
      {/if}
    </a>
  {/each}
</div>

<style>
  .levels {
    display: grid;
    gap: 14px;
    margin-top: 20px;
    max-width: 620px;
    margin-inline: auto;
  }

  .level {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid transparent;
    animation: pop 0.35s ease-out both;
    transition: border-color 0.15s;
  }

  .level:hover {
    border-color: var(--c);
  }

  .level:active {
    transform: scale(0.98);
  }

  .emoji {
    font-size: 2.6rem;
    line-height: 1;
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .name {
    font-size: 1.3rem;
    font-weight: 600;
  }

  .desc {
    color: var(--muted);
  }

  .best {
    padding: 4px 12px;
    border-radius: 999px;
    background: #fff3cc;
    font-weight: 600;
    white-space: nowrap;
  }
</style>
