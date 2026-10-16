<script>
  /** Deretan tombol pilihan berwarna. `item` (snippet) menggambar isi tombol bila perlu. */
  let { options, isRight, onpick, wrong = [], solved = false, item = null, wide = false } = $props();
</script>

<div class="choices" class:wide>
  {#each options as o, i}
    <button
      class="choice"
      class:wrong={wrong.includes(i)}
      class:right={solved && isRight(o)}
      disabled={solved || wrong.includes(i)}
      onclick={() => onpick(o, i)}
    >
      {#if item}{@render item(o)}{:else}{o}{/if}
    </button>
  {/each}
</div>

<style>
  .choices {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    max-width: 640px;
    margin: 0 auto;
  }

  .choice {
    flex: 0 1 120px;
    min-width: 72px;
    padding: 14px 6px;
    border-radius: var(--radius);
    background: var(--sky);
    color: #fff;
    font-size: clamp(1.5rem, 6.5vw, 2.1rem);
    font-weight: 700;
    line-height: 1.1;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
    transition: opacity 0.2s;
  }

  .wide .choice {
    flex-basis: 260px;
    font-size: clamp(1.15rem, 4.6vw, 1.4rem);
    font-weight: 600;
  }

  .choice:nth-child(4n + 2) {
    background: var(--grape);
  }

  .choice:nth-child(4n + 3) {
    background: var(--pink);
  }

  .choice:nth-child(4n + 4) {
    background: var(--orange);
  }

  .choice:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .choice.wrong {
    opacity: 0.3;
  }

  .choice.right {
    background: var(--ok);
  }
</style>
