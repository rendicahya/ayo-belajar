<script>
  import { untrack } from 'svelte';
  import { flip } from 'svelte/animate';
  import { genSort } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';

  let props = $props();
  const level = untrack(() => props.level);

  const palette = ['#f2683f', '#2fa6dc', '#e09a00', '#5aae22', '#8f4fd9', '#ec4fa8'];
  const asc = level.order === 'asc';
  const { values, target } = genSort(level);

  let items = $state(values.map((value, i) => ({ id: i, value, color: palette[i % palette.length] })));
  let marks = $state({});
  let drag = $state(null);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;
  let listEl;

  function moveItem(from, to) {
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    items = next;
  }

  function reset() {
    marks = {};
    message = { text: '', kind: '' };
  }

  function down(e, item) {
    if (solved || e.button > 0) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    drag = {
      id: item.id,
      value: item.value,
      color: item.color,
      x: e.clientX,
      y: e.clientY,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      dx: e.clientX - r.left,
      dy: e.clientY - r.top,
      w: r.width,
      h: r.height,
    };
    reset();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function move(e) {
    if (!drag) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    // ketukan tanpa geser = bacakan bilangannya
    if (!drag.moved && Math.hypot(drag.x - drag.sx, drag.y - drag.sy) < 8) return;
    if (!drag.moved) play('tap');
    drag.moved = true;
    // Pakai offsetLeft/Top (posisi layout), bukan getBoundingClientRect, supaya
    // animasi flip yang sedang berjalan tidak membuat urutan bolak-balik.
    const base = listEl.getBoundingClientRect();
    let best = -1;
    let bestDist = Infinity;
    [...listEl.children].forEach((el, i) => {
      const cx = base.left + el.offsetLeft + el.offsetWidth / 2;
      const cy = base.top + el.offsetTop + el.offsetHeight / 2;
      const dist = (cx - e.clientX) ** 2 + (cy - e.clientY) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    const from = items.findIndex((it) => it.id === drag.id);
    if (best >= 0 && best !== from) moveItem(from, best);
  }

  function up() {
    if (drag?.moved) play('pop');
    else if (drag) speak(drag.value);
    drag = null;
    stopListening();
  }

  function stopListening() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }

  $effect(() => stopListening);

  // Alternatif keyboard: fokus kartu lalu tekan panah kiri/kanan
  function onkeydown(e, index) {
    if (solved) return;
    const to = e.key === 'ArrowLeft' ? index - 1 : e.key === 'ArrowRight' ? index + 1 : -1;
    if (to < 0 || to >= items.length) return;
    e.preventDefault();
    reset();
    moveItem(index, to);
    play('pop');
    const id = items[to].id;
    queueMicrotask(() => listEl.querySelector(`[data-id="${id}"]`)?.focus());
  }

  function check() {
    if (solved || drag) return;
    const next = {};
    let allGood = true;
    items.forEach((it, i) => {
      const good = it.value === target[i];
      next[it.id] = good ? 'ok' : 'bad';
      if (!good) allGood = false;
    });
    marks = next;
    if (allGood) {
      solved = true;
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      message = { text: 'Kartu yang merah belum di tempat yang benar. Geser lagi, ya! 💪', kind: 'bad' };
      play('wrong');
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Enter' && e.target.tagName !== 'BUTTON' && check()} />

<p class="hint">Geser kartunya sampai urut dari yang <b>{asc ? 'terkecil' : 'terbesar'}</b> ke yang <b>{asc ? 'terbesar' : 'terkecil'}</b>.<span class="sub">🔊 Ketuk kartu untuk mendengar bilangannya.</span></p>

<div class="scale" aria-hidden="true">
  <span>{asc ? '🐭 kecil' : '🐘 besar'}</span>
  <span class="arrow"></span>
  <span>{asc ? '🐘 besar' : '🐭 kecil'}</span>
</div>

<div class="cards" bind:this={listEl}>
  {#each items as item, i (item.id)}
    <button
      class="card"
      animate:flip={{ duration: 180 }}
      class:placeholder={drag?.moved && drag.id === item.id}
      class:ok={marks[item.id] === 'ok'}
      class:bad={marks[item.id] === 'bad'}
      style="--c:{item.color}"
      data-id={item.id}
      onpointerdown={(e) => down(e, item)}
      onkeydown={(e) => onkeydown(e, i)}
      aria-label="Bilangan {item.value}, posisi {i + 1}"
    >
      {item.value}
    </button>
  {/each}
</div>

{#if drag?.moved}
  <div
    class="card ghost"
    style="--c:{drag.color}; left:{drag.x - drag.dx}px; top:{drag.y - drag.dy}px; width:{drag.w}px; height:{drag.h}px"
  >
    {drag.value}
  </div>
{/if}

<div class="actions">
  <button class="btn" style="--c:var(--ok)" disabled={solved} onclick={check}>✔ Cek</button>
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .sub {
    display: block;
    font-size: 0.9em;
  }

  .scale {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 640px;
    margin: 18px auto 0;
    color: var(--muted);
    font-weight: 600;
  }

  .arrow {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, #ffd8a8, var(--coral));
    position: relative;
  }

  .arrow::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    border: 10px solid transparent;
    border-left: 14px solid var(--coral);
    border-right: 0;
  }

  .cards {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
    margin: 22px auto;
    max-width: 760px;
    user-select: none;
  }

  .card {
    display: grid;
    place-items: center;
    width: clamp(78px, 22vw, 110px);
    height: clamp(84px, 24vw, 128px);
    border-radius: 22px;
    background: var(--c);
    color: #fff;
    font-size: clamp(1.9rem, 8vw, 2.6rem);
    font-weight: 600;
    box-shadow:
      inset 0 -8px 0 rgba(0, 0, 0, 0.15),
      0 6px 14px rgba(45, 42, 74, 0.15);
    touch-action: none;
    cursor: grab;
    font-variant-numeric: tabular-nums;
  }

  .card.placeholder {
    background: transparent;
    color: transparent;
    box-shadow: none;
    border: 4px dashed var(--dash);
  }

  .card.ok {
    outline: 5px solid var(--ok);
    outline-offset: 3px;
  }

  .card.bad {
    outline: 5px solid var(--bad);
    outline-offset: 3px;
    animation: shake 0.4s;
  }

  .ghost {
    position: fixed;
    z-index: 800;
    pointer-events: none;
    cursor: grabbing;
    transform: rotate(-4deg) scale(1.08);
    box-shadow:
      inset 0 -8px 0 rgba(0, 0, 0, 0.15),
      0 18px 30px rgba(45, 42, 74, 0.3);
  }

  .actions {
    display: flex;
    justify-content: center;
  }

  .msg {
    margin-top: 14px;
  }
</style>
