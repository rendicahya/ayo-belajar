<script>
  /** Satu keping uang: koin (≤ 500) atau lembaran kertas. */
  let { value, onclick = null, small = false } = $props();

  const NOTES = {
    1000: '#7fae8c',
    2000: '#8a9bb8',
    5000: '#b4874d',
    10000: '#9a68c6',
    20000: '#3f9d63',
    50000: '#3a7cc3',
    100000: '#df4f48',
  };
  const coin = $derived(value < 1000);
  const label = $derived(String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
</script>

<svelte:element
  this={onclick ? 'button' : 'span'}
  class="money"
  class:coin
  class:note={!coin}
  class:small
  style="--c:{NOTES[value] ?? '#b9bcc6'}"
  aria-label="{label} rupiah"
  {onclick}
  role={onclick ? undefined : 'img'}
>
  <b>{label}</b>
  {#if !coin}<small>RUPIAH</small>{/if}
</svelte:element>

<style>
  .money {
    display: inline-grid;
    place-items: center;
    align-content: center;
    flex: none;
    color: #fff;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    user-select: none;
    animation: pop 0.25s ease-out;
  }

  .note {
    width: 104px;
    height: 54px;
    border-radius: 8px;
    background:
      radial-gradient(circle at 78% 50%, rgba(255, 255, 255, 0.35) 0 13px, transparent 14px),
      linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 70%, #000));
    border: 3px solid rgba(255, 255, 255, 0.55);
    box-shadow: 0 4px 0 rgba(45, 42, 74, 0.18);
  }

  .note b {
    font-size: 1.25rem;
    margin-right: 22px;
  }

  .note small {
    font-size: 0.55rem;
    letter-spacing: 0.15em;
    margin: 3px 22px 0 0;
    opacity: 0.9;
  }

  .coin {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #f4f5f8, #b3b7c2 60%, #8d919c);
    border: 3px solid #9ea2ad;
    color: #4a4d57;
    box-shadow: 0 4px 0 rgba(45, 42, 74, 0.18);
  }

  .coin b {
    font-size: 1.1rem;
  }

  .small.note {
    width: 84px;
    height: 44px;
  }

  .small.note b {
    font-size: 1.05rem;
  }

  .small.coin {
    width: 46px;
    height: 46px;
  }

  button.money:active {
    transform: translateY(3px);
  }
</style>
