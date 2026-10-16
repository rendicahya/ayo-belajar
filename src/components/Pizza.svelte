<script>
  /** Pizza yang dipotong d bagian sama besar; bagian di `filled` diberi topping. */
  let { d, filled = [], ontoggle = null, size = 200, bad = false } = $props();

  const R = 92;
  const slices = $derived(
    Array.from({ length: d }, (_, i) => {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / d;
      const a1 = a0 + (2 * Math.PI) / d;
      const mid = (a0 + a1) / 2;
      const p = (a, r = R) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
      // pepperoni di tengah potongan: [geser sudut, jarak dari pusat]; potongan besar dapat 2
      const spots = d <= 2 ? [[-0.5, 0.42], [0.45, 0.66]] : [[0, d <= 4 ? 0.55 : 0.62]];
      return {
        path: `M 0 0 L ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)} Z`,
        pep: spots.map(([da, rf]) => ({ x: Math.cos(mid + da) * R * rf, y: Math.sin(mid + da) * R * rf })),
        r: Math.max(7, 16 - d),
      };
    }),
  );

  function onkey(e, i) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ontoggle?.(i);
    }
  }
</script>

<svg viewBox="-104 -104 208 208" width={size} height={size} class:bad class:interactive={ontoggle} role="img" aria-label="Pizza {filled.length} dari {d} bagian">
  <circle r="102" class="crust" />
  {#each slices as s, i}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g
      class="slice"
      class:on={filled.includes(i)}
      role={ontoggle ? 'button' : undefined}
      tabindex={ontoggle ? 0 : undefined}
      aria-label={ontoggle ? `Potongan ${i + 1}` : undefined}
      onclick={() => ontoggle?.(i)}
      onkeydown={(e) => onkey(e, i)}
    >
      <path d={s.path} />
      {#if filled.includes(i)}
        {#each s.pep as p}
          <circle cx={p.x} cy={p.y} r={s.r} class="pep" />
        {/each}
      {/if}
    </g>
  {/each}
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
    filter: drop-shadow(0 5px 0 rgba(45, 42, 74, 0.1));
  }

  .crust {
    fill: #e0a458;
  }

  .slice path {
    fill: #fff6e2;
    stroke: #c98a3c;
    stroke-width: 3;
    stroke-linejoin: round;
    transition: fill 0.15s;
  }

  .slice.on path {
    fill: #ffc83d;
  }

  .pep {
    fill: #e8435f;
    stroke: #c1314b;
    stroke-width: 2;
    animation: pop 0.25s ease-out;
    transform-box: fill-box;
    transform-origin: center;
  }

  .interactive .slice {
    cursor: pointer;
    outline: none;
  }

  .interactive .slice:hover path,
  .interactive .slice:focus-visible path {
    stroke: var(--grape);
    stroke-width: 5;
  }

  .bad {
    animation: shake 0.4s;
  }
</style>
