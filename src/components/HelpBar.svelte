<script>
  import { speak, canSpeak } from '../lib/speech.js';

  let { board } = $props();
</script>

<div class="help">
  {#if board.help}
    <div class="bubble" aria-live="polite">
      <span class="owl" aria-hidden="true">🦉</span>
      <p>{board.help.text}</p>
      {#if canSpeak}
        <button class="say" onclick={() => speak(board.help.text)} aria-label="Bacakan">🔊</button>
      {/if}
    </div>
  {/if}

  <div class="buttons">
    {#if board.playing}
      <button class="btn" style="--c:var(--grape)" onclick={() => board.nextStep()}>
        {board.isLastStep ? 'Selesai ✔' : 'Langkah berikutnya ➜'}
      </button>
    {:else if !board.solved}
      <button class="btn light small" onclick={() => board.hint()}>💡 Petunjuk</button>
      {#if board.attempts >= 2}
        <button class="btn light small" onclick={() => board.startSolution()}>👀 Lihat cara</button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .help {
    display: grid;
    gap: 10px;
    justify-items: center;
    width: 100%;
  }

  .bubble {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: min(100%, 460px);
    padding: 12px 14px;
    border-radius: 20px;
    background: var(--soft-sun);
    border: 3px solid var(--sun);
    animation: pop 0.25s ease-out;
  }

  .owl {
    font-size: 2rem;
    line-height: 1;
  }

  p {
    flex: 1;
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .say {
    font-size: 1.4rem;
    line-height: 1;
    padding: 4px;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
</style>
