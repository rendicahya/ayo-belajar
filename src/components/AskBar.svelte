<script>
  /** Pertanyaan besar untuk anak yang belum lancar membaca: dibacakan saat muncul dan bisa diulang. */
  import { untrack } from 'svelte';
  import { speak, say, canSpeak } from '../lib/speech.js';

  let { text, spoken = text } = $props();
  untrack(() => say(spoken));
</script>

<div class="ask">
  <p>{text}</p>
  {#if canSpeak}<button class="say" onclick={() => speak(spoken)} aria-label="Bacakan">🔊</button>{/if}
</div>

<style>
  .ask {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  p {
    font-size: clamp(1.3rem, 5.5vw, 1.8rem);
    font-weight: 700;
    text-align: center;
  }

  .say {
    font-size: 1.6rem;
    line-height: 1;
  }
</style>
