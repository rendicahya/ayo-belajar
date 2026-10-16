<script>
  import { SHAPES } from '../lib/generate.js';

  /**
   * Gambar bangun datar. mark = 'sides' | 'corners' membuat sisi/titik sudut bisa diketuk
   * untuk ditandai (membantu menghitung).
   */
  let { shape, size = 200, mark = null, marked = [], onmark = null, selected = false } = $props();

  const def = $derived(SHAPES[shape.id]);
  const pts = $derived(def.pts ?? []);
  const edges = $derived(pts.map((p, i) => [p, pts[(i + 1) % pts.length]]));
  const order = (i) => marked.indexOf(i) + 1;
</script>

<svg viewBox="-6 -6 112 116" width={size} height={size} class:selected role="img" aria-label={def.name}>
  <g transform="rotate({shape.rot} 50 52) translate(50 52) scale({shape.scale}) translate(-50 -52)" style="--c:{shape.color}">
    {#if def.circle}
      <circle cx="50" cy="52" r="44" class="fill" />
    {:else}
      <polygon points={pts.map((p) => p.join(',')).join(' ')} class="fill" />
    {/if}

    {#if mark === 'sides'}
      {#each edges as [a, b], i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <g class="hit" role="button" tabindex="-1" aria-label="Sisi {i + 1}" onclick={() => onmark?.(i)}>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="wide" />
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="edge" class:on={marked.includes(i)} />
          {#if marked.includes(i)}
            <circle cx={(a[0] + b[0]) / 2} cy={(a[1] + b[1]) / 2} r="7" class="badge" />
            <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 + 3.6} transform="rotate({-shape.rot} {(a[0] + b[0]) / 2} {(a[1] + b[1]) / 2})">{order(i)}</text>
          {/if}
        </g>
      {/each}
    {:else if mark === 'corners'}
      {#each pts as p, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <g class="hit" role="button" tabindex="-1" aria-label="Titik sudut {i + 1}" onclick={() => onmark?.(i)}>
          <circle cx={p[0]} cy={p[1]} r="11" class="wide" />
          <circle cx={p[0]} cy={p[1]} r={marked.includes(i) ? 7 : 4.5} class="corner" class:on={marked.includes(i)} />
          {#if marked.includes(i)}
            <text x={p[0]} y={p[1] + 3.6} transform="rotate({-shape.rot} {p[0]} {p[1]})">{order(i)}</text>
          {/if}
        </g>
      {/each}
    {/if}
  </g>
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
    overflow: visible;
  }

  .fill {
    fill: color-mix(in srgb, var(--c) 30%, transparent);
    stroke: var(--c);
    stroke-width: 4;
    stroke-linejoin: round;
  }

  .selected .fill {
    fill: color-mix(in srgb, var(--c) 70%, transparent);
  }

  .hit {
    cursor: pointer;
    outline: none;
  }

  .wide {
    stroke: transparent;
    fill: transparent;
    stroke-width: 16;
  }

  .edge {
    stroke: transparent;
    stroke-width: 6;
    stroke-linecap: round;
  }

  .edge.on {
    stroke: var(--sun);
  }

  .corner {
    fill: var(--card);
    stroke: var(--c);
    stroke-width: 2.5;
  }

  .corner.on {
    fill: var(--sun);
    stroke: var(--sun);
  }

  .badge {
    fill: var(--sun);
  }

  text {
    text-anchor: middle;
    font-size: 10px;
    font-weight: 700;
    fill: #2d2a4a;
    font-family: inherit;
    pointer-events: none;
  }
</style>
