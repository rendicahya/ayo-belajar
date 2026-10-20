<script>
  import { untrack } from 'svelte';
  import { genGroup } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import AskBar from './AskBar.svelte';
  import Shape from './Shape.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const { baskets, items } = genGroup(level);
  const { type } = level;

  const question = {
    kind: 'Masukkan hewan ke keranjangnya!',
    color: 'Kelompokkan menurut warnanya!',
    shape: 'Kelompokkan menurut bentuknya!',
    size: 'Pisahkan yang besar dan yang kecil!',
    category: 'Hewan, buah, atau kendaraan?',
  }[type];

  let placed = $state({}); // id benda → kunci keranjang
  let selected = $state(null);
  let drag = $state(null);
  let bounce = $state({ key: null, n: 0 });
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  const pile = $derived(items.filter((it) => !placed[it.id]));

  function drop(id, key) {
    selected = null;
    const it = items[id];
    if (it.key === key) {
      placed[id] = key;
      play('pop');
      message = { text: '', kind: '' };
      if (Object.keys(placed).length === items.length) {
        solved = true;
        message = { text: 'Hebat, semuanya sudah di keranjang yang tepat!', kind: 'ok' };
        play('correct');
        say(message.text);
        props.onSolved(attempts === 0);
      }
    } else {
      attempts++;
      bounce = { key, n: bounce.n + 1 };
      message = { text: 'Belum tepat, coba keranjang yang lain. 💪', kind: 'bad' };
      play('wrong');
    }
  }

  function down(e, it) {
    if (solved || e.button > 0) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    drag = { id: it.id, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }

  function move(e) {
    if (!drag) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    if (!drag.moved && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) >= 8) {
      drag.moved = true;
      selected = null;
      play('tap');
    }
  }

  function up(e) {
    if (drag?.moved) {
      const key = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-basket]')?.dataset.basket;
      if (key) drop(drag.id, key);
    } else if (drag) {
      // ketukan tanpa geser: pilih bendanya, lalu ketuk keranjangnya
      selected = selected === drag.id ? null : drag.id;
      play('tap');
    }
    cancel();
  }

  function cancel() {
    drag = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
  }

  $effect(() => cancel);

  function tapBasket(key) {
    if (solved) return;
    if (selected !== null) drop(selected, key);
    else message = { text: 'Ketuk bendanya dulu, atau geser ke keranjang.', kind: 'nudge' };
  }
</script>

{#snippet thing(it, small)}
  {#if it.shape}
    <Shape shape={it.shape} size={small ? 38 : 64} selected />
  {:else}
    <span class="emoji" class:big={it.big === true} class:little={it.big === false} class:small>{it.emoji}</span>
  {/if}
{/snippet}

<AskBar text={question} />
<p class="hint">Geser bendanya ke keranjang, atau ketuk bendanya lalu ketuk keranjangnya.</p>

<div class="pile">
  {#each pile as it (it.id)}
    <button
      class="item"
      class:picked={selected === it.id}
      class:hidden={drag?.moved && drag.id === it.id}
      onpointerdown={(e) => down(e, it)}
      onkeydown={(e) => e.key === 'Enter' && (selected = it.id)}
      aria-label="Benda {it.id + 1}"
    >
      {@render thing(it, false)}
    </button>
  {:else}
    <span class="empty">{solved ? '🎉' : ''}</span>
  {/each}
</div>

<div class="baskets" style="--n:{baskets.length}">
  {#each baskets as b}
    {#key bounce.key === b.key ? bounce.n : 0}
      <button class="basket" class:bad={bounce.key === b.key && bounce.n > 0} class:ready={selected !== null} data-basket={b.key} onclick={() => tapBasket(b.key)}>
        <span class="label">
          {#if b.color}
            <span class="swatch" style="background:{b.color}"></span>
          {:else if b.shape}
            <Shape shape={{ id: b.shape, color: 'var(--muted)', rot: 0, scale: 1 }} size={30} />
          {:else}
            <span class="emoji tag" class:little={b.big === false}>{b.emoji}</span>
          {/if}
          {b.label}
        </span>
        <span class="inside">
          {#each items.filter((it) => placed[it.id] === b.key) as it (it.id)}
            <span class="in">{@render thing(it, true)}</span>
          {/each}
        </span>
      </button>
    {/key}
  {/each}
</div>

{#if drag?.moved}
  {@const it = items[drag.id]}
  <div class="ghost" style="left:{drag.x - drag.dx}px; top:{drag.y - drag.dy}px; width:{drag.w}px; height:{drag.h}px">
    {@render thing(it, false)}
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .pile {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    min-height: 100px;
    max-width: 620px;
    margin: 14px auto;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    user-select: none;
  }

  .item {
    display: grid;
    place-items: center;
    width: 82px;
    height: 82px;
    border-radius: 20px;
    border: 4px solid transparent;
    touch-action: none;
    cursor: grab;
    animation: pop 0.3s ease-out backwards;
  }

  .item.picked {
    border-color: var(--sun);
    background: var(--active-bg);
    animation: bob 0.9s ease-in-out infinite;
  }

  .item.hidden {
    opacity: 0.2;
  }

  .empty {
    font-size: 3rem;
  }

  .emoji {
    font-size: 2.8rem;
    line-height: 1;
  }

  .emoji.big {
    font-size: 3.4rem;
  }

  .emoji.little {
    font-size: 1.6rem;
  }

  .emoji.small {
    font-size: 1.7rem;
  }

  .emoji.small.big {
    font-size: 2rem;
  }

  .emoji.small.little {
    font-size: 1.05rem;
  }

  .baskets {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 10px;
    max-width: 620px;
    margin: 0 auto;
  }

  .basket {
    display: grid;
    align-content: start;
    gap: 8px;
    min-width: 0;
    min-height: 170px;
    padding: 10px 4px 14px;
    border-radius: 18px 18px 32px 32px;
    background: color-mix(in srgb, var(--orange) 14%, var(--card));
    border: 4px solid color-mix(in srgb, var(--orange) 55%, transparent);
    box-shadow: var(--shadow);
  }

  .basket.ready {
    border-style: dashed;
    border-color: var(--sun);
  }

  .basket.bad {
    animation: shake 0.4s;
    border-color: var(--bad);
  }

  .label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    font-size: clamp(0.9rem, 3.8vw, 1.1rem);
    font-weight: 700;
    text-transform: capitalize;
  }

  .emoji.tag {
    font-size: 1.8rem;
  }

  .emoji.tag.little {
    font-size: 1.1rem;
  }

  .swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
  }

  .inside {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }

  .in {
    animation: pop 0.3s ease-out;
  }

  .ghost {
    position: fixed;
    z-index: 800;
    display: grid;
    place-items: center;
    pointer-events: none;
    transform: scale(1.15) rotate(-6deg);
    filter: drop-shadow(0 10px 12px rgba(45, 42, 74, 0.3));
  }

  .msg {
    margin-top: 14px;
  }
</style>
