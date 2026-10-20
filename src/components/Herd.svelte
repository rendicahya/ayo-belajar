<script>
  /** Sekelompok hewan (dari genCount/genNumeral) yang sedikit miring-miring supaya terlihat hidup. */
  let { field } = $props();
</script>

<span class="herd">
  {#each field as a, i}
    <span class="animal" style="--r:{a.rot}deg; --dy:{a.dy}px; --d:{i * 0.05}s">{a.emoji}</span>
  {/each}
</span>

<style>
  .herd {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .animal {
    display: inline-block;
    padding: 2px;
    font-size: clamp(1.7rem, 7vw, 2.4rem);
    line-height: 1;
    transform: translateY(var(--dy)) rotate(var(--r));
    animation: pop 0.35s ease-out backwards;
    animation-delay: var(--d, 0s);
  }
</style>
