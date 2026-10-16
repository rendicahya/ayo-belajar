<script>
  let { oninput, onerase, oncheck, canCheck = false, disabled = false } = $props();
</script>

<div class="pad">
  <div class="keys">
    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 0] as d}
      <button class="key" {disabled} onclick={() => oninput(d)}>{d}</button>
    {/each}
  </div>
  <div class="row">
    <button class="btn light" {disabled} onclick={onerase} aria-label="Hapus">⌫ Hapus</button>
    <button class="btn" style="--c:var(--ok)" disabled={disabled || !canCheck} onclick={oncheck}>✔ Cek</button>
  </div>
</div>

<style>
  .pad {
    display: grid;
    gap: 14px;
    width: min(100%, 380px);
  }

  .keys {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  .key {
    aspect-ratio: 1;
    border-radius: 18px;
    background: var(--card);
    font-size: 2rem;
    font-weight: 600;
    box-shadow: 0 5px 0 var(--line);
    border: 3px solid var(--k);
    color: var(--k);
    user-select: none;
  }

  .key:nth-child(5n + 1) {
    --k: var(--coral);
  }
  .key:nth-child(5n + 2) {
    --k: #e09a00;
  }
  .key:nth-child(5n + 3) {
    --k: var(--lime);
  }
  .key:nth-child(5n + 4) {
    --k: var(--sky);
  }
  .key:nth-child(5n + 5) {
    --k: var(--grape);
  }

  .key:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 1px 0 var(--line);
  }

  .key:disabled {
    opacity: 0.4;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 12px;
  }
</style>
